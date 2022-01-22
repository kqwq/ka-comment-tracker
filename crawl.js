// Import SQLite3
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { getAllDiscussion, fetchToplist } from './util/ka.js'

// Check if the database exists, if not create it
const db = new sqlite3.Database('./storage/all_posts.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the posts database.');
});

// Create the table
db.run('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, parentId INTEGER, key TEXT, programId TEXT, type TEXT, content TEXT, authorKaid TEXT, date TEXT, answerCount INTEGER, replyCount INTEGER, upvotes INTEGER, lowQualityScore REAL, flags STRING)', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('posts table created');
});


async function storeDiscussionPosts(posts) {
  // store the data in the database assynchronously
  if (posts.length == 0) {
    return
  }
  console.log(`Program:${posts[0].programId} Saving ${posts.length} discussion posts`)
  for (let item of posts) {
    await db.run('INSERT INTO posts (id, parentId, key, programId, type, content, authorKaid, date, answerCount, replyCount, upvotes, lowQualityScore, flags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [item.id, item.parentId, item.key, item.programId, item.type, item.content, item.authorKaid, item.date, item.answerCount, item.replyCount, item.upvotes, item.lowQualityScore, item.flags], (err) => {
      if (err) {
        return console.error(err.message);
      }
    });
  }
}

async function main(numberOfPrograms) {
  let page = 1
  let cursor = ""
  let scratchpadN = 0
  let breakNow = false
  while (!breakNow) {
    let topList = await fetchToplist(page, cursor)
    for (let scratchpad of topList.scratchpads) {
      let programId = scratchpad.url.slice(scratchpad.url.lastIndexOf("/") + 1)
      console.log(`========================================`)
      console.log(` #${scratchpadN} https://www.khanacademy.org/cs/c/${programId}`)
      console.log(`========================================`)
      try {
        let posts = await getAllDiscussion(programId)
        await storeDiscussionPosts(posts)
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
  }
      
  // close the database connection
  setTimeout(closeDb, 1000)

}
main(200)

function closeDb() {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection.');
  });
}