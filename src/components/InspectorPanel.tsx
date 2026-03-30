import type { CSSProperties } from "react";

import { LANE_META, STATUS_META } from "../lib/types";
import type { InspectorModel } from "../lib/scene-state";

type InspectorPanelProps = {
  inspector: InspectorModel;
  onSelectAgent: (agentId: string) => void;
  mode: "desktop" | "mobile";
  isOpen?: boolean;
  onToggleOpen?: () => void;
};

function WorkloadMeter({ workload }: { workload: number }) {
  return (
    <div className="meter">
      <div className="meter__track">
        <div
          className="meter__fill"
          style={{ width: `${Math.round(workload * 100)}%` }}
        />
      </div>
      <span>{Math.round(workload * 100)}%</span>
    </div>
  );
}

function AgentLinkButton({
  agentId,
  primary,
  secondary,
  onSelectAgent,
}: {
  agentId: string;
  primary: string;
  secondary: string;
  onSelectAgent: (agentId: string) => void;
}) {
  return (
    <button
      type="button"
      className="agent-link"
      onClick={() => onSelectAgent(agentId)}
    >
      <span>{primary}</span>
      <small>{secondary}</small>
    </button>
  );
}

function InspectorContent({
  inspector,
  onSelectAgent,
}: Omit<InspectorPanelProps, "mode" | "isOpen" | "onToggleOpen">) {
  const laneMeta = LANE_META[inspector.selected.lane];
  const statusMeta = STATUS_META[inspector.selected.status];

  return (
    <div className="inspector-card__body">
      <section className="inspector-card__hero">
        <div className="inspector-card__header">
          <div>
            <span className="inspector-card__eyebrow">Focused agent</span>
            <h2>{inspector.selected.name}</h2>
          </div>
          <span
            className="status-pill"
            style={
              {
                "--accent": statusMeta.accent,
                "--glow": statusMeta.glow,
              } as CSSProperties
            }
          >
            {statusMeta.label}
          </span>
        </div>

        <div className="identity-strip">
          <span>{inspector.selected.role}</span>
          <span
            className="lane-chip"
            style={{ "--accent": laneMeta.accent, "--panel": laneMeta.panel } as CSSProperties}
          >
            {laneMeta.label}
          </span>
        </div>

        <p className="inspector-card__summary">{inspector.selected.summary}</p>
        <WorkloadMeter workload={inspector.selected.workload} />
      </section>

      <section className="inspector-section">
        <div className="inspector-section__title">Task load</div>
        <div className="inspector-list">
          <div className="inspector-section__empty">
            Queued {inspector.selected.stats.queued} | In progress {inspector.selected.stats.inProgress}
          </div>
          <div className="inspector-section__empty">
            Completed {inspector.selected.stats.completed} | Failed {inspector.selected.stats.failed}
          </div>
        </div>
      </section>

      <section className="inspector-section">
        <div className="inspector-section__title">Active tasks</div>
        {inspector.selected.activeTasks.length > 0 ? (
          <div className="inspector-list">
            {inspector.selected.activeTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="collaboration-link">
                <div>
                  <strong>{task.title}</strong>
                  <small>{task.status}</small>
                </div>
                <span>{task.cancelRequested ? "cancel" : "live"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="inspector-section__empty">No active tasks assigned.</div>
        )}
      </section>

      <section className="inspector-section">
        <div className="inspector-section__title">Manager</div>
        {inspector.manager ? (
          <AgentLinkButton
            agentId={inspector.manager.id}
            primary={inspector.manager.name}
            secondary={inspector.manager.role}
            onSelectAgent={onSelectAgent}
          />
        ) : (
          <div className="inspector-section__empty">Root orchestration node</div>
        )}
      </section>

      <section className="inspector-section">
        <div className="inspector-section__title">Direct reports</div>
        {inspector.reports.length > 0 ? (
          <div className="inspector-list">
            {inspector.reports.map((agent) => (
              <AgentLinkButton
                key={agent.id}
                agentId={agent.id}
                primary={agent.name}
                secondary={agent.role}
                onSelectAgent={onSelectAgent}
              />
            ))}
          </div>
        ) : (
          <div className="inspector-section__empty">No direct reports on this branch.</div>
        )}
      </section>

      <section className="inspector-section">
        <div className="inspector-section__title">Strongest collaborators</div>
        {inspector.collaborators.length > 0 ? (
          <div className="inspector-list">
            {inspector.collaborators.slice(0, 4).map(({ agent, edge }) => (
              <button
                type="button"
                key={`${edge.sourceId}-${edge.targetId}`}
                className="collaboration-link"
                onClick={() => onSelectAgent(agent.id)}
              >
                <div>
                  <strong>{agent.name}</strong>
                  <small>{edge.reason}</small>
                </div>
                <span>{Math.round(edge.strength * 100)}%</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="inspector-section__empty">
            No live collaboration links for this agent.
          </div>
        )}
      </section>
    </div>
  );
}

export function InspectorPanel({
  inspector,
  onSelectAgent,
  mode,
  isOpen = true,
  onToggleOpen,
}: InspectorPanelProps) {
  if (mode === "desktop") {
    return (
      <aside className="inspector-card inspector-card--desktop">
        <InspectorContent inspector={inspector} onSelectAgent={onSelectAgent} />
      </aside>
    );
  }

  return (
    <aside
      className={`inspector-card inspector-card--mobile ${
        isOpen ? "inspector-card--mobile-open" : ""
      }`}
    >
      <button
        type="button"
        className="mobile-drawer-toggle"
        onClick={onToggleOpen}
      >
        <span>Focused agent: {inspector.selected.name}</span>
        <strong>{isOpen ? "Collapse" : "Expand"}</strong>
      </button>
      {isOpen ? (
        <InspectorContent inspector={inspector} onSelectAgent={onSelectAgent} />
      ) : null}
    </aside>
  );
}
