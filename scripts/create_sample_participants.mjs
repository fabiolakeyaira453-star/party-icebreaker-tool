import { fileURLToPath } from "node:url";
import { utils, writeFile } from "xlsx";

const outputPath = fileURLToPath(new URL("../60人测试名单.xlsx", import.meta.url));

const maleNames = [
  "张宇航",
  "李承泽",
  "王浩然",
  "赵明轩",
  "陈俊熙",
  "刘子墨",
  "杨博文",
  "黄景行",
  "周启铭",
  "吴思远",
  "徐嘉佑",
  "孙亦辰",
  "胡一诺",
  "朱彦霖",
  "高书恒",
  "林嘉树",
  "何睿哲",
  "郭子昂",
  "马逸飞",
  "罗清和",
  "梁知远",
  "宋煜城",
  "郑予安",
  "谢凌云",
  "韩景初",
  "唐若川",
  "冯奕然",
  "曹星河",
  "许墨白",
  "邓云舟",
];

const femaleNames = [
  "王语嫣",
  "李清妍",
  "张若曦",
  "陈雨桐",
  "刘芷晴",
  "赵诗涵",
  "杨沐瑶",
  "黄依诺",
  "周安琪",
  "吴思琪",
  "徐嘉宁",
  "孙若琳",
  "胡心怡",
  "朱雅雯",
  "高曼妮",
  "林可欣",
  "何婉清",
  "郭语晨",
  "马晓萱",
  "罗予柔",
  "梁知夏",
  "宋晴岚",
  "郑念慈",
  "谢安然",
  "韩若溪",
  "唐沐橙",
  "冯一朵",
  "曹星月",
  "许晚晴",
  "邓云舒",
];

const teams = ["A队", "B队", "C队", "D队", "E队", "F队"];
const rows = [["姓名", "性别", "团队"]];

for (let index = 0; index < 30; index += 1) {
  rows.push([maleNames[index], "男", teams[index % teams.length]]);
  rows.push([femaleNames[index], "女", teams[index % teams.length]]);
}

const workbook = utils.book_new();
const sheet = utils.aoa_to_sheet(rows);
sheet["!cols"] = [{ wch: 14 }, { wch: 8 }, { wch: 10 }];
sheet["!autofilter"] = { ref: "A1:C61" };
utils.book_append_sheet(workbook, sheet, "参与者名单");

writeFile(workbook, outputPath);
