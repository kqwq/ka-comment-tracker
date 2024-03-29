// Import SQLite3
import sqlite3 from "sqlite3";
import fs from "fs";
import {
  getAllDiscussion,
  fetchToplist,
  fetchScratchpad,
  fetchHotlist,
} from "./util/ka.js";

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

// Check if the database exists, if not create it
const uniqueDatetime = "large_sized"; // new Date().toISOString().replace(/:/g, "-");
const db = new sqlite3.Database(`./storage/${uniqueDatetime}.db`, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connected to the posts database.");
});

// Create the table
db.run(
  "CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, parentId INTEGER, programId TEXT, type TEXT, content TEXT, authorKaid TEXT, date DATETIME, answerCount INTEGER, replyCount INTEGER, upvotes INTEGER, lowQualityScore REAL, key TEXT, expandKey TEXT)",
  (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("posts table created");
  }
);
db.run(
  "CREATE TABLE IF NOT EXISTS scratchpads (programId TEXT, dateRetrieved DATETIME, title TEXT, datePublished DATETIME, lastUpdated DATETIME, type TEXT, codeLength INTEGER, authorKaid TEXT, votes INTEGER, spinoffs INTEGER, postCount INTEGER, questionCount INTEGER, answerCount INTEGER, commentCount INTEGER, replyCount INTEGER)",
  (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("scratchpads table created");
  }
);

async function storeDiscussionPosts(pad, posts) {
  // store the data in the database assynchronously
  if (posts.length == 0) {
    return;
  }
  console.log(`     Program:${pad.id} Saving ${posts.length} discussion posts`);
  for (let item of posts) {
    await db.run(
      "INSERT INTO posts (id, parentId, programId, type, content, authorKaid, date, answerCount, replyCount, upvotes, lowQualityScore, key, expandKey) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        item.id,
        item.parentId,
        item.programId,
        item.type,
        item.content,
        item.authorKaid,
        item.date,
        item.answerCount,
        item.replyCount,
        item.upvotes,
        item.lowQualityScore,
        item.key, // NEED BOTH
        item.expandKey, // NOT item.key! Had to restart a process that had been running for 19 hours because of this mistake.
      ],
      (err) => {
        if (err) {
          return console.error(err.message);
        }
      }
    );
  }
  let dateRetrieved = new Date().toISOString();
  let postCount = posts.length;
  let questionCount = posts.filter((item) => item.type == "question").length;
  let answerCount = posts.filter((item) => item.type == "answer").length;
  let commentCount = posts.filter((item) => item.type == "comment").length;
  let replyCount = posts.filter((item) => item.type == "reply").length;
  await db.run(
    "INSERT INTO scratchpads (programId, dateRetrieved, title, datePublished, lastUpdated, type, codeLength, authorKaid, votes, spinoffs, postCount, questionCount, answerCount, commentCount, replyCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      pad.id.toString(),
      dateRetrieved,
      pad.title,
      pad.created,
      pad.revision.created,
      pad.userAuthoredContentType,
      pad.revision.code.length,
      pad.kaid,
      pad.sumVotesIncremented,
      pad.spinoffCount,
      postCount,
      questionCount,
      answerCount,
      commentCount,
      replyCount,
    ],
    (err) => {
      if (err) {
        return console.error(err.message);
      }
    }
  );
}

async function main(numberOfPrograms) {
  let page = 0;
  let cursor =
    "Cj4KDQoHdXB2b3RlcxICCAUSKWoOc35raGFuLWFjYWRlbXlyFwsSClNjcmF0Y2hwYWQYgICd7pPt7QgMGAAgAQ";
  let lastProgramId = "";
  let scratchpadN = 82231 + 1;

  let skipList = [
    "4990596228268032",
    "4990256584196096",
    "4990243746299904",
    "4990002723028992",
  ];

  let breakNow = false;
  while (!breakNow) {
    let topList = await fetchToplist(cursor); // change to fetchHotlist to get hotlist instead
    for (let scratchpad of topList.programs) {
      let programId = scratchpad.url.slice(scratchpad.url.lastIndexOf("/") + 1);

      // If program is in skip list, skip it and console log which one
      if (skipList.includes(programId)) {
        console.log(`=== Skipping ${programId} ===`);
        continue;
      }

      try {
        let fullScratchpad = await fetchScratchpad(programId);
        console.log(`========================================`);
        console.log(
          ` #${scratchpadN} https://www.khanacademy.org/cs/c/${programId}`
        );
        console.log(`     ${fullScratchpad?.title}`);
        lastProgramId = fullScratchpad.id.toString();
        let posts = await getAllDiscussion(programId);
        await storeDiscussionPosts(fullScratchpad, posts);
      } catch (e) {
        // Write error to file
        fs.appendFile(
          "error.txt",
          `${e} | skipping program ${programId}  \n`,
          (err) => {
            if (err) throw err;
            console.log("Error writting to file");
          }
        );
        console.log(`=== ERROR: ${e}, skipping program ${programId} ===`);
      }
      scratchpadN++;
      if (scratchpadN >= numberOfPrograms) {
        breakNow = true;
        return;
      }

      // await sleep(4000); // wait 4 seconds to avoid rate limiting
    }
    cursor = topList.cursor;
    page++;

    // write cursor to file
    fs.writeFileSync(
      "cursor.txt",
      JSON.stringify({
        cursor,
        lastProgramId,
        page,
        scratchpadN,
        date: new Date().toISOString(),
      })
    );
  }

  // close the database connection
  setTimeout(closeDb, 5);
}
main(1000 * 1000 * 10);

function closeDb() {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Close the database connection.");
  });
}
