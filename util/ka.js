import fetch from "node-fetch";
import {
  answersQuery,
  questionsQuery,
  replyQuery,
  tipsThanksQuery,
} from "./queries.js";

let discussionApi = `https://www.khanacademy.org/api/internal/discussions`;

const globalHeaders = {
  // cookie: "KAAS=Na7txrpU7VLU0GdMzLrpww",
  // Referer: "https://www.khanacademy.org/computing/computer-programming/browse",
  // "Referrer-Policy": "strict-origin-when-cross-origin",
};

async function fetchQuestions(programId) {
  let questions = [];
  let res, json;
  let cursor = "";
  while (1) {
    res = await fetch(
      "https://www.khanacademy.org/api/internal/graphql/feedbackQuery",
      {
        headers: globalHeaders,
        body: `{\"operationName\":\"feedbackQuery\",\"variables\":{\"topicId\":\"${programId}\",\"cursor\":\"${cursor}\",\"feedbackType\":\"QUESTION\",\"focusKind\":\"scratchpad\",\"currentSort\":1},\"query\":${questionsQuery}}`,
        method: "POST",
      }
    );
    json = await res.json();
    questions = questions.concat(json.data.feedback.feedback);
    if (json.data.feedback.isComplete) {
      break;
    } else {
      cursor = json.data.feedback.cursor;
    }
  }
  return questions;
}

async function fetchTipsThanks(programId) {
  let tipsThanks = [];
  let res, json;
  let cursor = "";
  while (1) {
    res = await fetch(
      "https://www.khanacademy.org/api/internal/graphql/feedbackQuery",
      {
        headers: globalHeaders,
        body: `{\"operationName\":\"feedbackQuery\",\"variables\":{\"topicId\":\"${programId}\",\"cursor\":\"${cursor}\",\"feedbackType\":\"COMMENT\",\"focusKind\":\"scratchpad\",\"currentSort\":1},\"query\":${tipsThanksQuery}}`,
        method: "POST",
      }
    );
    json = await res.json();
    tipsThanks = tipsThanks.concat(json.data.feedback.feedback);
    if (json.data.feedback.isComplete) {
      break;
    } else {
      cursor = json.data.feedback.cursor;
    }
  }
  return tipsThanks;
}

async function fetchAnswers(key) {
  // kaencrypted key
  let res = await fetch(
    "https://www.khanacademy.org/api/internal/graphql/FeedbackAnswers",
    {
      headers: globalHeaders,
      body: `{"operationName":"FeedbackAnswers","variables":{"parentKey":"${key}"},"query":${answersQuery}}`,
      method: "POST",
    }
  );
  let json = await res.json();
  let answers = json.data.feedbackByKey.answers;
  return answers;
}

async function fetchReplies(key) {
  // kaencrypted key
  let res = await fetch(
    "https://www.khanacademy.org/api/internal/graphql/getFeedbackReplies",
    {
      headers: globalHeaders,
      body: `{\"operationName\":\"getFeedbackReplies\",\"variables\":{\"postKey\":\"${key}\"},\"query\":${replyQuery}}`,
      method: "POST",
    }
  );
  let json = await res.json();
  let replies = json.data.feedbackReplies;
  return replies;
}

/**
 *
 * @param {String} discussionType questions | answers | reply
 * @param {String} programId
 * @param {*} cursorOrParentKey
 *   - Question, cursor: ....
 *   - Answers, parentKey: kaencrypted_....
 * @returns
 */
async function fetchDiscussion(discussionType, programId, cursorOrParentKey) {
  // let res = await fetch(apiMap[type](keyOrId));
  let res;
  let discussionItems = [];
  if (cursorOrParentKey === undefined) {
    cursorOrParentKey = ""; // for initial pages - set empty cursor
  }

  if (discussionType === "questions") {
  } else if (discussionType === "answers") {
  } else if (discussionType === "replies") {
  } else if (discussionType === "tips&thanks") {
    // cursor
    res = await fetch(
      "https://www.khanacademy.org/api/internal/graphql/feedbackQuery",
      {
        headers: globalHeaders,
        body: `{\"operationName\":\"feedbackQuery\",\"variables\":{\"topicId\":\"${programId}\",\"cursor\":\"${cursorOrParentKey}\",\"feedbackType\":\"COMMENT\",\"focusKind\":\"scratchpad\",\"currentSort\":1},\"query\":${tipsThanksQuery}}`,
        method: "POST",
      }
    );
  }

  // Get JSON from response
  let json = await res.json();

  // Get array of discussion items
  switch (discussionType) {
    case "questions":
      discussionItems = json.data.feedback;
      break;
    case "answers":
      discussionItems = json.data.feedbackByKey.answers;
      break;
    case "replies":
      discussionItems = json.data.feedbackReplies;
      break;
    case "tips&thanks":
      discussionItems = json.data.feedback.feedback;
      break;
    default:
      break;
  }

  return discussionItems;
}

