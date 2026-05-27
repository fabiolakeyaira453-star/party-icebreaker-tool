import { fileURLToPath } from "node:url";
import { utils, writeFile } from "xlsx";

const outputPath = fileURLToPath(new URL("../7个活动测试表.xlsx", import.meta.url));

const rows = [
  ["活动名称", "活动简介"],
  ["盲盒话题局", "每人抽取一个轻松话题卡，用 2 分钟分享自己的答案，适合快速破冰。"],
  ["默契二选一", "主持人抛出二选一问题，成员快速站队并说明理由，帮助大家发现共同点。"],
  ["城市漫游搭子", "围绕旅行、美食、运动等生活场景配对交流，找到有相似兴趣的新朋友。"],
  ["三分钟交换名片", "每轮两人互相介绍三个关键词，时间到后换人，适合高效认识更多人。"],
  ["即兴小队挑战", "小组抽取一个简单任务共同完成，强调协作和轻松互动。"],
  ["共同点搜寻", "小组在限定时间内找出尽可能多的共同点，最后派代表分享。"],
  ["心动提问箱", "成员从提问箱抽取问题自由回答，问题轻松、有边界，适合活动后半段升温。"],
];

const workbook = utils.book_new();
const sheet = utils.aoa_to_sheet(rows);
sheet["!cols"] = [{ wch: 18 }, { wch: 46 }];
sheet["!autofilter"] = { ref: "A1:B8" };
utils.book_append_sheet(workbook, sheet, "活动列表");

writeFile(workbook, outputPath);
