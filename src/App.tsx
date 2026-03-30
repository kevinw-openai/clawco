import { useMemo, useState } from "react";

import { InspectorPanel } from "./components/InspectorPanel";
import { TopBar } from "./components/TopBar";
import { clawcoGraph } from "./data/orgGraph";
import { buildInspectorModel } from "./lib/scene-state";
import { type AgentStatus, type StatusFilter } from "./lib/types";
import { ControlRoomScene } from "./scene/ControlRoomScene";

const ROOT_ID =
  clawcoGraph.agents.find((agent) => agent.managerId == null)?.id ??
  clawcoGraph.agents[0].id;

function getStatusCounts() {
  return clawcoGraph.agents.reduce<Record<AgentStatus, number>>(
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
  const [selectedId, setSelectedId] = useState(ROOT_ID);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  const statusCounts = useMemo(() => getStatusCounts(), []);
  const inspector = useMemo(
    () => buildInspectorModel(clawcoGraph, selectedId),
    [selectedId]
  );

  const handleSelectAgent = (agentId: string) => {
    setSelectedId(agentId);
    setMobileInspectorOpen(true);
  };

  const handleReset = () => {
    setSelectedId(ROOT_ID);
    setCameraResetToken((token) => token + 1);
  };

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--left" />
      <div className="app-shell__glow app-shell__glow--right" />
      <div className="app-shell__grid" />

      <TopBar
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
              graph={clawcoGraph}
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