async function fetchScratchpad(programId) {
  let res = await fetch(
    "https://www.khanacademy.org/api/internal/graphql/programQuery",
    {
      headers: globalHeaders,
      body: `{"operationName":"programQuery","query":"query programQuery($programId: String!) {\\n  programById(id: $programId) {\\n    byChild\\n    category\\n    created\\n    creatorProfile: author {\\n      id\\n      nickname\\n      profileRoot\\n      profile {\\n        accessLevel\\n        __typename\\n      }\\n      __typename\\n    }\\n    deleted\\n    description\\n    spinoffCount: displayableSpinoffCount\\n    docsUrlPath\\n    flags\\n    flaggedBy: flaggedByKaids\\n    flaggedByUser: isFlaggedByCurrentUser\\n    height\\n    hideFromHotlist\\n    id\\n    imagePath\\n    isProjectOrFork: originIsProject\\n    isOwner\\n    kaid: authorKaid\\n    key\\n    newUrlPath\\n    originScratchpad: originProgram {\\n      deleted\\n      translatedTitle\\n      url\\n      __typename\\n    }\\n    restrictPosting\\n    revision: latestRevision {\\n      id\\n      code\\n      configVersion\\n      created\\n      editorType\\n      folds\\n      __typename\\n    }\\n    slug\\n    sumVotesIncremented\\n    title\\n    topic: parentCurationNode {\\n      id\\n      nodeSlug: slug\\n      relativeUrl\\n      slug\\n      translatedTitle\\n      __typename\\n    }\\n    translatedTitle\\n    url\\n    userAuthoredContentType\\n    upVoted\\n    width\\n    __typename\\n  }\\n}\\n","variables":{"programId":"${programId}"}}`,
      method: "POST",
    }
  );
  let json = await res.json();
  return json.data.programById;
}

/**
 *
 * @param {*} page
 * @param {*} cursor
 * @param {Number} sort 3: hot, 5: top, 2: new, 4: contests
 * @returns
 */
async function fetchToplist(cursor) {
  if (!cursor) cursor = "";
  let res = await fetch(
    "https://www.khanacademy.org/api/internal/graphql/hotlist",
    {
      headers: globalHeaders,
      body: `{"operationName":"hotlist","query":"query hotlist($curationNodeId: String, $onlyOfficialProjectSpinoffs: Boolean!, $sort: ListProgramSortOrder, $pageInfo: ListProgramsPageInfo) {\\n  listTopPrograms(curationNodeId: $curationNodeId, onlyOfficialProjectSpinoffs: $onlyOfficialProjectSpinoffs, sort: $sort, pageInfo: $pageInfo) {\\n    complete\\n    cursor\\n    programs {\\n      id\\n      key\\n      authorKaid\\n      authorNickname\\n      displayableSpinoffCount\\n      imagePath\\n      sumVotesIncremented\\n      translatedTitle: title\\n      url\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n","variables":{"curationNodeId":"xffde7c31","onlyOfficialProjectSpinoffs":false,"sort":"UPVOTE","pageInfo":{"itemsPerPage":30,"cursor":"${cursor}"}}}`,
      method: "POST",
    }
  );

  let json = await res.json();
  return json.data.listTopPrograms;
}

let globalCounter = 1;

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
  };
  addToArray.push(post);
}

async function getAllDiscussion(programId) {
  let all = [];
  let questions = await fetchDiscussion("questions", programId);
  let ind = 0;
  for (let question of questions.feedback) {
    let questionCounter = globalCounter;
    addSchema(all, question, programId);
    for (let answer of question.answers) {
      let answerCounter = globalCounter;
      addSchema(all, answer, programId, questionCounter);
      if (answer.replyCount > 0) {
        let replies = await fetchDiscussion("replies", answer.key);
        for (let reply of replies) {
          addSchema(all, reply, programId, answerCounter);
        }
      }
    }
    if (question.replyCount > 0) {
      let replies = await fetchDiscussion("replies", question.key);
      for (let reply of replies) {
        addSchema(all, reply, programId, questionCounter);
      }
    }

    ind++;
    console.log(
      `Program:${programId} ${ind}/${questions.feedback.length} questions done`
    );
  }

  let comments = await fetchDiscussion("tips&thanks", programId);
  ind = 0;
  for (let comment of comments.feedback) {
    let commentCounter = globalCounter;
    addSchema(all, comment, programId);
    if (comment.replyCount > 0) {
      let replies = await fetchDiscussion("replies", comment.key);
      for (let reply of replies) {
        addSchema(all, reply, programId, commentCounter);
      }
    }

    ind++;
    console.log(
      `Program:${programId} ${ind}/${comments.feedback.length} comments done`
    );
  }

  return all;
}

export { getAllDiscussion, fetchToplist, fetchScratchpad, fetchDiscussion };
