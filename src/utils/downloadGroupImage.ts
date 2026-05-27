import { ActivityGroup } from "../types";

export function createGroupsImageDataUrl(groups: ActivityGroup[]) {
  if (groups.length === 0) return "";

  const width = 1400;
  const outerMargin = 24;
  const framePaddingX = 24;
  const framePaddingY = 32;
  const cardGap = 16;
  const contentTop = 176;
  const contentX = outerMargin + framePaddingX;
  const cardWidth = (width - contentX * 2 - cardGap) / 2;
  const cardX = Math.round((width - cardWidth) / 2);
  const cardPadding = 16;
  const cardInnerWidth = cardWidth - cardPadding * 2;
  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  if (!measureContext) return "";

  const cardLayouts = groups.map((group) => {
    measureContext.font = "400 18px sans-serif";
    const descriptionLines = wrapTextToWidth(
      measureContext,
      group.activityDescription || "暂无简介",
      cardInnerWidth,
    );
    measureContext.font = "600 19px sans-serif";
    const memberLines = wrapTextToWidth(
      measureContext,
      group.members.map((member) => member.name).join("、"),
      cardInnerWidth,
    );
    const descriptionTop = cardPadding + 116;
    const memberCountY = descriptionTop + descriptionLines.length * 28 + 34;
    const memberStartY = memberCountY + 38;
    const contentBottom = memberStartY + Math.max(1, memberLines.length) * 30;

    return {
      group,
      descriptionLines,
      memberLines,
      height: Math.max(260, contentBottom + cardPadding),
    };
  });

  const contentHeight =
    cardLayouts.reduce((total, layout) => total + layout.height, 0) +
    Math.max(0, cardLayouts.length - 1) * cardGap;
  const height = contentTop + contentHeight + framePaddingY + outerMargin;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return "";

  canvas.width = width * 2;
  canvas.height = height * 2;
  context.scale(2, 2);

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#0f766e";
  roundRect(context, outerMargin, outerMargin, width - outerMargin * 2, height - outerMargin * 2, 30);
  context.fill();

  context.fillStyle = "#ffffff";
  roundRect(
    context,
    outerMargin + 10,
    outerMargin + 10,
    width - (outerMargin + 10) * 2,
    height - (outerMargin + 10) * 2,
    24,
  );
  context.fill();

  context.fillStyle = "#0f172a";
  context.font = "800 44px sans-serif";
  context.fillText("活动分组", contentX, 104);

  context.fillStyle = "#64748b";
  context.font = "400 20px sans-serif";
  context.fillText(`共 ${groups.length} 组 · 聚会破冰工具`, contentX, 142);

  let y = contentTop;
  cardLayouts.forEach((layout, index) => {
    const x = cardX;

    context.fillStyle = "#f8fafc";
    roundRect(context, x, y, cardWidth, layout.height, 22);
    context.fill();

    context.strokeStyle = "#e2e8f0";
    context.lineWidth = 1;
    roundRect(context, x, y, cardWidth, layout.height, 22);
    context.stroke();

    context.fillStyle = "#cc5f10";
    roundRect(context, x + cardPadding, y + cardPadding, 106, 38, 19);
    context.fill();

    context.fillStyle = "#ffffff";
    context.font = "700 18px sans-serif";
    context.fillText(`队伍 ${layout.group.groupNumber}`, x + cardPadding + 22, y + cardPadding + 25);

    context.fillStyle = "#0f172a";
    context.font = "800 30px sans-serif";
    context.fillText(
      truncateText(context, layout.group.activityName, cardWidth - cardPadding * 2),
      x + cardPadding,
      y + cardPadding + 78,
    );

    context.fillStyle = "#64748b";
    context.font = "400 18px sans-serif";
    layout.descriptionLines.forEach((line, lineIndex) => {
      context.fillText(line, x + cardPadding, y + cardPadding + 116 + lineIndex * 28);
    });

    const memberY = y + cardPadding + 150 + layout.descriptionLines.length * 28;
    context.fillStyle = "#0f766e";
    context.font = "700 18px sans-serif";
    context.fillText(`${layout.group.members.length} 人`, x + cardPadding, memberY);

    context.fillStyle = "#0f172a";
    context.font = "600 19px sans-serif";
    layout.memberLines.forEach((line, lineIndex) => {
      context.fillText(line, x + cardPadding, memberY + 38 + lineIndex * 30);
    });

    y += layout.height + (index === cardLayouts.length - 1 ? 0 : cardGap);
  });

  return canvas.toDataURL("image/png");
}

export function downloadImageDataUrl(dataUrl: string, filename = "活动分组图片.png") {
  if (!dataUrl) return;

  const link = document.createElement("a");
  link.download = safeFileName(filename);
  link.href = dataUrl;
  link.click();
}

function wrapTextToWidth(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const cleanText = text.trim() || "暂无简介";
  const lines: string[] = [];
  let currentLine = "";

  for (const char of cleanText) {
    const nextLine = `${currentLine}${char}`;
    if (currentLine && context.measureText(nextLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : ["暂无简介"];
}

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "-").slice(0, 32) || "活动分组";
}

function truncateText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (context.measureText(text).width <= maxWidth) return text;

  let result = text;
  while (result.length > 0 && context.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }

  return `${result}…`;
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
