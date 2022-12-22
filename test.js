import {
  fetchScratchpad,
  fetchToplist,
  fetchQuestions,
  getAllDiscussion,
} from "./util/ka.js";
import fs from "fs";
const main = async () => {
  // let res = await fetchToplist();
  // console.log(res);
  // res = await fetchScratchpad(res.programs[0].id);

  // console.log(res);

  // questions
  let posts = await getAllDiscussion("4788607474253824");
  console.log("DONE!");

  // Write to file
  fs.appendFile("posts.txt", JSON.stringify(posts), (err) => {
    if (err) throw err;
    console.log("Posts written to file");
  });
};

await main();
