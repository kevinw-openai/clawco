import type { ClawcoSnapshot, OrgGraph } from "./types";

export type RuntimeGraphState = {
  graph: OrgGraph;
  snapshot: ClawcoSnapshot | null;
  source: "demo" | "snapshot";
  error?: string;
};

const DEFAULT_SNAPSHOT_URL = "/api/snapshot";

export async function loadRuntimeGraph(fallbackGraph: OrgGraph): Promise<RuntimeGraphState> {
  const snapshotUrl = resolveSnapshotUrl();

  try {
    const response = await fetch(snapshotUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          graph: fallbackGraph,
          snapshot: null,
          source: "demo",
        };
      }

      throw new Error(`Snapshot request failed with ${response.status}`);
    }

    const snapshot = (await response.json()) as ClawcoSnapshot;
    validateSnapshot(snapshot);

    return {
      graph: {
        agents: snapshot.agents,
        collaborations: snapshot.collaborations,
      },
      snapshot,
      source: "snapshot",
    };
  } catch (error) {
    return {
      graph: fallbackGraph,
      snapshot: null,
      source: "demo",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function resolveSnapshotUrl(): string {
  const envUrl = import.meta.env.VITE_CLAWCO_SNAPSHOT_URL;
  if (typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl;
  }
  return DEFAULT_SNAPSHOT_URL;
}

function validateSnapshot(snapshot: ClawcoSnapshot): void {
  if (!Array.isArray(snapshot.agents) || !Array.isArray(snapshot.collaborations) || !Array.isArray(snapshot.tasks)) {
    throw new Error("Snapshot payload is missing required arrays");
  }
}
