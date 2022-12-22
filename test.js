import { fetchScratchpad, fetchToplist, fetchDiscussion } from "./util/ka.js";

const main = async () => {
  // let res = await fetchToplist();
  // console.log(res);
  // res = await fetchScratchpad(res.programs[0].id);

  // console.log(res);

  // questions
  let res = await fetchDiscussion("questions", "1431776579");
  console.log(res);
};

await main();
