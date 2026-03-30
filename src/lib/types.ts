export type AgentStatus =
  | "idle"
  | "thinking"
  | "delegating"
  | "blocked"
  | "delivering";

export type AgentLane =
  | "command"
  | "planning"
  | "research"
  | "execution"
  | "quality";

export type AgentNode = {
  id: string;
  name: string;
  role: string;
  managerId: string | null;
  lane: AgentLane;
  status: AgentStatus;
  workload: number;
  summary: string;
};

export type CollaborationEdge = {
  sourceId: string;
  targetId: string;
  strength: number;
  reason: string;
};

export type OrgGraph = {
  agents: AgentNode[];
  collaborations: CollaborationEdge[];
};

export type PositionedAgentNode = AgentNode & {
  childIds: string[];
  tier: number;
  tierIndex: number;
  position: [number, number, number];
};

export type HierarchyEdge = {
  managerId: string;
  reportId: string;
};

export type OrgLayout = {
  rootId: string;
  tierOrder: string[][];
  nodes: Record<string, PositionedAgentNode>;
  hierarchyEdges: HierarchyEdge[];
};

export type StatusFilter = AgentStatus | "all";

export const STATUS_META: Record<
  AgentStatus,
  { label: string; accent: string; glow: string }
> = {
  idle: {
    label: "Idle",
    accent: "#6f8ea4",
    glow: "rgba(128, 180, 216, 0.32)",
  },
  thinking: {
    label: "Thinking",
    accent: "#7ad4ff",
    glow: "rgba(58, 178, 255, 0.4)",
  },
  delegating: {
    label: "Delegating",
    accent: "#9bfca8",
    glow: "rgba(108, 255, 168, 0.35)",
  },
  blocked: {
    label: "Blocked",
    accent: "#ffb25e",
    glow: "rgba(255, 155, 68, 0.35)",
  },
  delivering: {
    label: "Delivering",
    accent: "#b4fdff",
    glow: "rgba(112, 250, 255, 0.38)",
  },
};

export const LANE_META: Record<
  AgentLane,
  { label: string; accent: string; panel: string }
> = {
  command: {
    label: "Command",
    accent: "#7ad4ff",
    panel: "rgba(36, 68, 89, 0.45)",
  },
  planning: {
    label: "Planning",
    accent: "#a9f871",
    panel: "rgba(44, 76, 32, 0.44)",
  },
  research: {
    label: "Research",
    accent: "#7bc2ff",
    panel: "rgba(27, 59, 104, 0.42)",
  },
  execution: {
    label: "Execution",
    accent: "#ffd580",
    panel: "rgba(90, 62, 24, 0.4)",
  },
  quality: {
    label: "Quality",
    accent: "#ff9ec6",
    panel: "rgba(96, 35, 69, 0.38)",
  },
};
