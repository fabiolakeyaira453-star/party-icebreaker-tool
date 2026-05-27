import { ActivityDefinition, ActivityGroup, Gender, Participant } from "../types";
import { shuffleArray } from "./random";

type GroupDraft = {
  members: Participant[];
  teams: Set<string>;
};

export function generateActivityGroups(
  participants: Participant[],
  activities: ActivityDefinition[],
): ActivityGroup[] {
  const validActivities = activities.filter((activity) => activity.name.trim());
  if (participants.length === 0 || validActivities.length === 0) return [];

  const groupCount = validActivities.length;
  const baseSize = Math.floor(participants.length / groupCount);
  const biggerGroupCount = participants.length % groupCount;
  const drafts: GroupDraft[] = Array.from({ length: groupCount }, () => ({
    members: [],
    teams: new Set<string>(),
  }));

  const genderBuckets: Record<Gender, Participant[]> = {
    male: [],
    female: [],
  };

  participants.forEach((participant) => {
    genderBuckets[participant.gender].push(participant);
  });

  const orderedPeople = [
    ...interleaveByGender([
      shuffleArray(genderBuckets.female),
      shuffleArray(genderBuckets.male),
    ]),
  ];

  orderedPeople.forEach((participant) => {
    const targetGroup = findBestGroup(
      drafts,
      participant,
      groupTargetSizes(groupCount, baseSize, biggerGroupCount),
    );
    targetGroup.members.push(participant);
    targetGroup.teams.add(participant.team);
  });

  return drafts.map((group, index) => ({
    id: `group-${index + 1}`,
    activityName: validActivities[index].name.trim(),
    activityDescription: validActivities[index].description.trim(),
    groupNumber: index + 1,
    members: group.members,
  }));
}

function interleaveByGender(buckets: Participant[][]): Participant[] {
  const result: Participant[] = [];
  const maxLength = Math.max(...buckets.map((bucket) => bucket.length));

  for (let round = 0; round < maxLength; round += 1) {
    buckets.forEach((bucket) => {
      if (bucket[round]) result.push(bucket[round]);
    });
  }

  return result;
}

function findBestGroup(
  groups: GroupDraft[],
  participant: Participant,
  targetSizes: number[],
): GroupDraft {
  const availableGroups = groups.filter(
    (group, index) => group.members.length < targetSizes[index],
  );
  const candidates = availableGroups.length > 0 ? availableGroups : groups;
  const withoutSameTeam = candidates.filter((group) => !group.teams.has(participant.team));
  const pool = withoutSameTeam.length > 0 ? withoutSameTeam : candidates;
  const smallestSize = Math.min(...pool.map((group) => group.members.length));
  const smallestGroups = pool.filter((group) => group.members.length === smallestSize);

  return shuffleArray(smallestGroups)[0];
}

function groupTargetSizes(groupCount: number, baseSize: number, biggerGroupCount: number) {
  return Array.from({ length: groupCount }, (_, index) =>
    index < biggerGroupCount ? baseSize + 1 : baseSize,
  );
}
