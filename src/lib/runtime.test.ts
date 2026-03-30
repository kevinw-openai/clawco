import { afterEach, describe, expect, it, vi } from "vitest";

import { clawcoGraph } from "../data/orgGraph";
import { loadRuntimeGraph } from "./runtime";

describe("loadRuntimeGraph", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to demo data when the snapshot endpoint is not configured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 404,
      }))
    );

    const state = await loadRuntimeGraph(clawcoGraph);

    expect(state.source).toBe("demo");
    expect(state.graph).toEqual(clawcoGraph);
  });

  it("loads snapshot data when the endpoint succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          generatedAt: "2026-03-29T00:00:00.000Z",
          team: {
            name: "Task Squad",
          },
          agents: [
            {
              id: "main",
              name: "main",
              role: "Coordinator",
              managerId: null,
              lane: "command",
              status: "thinking",
              workload: 0.5,
              summary: "Keeps the team aligned",
              workspace: "/tmp/workspace",
              agentDir: "/tmp/agent",
              subagents: ["developer"],
              stats: {
                queued: 1,
                inProgress: 1,
                completed: 2,
                failed: 0,
                canceled: 0,
                activeTaskIds: ["task-1"],
              },
              activeTasks: [
                {
                  id: "task-1",
                  title: "Build feature",
                  status: "in_progress",
                  createdByAgentId: "main",
                  assignedToAgentId: "developer",
                  updatedAt: "2026-03-29T00:00:00.000Z",
                  cancelRequested: false,
                },
              ],
            },
          ],
          collaborations: [],
          tasks: [],
        }),
      }))
    );

    const state = await loadRuntimeGraph(clawcoGraph);

    expect(state.source).toBe("snapshot");
    expect(state.graph.agents[0]?.stats.inProgress).toBe(1);
    expect(state.snapshot?.team.name).toBe("Task Squad");
  });
});
