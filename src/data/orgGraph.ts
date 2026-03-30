import type { OrgGraph } from "../lib/types";

export const clawcoGraph: OrgGraph = {
  agents: [
    {
      id: "atlas",
      name: "Atlas",
      role: "Orchestrator",
      managerId: null,
      lane: "command",
      status: "thinking",
      workload: 0.74,
      summary:
        "Maintains the global plan, allocates agent attention, and keeps the whole organization pointed at the current objective.",
    },
    {
      id: "loom",
      name: "Loom",
      role: "Planner Agent",
      managerId: "atlas",
      lane: "planning",
      status: "delegating",
      workload: 0.83,
      summary:
        "Breaks the objective into workstreams, sequences handoffs, and routes scoped asks to the right specialists.",
    },
    {
      id: "quarry",
      name: "Quarry",
      role: "Research Agent",
      managerId: "atlas",
      lane: "research",
      status: "thinking",
      workload: 0.68,
      summary:
        "Pulls together source material, surfaces relevant evidence, and maps ambiguity before execution begins.",
    },
    {
      id: "relay",
      name: "Relay",
      role: "Execution Agent",
      managerId: "atlas",
      lane: "execution",
      status: "delivering",
      workload: 0.71,
      summary:
        "Turns approved plans into concrete outputs, shipping assets and handling the final operational handoff.",
    },
    {
      id: "prism",
      name: "Prism",
      role: "Review Agent",
      managerId: "atlas",
      lane: "quality",
      status: "blocked",
      workload: 0.48,
      summary:
        "Audits changes for correctness, flags regressions, and blocks work that is still carrying unresolved risk.",
    },
    {
      id: "glyph",
      name: "Glyph",
      role: "Analysis Agent",
      managerId: "loom",
      lane: "planning",
      status: "thinking",
      workload: 0.64,
      summary:
        "Refines plan details, pressure-tests assumptions, and produces briefs that keep downstream work tight and local.",
    },
    {
      id: "signal",
      name: "Signal",
      role: "Coordination Agent",
      managerId: "loom",
      lane: "planning",
      status: "delegating",
      workload: 0.57,
      summary:
        "Tracks who is paired with whom, monitors work overlap, and nudges the right agents into active collaboration.",
    },
    {
      id: "ember",
      name: "Ember",
      role: "Delivery Agent",
      managerId: "relay",
      lane: "execution",
      status: "delivering",
      workload: 0.79,
      summary:
        "Packages the final artifact, coordinates the finish, and ensures the finished work lands with crisp presentation.",
    },
  ],
  collaborations: [
    {
      sourceId: "atlas",
      targetId: "loom",
      strength: 0.96,
      reason: "Priority steering",
    },
    {
      sourceId: "loom",
      targetId: "quarry",
      strength: 0.82,
      reason: "Research requests",
    },
    {
      sourceId: "loom",
      targetId: "relay",
      strength: 0.78,
      reason: "Execution sequencing",
    },
    {
      sourceId: "quarry",
      targetId: "glyph",
      strength: 0.73,
      reason: "Evidence synthesis",
    },
    {
      sourceId: "signal",
      targetId: "relay",
      strength: 0.76,
      reason: "Cross-team coordination",
    },
    {
      sourceId: "signal",
      targetId: "prism",
      strength: 0.58,
      reason: "Risk escalation",
    },
    {
      sourceId: "relay",
      targetId: "ember",
      strength: 0.88,
      reason: "Final packaging",
    },
    {
      sourceId: "prism",
      targetId: "ember",
      strength: 0.42,
      reason: "Quality signoff",
    },
    {
      sourceId: "glyph",
      targetId: "prism",
      strength: 0.61,
      reason: "Review preparation",
    },
  ],
};
