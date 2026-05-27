import { ActivityDefinition, ActivityGroup, Participant } from "../types";

const STORAGE_KEY = "party-icebreaker-participants";
const ACTIVITY_STORAGE_KEY = "party-icebreaker-activities";
const GROUP_STORAGE_KEY = "party-icebreaker-groups";

export function loadParticipants(): Participant[] {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isParticipant);
  } catch {
    return [];
  }
}

export function saveParticipants(participants: Participant[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
}

export function loadActivities(fallback: ActivityDefinition[]): ActivityDefinition[] {
  try {
    const rawValue = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!rawValue) return fallback;

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return fallback;

    return parsed.filter(isActivity);
  } catch {
    return fallback;
  }
}

export function saveActivities(activities: ActivityDefinition[]) {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
}

export function loadGroups(): ActivityGroup[] {
  try {
    const rawValue = localStorage.getItem(GROUP_STORAGE_KEY);
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isActivityGroup);
  } catch {
    return [];
  }
}

export function saveGroups(groups: ActivityGroup[]) {
  localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groups));
}

function isParticipant(value: unknown): value is Participant {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Participant;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    ["male", "female"].includes(candidate.gender) &&
    typeof candidate.team === "string" &&
    typeof candidate.drawn === "boolean"
  );
}

function isActivity(value: unknown): value is ActivityDefinition {
  if (!value || typeof value !== "object") return false;

  const candidate = value as ActivityDefinition;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.description === "string"
  );
}

function isActivityGroup(value: unknown): value is ActivityGroup {
  if (!value || typeof value !== "object") return false;

  const candidate = value as ActivityGroup;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.activityName === "string" &&
    typeof candidate.activityDescription === "string" &&
    typeof candidate.groupNumber === "number" &&
    Array.isArray(candidate.members) &&
    candidate.members.every(isParticipant)
  );
}
