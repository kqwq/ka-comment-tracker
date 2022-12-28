import fetch from "node-fetch";
import {
  answersQuery,
  questionsQuery,
  replyQuery,
  tipsThanksQuery,
} from "./queries.js";
import cliProgress from "cli-progress";
import colors from "ansi-colors";

const globalHeaders = {
  // cookie: "KAAS=Na7txrpU7VLU0GdMzLrpww",
  // Referer: "https://www.khanacademy.org/computing/computer-programming/browse",
  // "Referrer-Policy": "strict-origin-when-cross-origin",
};

async function fetchQuestions(programId, progressBar) {
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
    if (json.data.feedback?.feedback?.length > 0) {
      questions = questions.concat(json.data.feedback.feedback);
      progressBar.setTotal(questions.length);
    }
    if (json.data.feedback.isComplete) {
      break;
    } else {
      cursor = json.data.feedback.cursor;
    }
  }
  return questions || [];
}

async function fetchTipsThanks(programId, progressBar, lastTotal = 0) {
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
    if (json.data.feedback?.feedback?.length > 0) {
      tipsThanks = tipsThanks.concat(json.data.feedback.feedback);
      progressBar.setTotal(lastTotal + tipsThanks.length);
    }
    if (json.data.feedback.isComplete) {
      break;
    } else {
      cursor = json.data.feedback.cursor;
    }
  }
  return tipsThanks || [];
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
  let answers = json.data.feedbackByKey.answers || [];
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
  return replies || [];
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

async function fetchHotlist(cursor) {
  if (!cursor) cursor = "";
  let res = await fetch(
    "https://www.khanacademy.org/api/internal/graphql/hotlist",
    {
      headers: globalHeaders,
      body: `{\"operationName\":\"hotlist\",\"query\":\"query hotlist($curationNodeId: String, $onlyOfficialProjectSpinoffs: Boolean!, $sort: ListProgramSortOrder, $pageInfo: ListProgramsPageInfo) {\\n  listTopPrograms(curationNodeId: $curationNodeId, onlyOfficialProjectSpinoffs: $onlyOfficialProjectSpinoffs, sort: $sort, pageInfo: $pageInfo) {\\n    complete\\n    cursor\\n    programs {\\n      id\\n      key\\n      authorKaid\\n      authorNickname\\n      displayableSpinoffCount\\n      imagePath\\n      sumVotesIncremented\\n      translatedTitle: title\\n      url\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\",\"variables\":{\"curationNodeId\":\"xffde7c31\",\"onlyOfficialProjectSpinoffs\":false,\"sort\":\"HOT\",\"pageInfo\":{\"itemsPerPage\":30,\"cursor\":\"${cursor}\"}}}`,
      method: "POST",
    }
  );

  let json = await res.json();
  return json.data.listTopPrograms;
}

let globalCounter = 2198831 + 1;

function addSchema(addToArray, item, typeOverride, programId, parentId) {
  let post = {
    parentId: parentId || 0,
    id: globalCounter++,
    key: typeOverride === "reply" ? "" : item.key,
    expandKey: item.expandKey,
    programId: programId,
    type: typeOverride,
    content: item.content,
    authorKaid: item.author.id,
    date: item.date,

    answerCount: item.answerCount || 0,
    replyCount: item.replyCount,
    upvotes: item.sumVotesIncremented,
    lowQualityScore: item.lowQualityScore,
    // flags: item?.flags?.join(",") || "",
  };
  addToArray.push(post);
}

async function getAllDiscussion(programId) {
  let ansiColorChoices = [
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "redBright",
    "greenBright",
    "yellowBright",
    "blueBright",
    "magentaBright",
    "cyanBright",
  ];
  // Choose a color based on the hour of the day
  let color = ansiColorChoices[new Date().getHours() % ansiColorChoices.length];
  if (programId.toString().length < 16) {
    // If old program ID, use gray
    color = "gray";
  }

  const bar1 = new cliProgress.SingleBar({
    format:
      "     |" +
      colors[color]("{bar}") +
      "| {percentage}% || {value}/{total} top-level posts",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    // hideCursor: true
  });
  let all = [];

  bar1.start(0, 0);
  let questions = await fetchQuestions(programId, bar1);
  let comments = await fetchTipsThanks(programId, bar1, questions.length);

  let ind = 0;
  for (let question of questions) {
    let questionSqlId = globalCounter;
    addSchema(all, question, "question", programId); // Add question

    if (!question?.answers) {
      question.answers = [];
    } else if (question.answers.length < question.answerCount) {
      // If not all answers are shown, fetch them
      question.answers = await fetchAnswers(question.key);
    }

    for (let answer of question.answers) {
      let answerSqlId = globalCounter;
      addSchema(all, answer, "answer", programId, questionSqlId); // Add answer
      if (answer.replyCount > 0) {
        let replies = await fetchReplies(answer.key);
        for (let reply of replies) {
          addSchema(all, reply, "reply", programId, answerSqlId);
        }
      }
    }
    if (question.replyCount > 0) {
      let replies = await fetchReplies(question.key);
      for (let reply of replies) {
        addSchema(all, reply, "reply", programId, questionSqlId);
      }
    }

    ind++;
    bar1.update(ind);
  }
  for (let comment of comments) {
    let commentSqlId = globalCounter;
    addSchema(all, comment, "comment", programId);
    if (comment.replyCount > 0) {
      let replies = await fetchReplies(comment.key);
      for (let reply of replies) {
        addSchema(all, reply, "reply", programId, commentSqlId);
      }
    }

    ind++;
    bar1.update(ind);
  }

  bar1.stop();

  return all;
}

export {
  getAllDiscussion,
  fetchToplist,
  fetchScratchpad,
  fetchQuestions,
  fetchAnswers,
  fetchReplies,
  fetchTipsThanks,
  fetchHotlist,
};
