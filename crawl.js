// Import SQLite3
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { getAllDiscussion, fetchToplist, fetchScratchpad } from './util/ka.js'

// Check if the database exists, if not create it
const db = new sqlite3.Database('./storage/all_posts.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the posts database.');
});

// Create the table
db.run('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, parentId INTEGER, programId TEXT, type TEXT, content TEXT, authorKaid TEXT, date DATETIME, answerCount INTEGER, replyCount INTEGER, upvotes INTEGER, lowQualityScore REAL, flags STRING, key TEXT)', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('posts table created');
});
db.run('CREATE TABLE IF NOT EXISTS scratchpads (programId TEXT, dateRetrieved DATETIME, title TEXT, datePublished DATETIME, lastUpdated DATETIME, type TEXT, codeLength INTEGER, authorKaid TEXT, votes INTEGER, spinoffs INTEGER, postCount INTEGER, questionCount INTEGER, answerCount INTEGER, commentCount INTEGER, replyCount INTEGER)', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('scratchpads table created');
});


async function storeDiscussionPosts(pad, posts) {
  // store the data in the database assynchronously
  if (posts.length == 0) {
    return
  }
  console.log(`Program:${pad.id} Saving ${posts.length} discussion posts`)
  for (let item of posts) {
    await db.run('INSERT INTO posts (id, parentId, programId, type, content, authorKaid, date, answerCount, replyCount, upvotes, lowQualityScore, flags, key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [item.id, item.parentId,  item.programId, item.type, item.content, item.authorKaid, item.date, item.answerCount, item.replyCount, item.upvotes, item.lowQualityScore, item.flags, item.key], (err) => {
      if (err) {
        return console.error(err.message);
      }
    });
  }
  let dateRetrieved = new Date().toISOString()
  let postCount = posts.length
  let questionCount = posts.filter(item => item.type == "question").length
  let answerCount = posts.filter(item => item.type == "answer").length
  let commentCount = posts.filter(item => item.type == "comment").length
  let replyCount = posts.filter(item => item.type == "reply").length
  await db.run('INSERT INTO scratchpads (programId, dateRetrieved, title, datePublished, lastUpdated, type, codeLength, authorKaid, votes, spinoffs, postCount, questionCount, answerCount, commentCount, replyCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [pad.id.toString(), dateRetrieved, pad.title, pad.created, pad.date, pad.userAuthoredContentType, pad.revision.code.length, pad.kaid, pad.sumVotesIncremented, pad.spinoffCount, postCount, questionCount, answerCount, commentCount, replyCount], (err) => {
    if (err) {
      return console.error(err.message);
    }
  });

}

async function main(numberOfPrograms) {
  let page = 0
  let cursor = ""
  let lastProgramId = ""
  let scratchpadN = 1
  let breakNow = false
  while (!breakNow) {
    let topList = await fetchToplist(page, cursor)
    for (let scratchpad of topList.scratchpads) {
      let programId = scratchpad.url.slice(scratchpad.url.lastIndexOf("/") + 1)

      try {
        let fullScratchpad = await fetchScratchpad(programId)
        console.log(`========================================`)
        console.log(` #${scratchpadN} https://www.khanacademy.org/cs/c/${programId}`)
        console.log(`     ${fullScratchpad?.title}`)
        console.log(`========================================`)
        lastProgramId = fullScratchpad.id.toString()
        let posts = await getAllDiscussion(programId)
        await storeDiscussionPosts(fullScratchpad, posts)
      } catch (e) {
        // Write error to file
        fs.appendFile('error.txt', `${e}\n`, (err) => {
          if (err) throw err;
          console.log('Error written to file');
        });
        console.log(`=== ERROR: ${e}, skipping program ${programId} ===`)
      }
      scratchpadN++
      if (scratchpadN >= numberOfPrograms) {
        breakNow = true
        return
      }
    }
    cursor = topList.cursor
    page++

    // write cursor to file
    fs.writeFileSync('cursor.txt', JSON.stringify({
      cursor,
      lastProgramId,
      page,
      scratchpadN,
      date: new Date().toISOString()
    }))
  }

  // close the database connection
  setTimeout(closeDb, 5)

}
main(10000 * 500)

function closeDb() {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection.');
  });
}