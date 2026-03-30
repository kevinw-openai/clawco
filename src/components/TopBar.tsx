import type { CSSProperties } from "react";

import { STATUS_META, type AgentStatus, type OrgGraph, type StatusFilter } from "../lib/types";

type TopBarProps = {
  teamName: string;
  teamDescription: string;
  source: "demo" | "snapshot";
  snapshotError?: string;
  graph: OrgGraph;
  statusCounts: Record<AgentStatus, number>;
  statusFilter: StatusFilter;
  onStatusFilterChange: (statusFilter: StatusFilter) => void;
  onReset: () => void;
};

const FILTER_ORDER: StatusFilter[] = [
  "all",
  "thinking",
  "delegating",
  "delivering",
  "blocked",
  "idle",
];

export function TopBar({
  teamName,
  teamDescription,
  source,
  snapshotError,
  graph,
  statusCounts,
  statusFilter,
  onStatusFilterChange,
  onReset,
}: TopBarProps) {
  const taskTotals = graph.agents.reduce(
    (totals, agent) => {
      totals.queued += agent.stats.queued;
      totals.inProgress += agent.stats.inProgress;
      totals.failed += agent.stats.failed;
      return totals;
    },
    { queued: 0, inProgress: 0, failed: 0 }
  );

  return (
    <header className="topbar">
      <div className="brand-block">
        <span className="brand-block__eyebrow">Command lattice</span>
        <div className="brand-block__title-row">
          <h1>{teamName}</h1>
          <span className="brand-block__signal">
            {source === "snapshot" ? "live snapshot" : "demo fallback"}
          </span>
        </div>
        <p>{teamDescription}</p>
        <div className="legend-strip">
          <span className="legend-strip__item">Queued {taskTotals.queued}</span>
          <span className="legend-strip__item">In progress {taskTotals.inProgress}</span>
          <span className="legend-strip__item">Failed {taskTotals.failed}</span>
        </div>
        {snapshotError ? (
          <p className="topbar__note">Snapshot unavailable, showing demo data: {snapshotError}</p>
        ) : null}
      </div>

      <div className="topbar__controls">
        <div className="filter-group" aria-label="Agent status filters">
          {FILTER_ORDER.map((filter) => {
            const label = filter === "all" ? "All" : STATUS_META[filter].label;
            const count =
              filter === "all"
                ? Object.values(statusCounts).reduce((sum, value) => sum + value, 0)
                : statusCounts[filter];
            const accent = filter === "all" ? "#d9edf7" : STATUS_META[filter].accent;

            return (
              <button
                key={filter}
                type="button"
                className={`filter-pill ${
                  statusFilter === filter ? "filter-pill--active" : ""
                }`}
                style={{ "--accent": accent } as CSSProperties}
                onClick={() => onStatusFilterChange(filter)}
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            );
          })}
        </div>

        <div className="topbar__utility">
          <div className="legend-strip">
            {(["thinking", "delegating", "delivering", "blocked"] as AgentStatus[]).map(
              (status) => (
                <span
                  key={status}
                  className="legend-strip__item"
                  style={{ "--accent": STATUS_META[status].accent } as CSSProperties}
                >
                  {STATUS_META[status].label}
                </span>
              )
            )}
          </div>
          <button type="button" className="reset-button" onClick={onReset}>
            Reset focus
          </button>
        </div>
      </div>
    </header>
  );
}
