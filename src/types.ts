export type Gender = "male" | "female";

export type Participant = {
  id: string;
  name: string;
  gender: Gender;
  team: string;
  drawn: boolean;
};

export type ActivityGroup = {
  id: string;
  activityName: string;
  activityDescription: string;
  groupNumber: number;
  members: Participant[];
};

export type ActivityDefinition = {
  id: string;
  name: string;
  description: string;
};

export type TabKey = "participants" | "draw" | "groups";
