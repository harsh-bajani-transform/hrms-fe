import type { TrackerRow } from "../dashboard/types";

export interface QATaskNameMap {
  [taskId: string]: string;
}

export interface QAAgentTrackersMap {
  [userId: string]: TrackerRow[];
}

export interface QAExpandedAgentsMap {
  [userId: string]: boolean;
}
