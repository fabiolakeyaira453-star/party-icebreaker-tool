import { ActivityDefinition, Gender, Participant } from "../types";

export function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeGender(value: string): Gender {
  const cleanValue = value.trim().toLowerCase();

  if (["男", "男性", "male", "m", "boy"].includes(cleanValue)) return "male";
  if (["女", "女性", "female", "f", "girl"].includes(cleanValue)) return "female";
  return "male";
}

export function genderLabel(gender: Gender) {
  const labels: Record<Gender, string> = {
    male: "男",
    female: "女",
  };

  return labels[gender];
}

export function parseParticipantImport(input: string): Participant[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", gender = "", team = ""] = line
        .split(",")
        .map((part) => part.trim());

      return {
        id: createId(),
        name,
        gender: normalizeGender(gender),
        team: team || "未分配",
        drawn: false,
      };
    })
    .filter((participant) => participant.name);
}

export async function parseParticipantExcel(file: File): Promise<Participant[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Array<string | number | undefined>>(firstSheet, {
    header: 1,
    blankrows: false,
  });

  const dataRows = rows.filter((row) => row.some((cell) => String(cell ?? "").trim()));
  const firstRowText = dataRows[0]?.map((cell) => String(cell ?? "")).join(",");
  const rowsWithoutHeader =
    firstRowText && /姓名|名字|性别|团队|队伍/.test(firstRowText)
      ? dataRows.slice(1)
      : dataRows;

  return rowsWithoutHeader
    .map((row) => {
      const [name = "", gender = "", team = ""] = row.map((cell) =>
        String(cell ?? "").trim(),
      );

      return {
        id: createId(),
        name,
        gender: normalizeGender(gender),
        team: team || "未分配",
        drawn: false,
      };
    })
    .filter((participant) => participant.name);
}

export async function parseActivityExcel(file: File): Promise<ActivityDefinition[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Array<string | number | undefined>>(firstSheet, {
    header: 1,
    blankrows: false,
  });

  const dataRows = rows.filter((row) => row.some((cell) => String(cell ?? "").trim()));
  const firstRowText = dataRows[0]?.map((cell) => String(cell ?? "")).join(",");
  const rowsWithoutHeader =
    firstRowText && /活动|名称|简介|介绍|说明/.test(firstRowText)
      ? dataRows.slice(1)
      : dataRows;

  return rowsWithoutHeader
    .map((row) => {
      const [name = "", description = ""] = row.map((cell) => String(cell ?? "").trim());

      return {
        id: createId(),
        name,
        description,
      };
    })
    .filter((activity) => activity.name);
}
