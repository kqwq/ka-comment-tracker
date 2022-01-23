

import fetch from 'node-fetch';

let discussionApi = `https://www.khanacademy.org/api/internal/discussions`

let apiMap = {
  "questions": (id) => {
    return `${discussionApi}/scratchpad/${id}/questions?limit=1000000&sort=1`
  },
  "feedback": (id) => {
    return `${discussionApi}/scratchpad/${id}/comments?limit=1000000&sort=1`
  },
  "replies": (key) => {
    return `${discussionApi}/${key}/replies`
  },
}

async function fetchDiscussion(type, keyOrId) {
  let res = await fetch(apiMap[type](keyOrId))
  let data = await res.json()
  return data
}

async function fetchScratchpad(id) {
  let res = await fetch(`https://www.khanacademy.org/api/internal/scratchpads/${id}`)
  let data = await res.json()
  return data
}

/**
 * 
 * @param {*} page 
 * @param {*} cursor 
 * @param {Number} sort 3: hot, 5: top, 2: new, 4: contests
 * @returns 
 */
async function fetchToplist(page, cursor, sort) {
  sort = sort || 5
  let res = await fetch(`https://www.khanacademy.org/api/internal/scratchpads/top?sort=${sort}&topic_id=xffde7c31&page=${page}&limit=30${cursor ? `&cursor=${cursor}` : ""}`)
  let data = await res.json()
  return data
}

let globalCounter =  1

function addSchema(addToArray, item, programId, parentId) {
  let post = {
    parentId: parentId || 0,
    id: globalCounter++,
    key: item.type === "reply" ? "" : item.key,
    programId: programId,
    type: item.type,
    content: item.content,
    authorKaid: item.authorKaid,
    date: item.date,

    answerCount: item.answerCount,
    replyCount: item.replyCount,
    upvotes: item.sumVotesIncremented,
    lowQualityScore: item.lowQualityScore,
    flags: item.flags.join(","),
  }
  addToArray.push(post)
}


    

async function getAllDiscussion(programId) {
  let all = []
  let questions = await fetchDiscussion("questions", programId)
  let ind = 0
  for (let question of questions.feedback) {
    let questionCounter = globalCounter
    addSchema(all, question, programId)
    for (let answer of question.answers) {
      let answerCounter = globalCounter
      addSchema(all, answer, programId, questionCounter)
      if (answer.replyCount > 0) {
        let replies = await fetchDiscussion("replies", answer.key)
        for (let reply of replies) {
          addSchema(all, reply, programId, answerCounter)
        }
      }
    }
    if (question.replyCount > 0) {
      let replies = await fetchDiscussion("replies", question.key)
      for (let reply of replies) {
        addSchema(all, reply, programId, questionCounter)
      }
    }

    ind++
    console.log(`Program:${programId} ${ind}/${questions.feedback.length} questions done`)
  }

  let comments = await fetchDiscussion("feedback", programId)
  ind = 0
  for (let comment of comments.feedback) {
    let commentCounter = globalCounter
    addSchema(all, comment, programId)
    if (comment.replyCount > 0) {
      let replies = await fetchDiscussion("replies", comment.key)
      for (let reply of replies) {
        addSchema(all, reply, programId, commentCounter)
      }
    }

    ind++
    console.log(`Program:${programId} ${ind}/${comments.feedback.length} comments done`)
  }

  return all
}




export { getAllDiscussion, fetchToplist, fetchScratchpad };