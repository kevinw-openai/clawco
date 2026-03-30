import { startTransition, useEffect, useMemo, useState } from "react";

import { InspectorPanel } from "./components/InspectorPanel";
import { TopBar } from "./components/TopBar";
import { clawcoGraph } from "./data/orgGraph";
import { loadRuntimeGraph } from "./lib/runtime";
import { buildInspectorModel } from "./lib/scene-state";
import { type AgentStatus, type OrgGraph, type StatusFilter } from "./lib/types";
import { ControlRoomScene } from "./scene/ControlRoomScene";

const DEFAULT_DESCRIPTION =
  "A cinematic org view for understanding hierarchy, collaboration, and the current pulse of a multi-agent team.";

function getRootId(graph: OrgGraph) {
  return graph.agents.find((agent) => agent.managerId == null)?.id ?? graph.agents[0].id;
}

function getStatusCounts(graph: OrgGraph) {
  return graph.agents.reduce<Record<AgentStatus, number>>(
    (counts, agent) => {
      counts[agent.status] += 1;
      return counts;
    },
    {
      idle: 0,
      thinking: 0,
      delegating: 0,
      blocked: 0,
      delivering: 0,
    }
  );
}

export default function App() {
  const [graph, setGraph] = useState(clawcoGraph);
  const [source, setSource] = useState<"demo" | "snapshot">("demo");
  const [snapshotError, setSnapshotError] = useState<string | undefined>();
  const [teamName, setTeamName] = useState("Clawco");
  const [teamDescription, setTeamDescription] = useState(DEFAULT_DESCRIPTION);
  const [selectedId, setSelectedId] = useState(getRootId(clawcoGraph));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  useEffect(() => {
    let canceled = false;

    void loadRuntimeGraph(clawcoGraph).then((state) => {
      if (canceled) {
        return;
      }

      startTransition(() => {
        setGraph(state.graph);
        setSource(state.source);
        setSnapshotError(state.error);
        setSelectedId(getRootId(state.graph));
        if (state.snapshot != null) {
          setTeamName(state.snapshot.team.name);
          setTeamDescription(
            state.snapshot.team.description && state.snapshot.team.description.length > 0
              ? state.snapshot.team.description
              : DEFAULT_DESCRIPTION
          );
        }
      });
    });

    return () => {
      canceled = true;
    };
  }, []);

  const statusCounts = useMemo(() => getStatusCounts(graph), [graph]);
  const inspector = useMemo(
    () => buildInspectorModel(graph, selectedId),
    [graph, selectedId]
  );

  const handleSelectAgent = (agentId: string) => {
    setSelectedId(agentId);
    setMobileInspectorOpen(true);
  };

  const handleReset = () => {
    setSelectedId(getRootId(graph));
    setCameraResetToken((token) => token + 1);
  };

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--left" />
      <div className="app-shell__glow app-shell__glow--right" />
      <div className="app-shell__grid" />

      <TopBar
        teamName={teamName}
        teamDescription={teamDescription}
        source={source}
        snapshotError={snapshotError}
        graph={graph}
        statusCounts={statusCounts}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onReset={handleReset}
      />

      <main className="command-grid">
        <section className="scene-column">
          <div className="scene-frame">
            <div className="scene-frame__hud">
              <span className="scene-frame__eyebrow">Organization view</span>
              <h2>Hierarchy and handoffs in one frame</h2>
              <p>
                Reporting lines stay grounded. Collaboration arcs stay alive. Click
                any agent to recenter the system around their branch.
              </p>
            </div>

            <ControlRoomScene
              graph={graph}
              selectedId={selectedId}
              statusFilter={statusFilter}
              cameraResetToken={cameraResetToken}
              onSelect={handleSelectAgent}
            />
          </div>
        </section>

        <InspectorPanel
          mode="desktop"
          inspector={inspector}
          onSelectAgent={handleSelectAgent}
        />
      </main>

      <InspectorPanel
        mode="mobile"
        inspector={inspector}
        onSelectAgent={handleSelectAgent}
        isOpen={mobileInspectorOpen}
        onToggleOpen={() => setMobileInspectorOpen((open) => !open)}
      />
    </div>
  );
}
