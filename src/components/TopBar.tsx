import type { CSSProperties } from "react";

import { STATUS_META, type AgentStatus, type StatusFilter } from "../lib/types";

type TopBarProps = {
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
  statusCounts,
  statusFilter,
  onStatusFilterChange,
  onReset,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <span className="brand-block__eyebrow">Command lattice</span>
        <div className="brand-block__title-row">
          <h1>Clawco</h1>
          <span className="brand-block__signal">live mock organization</span>
        </div>
        <p>
          A cinematic org view for understanding hierarchy, collaboration, and
          the current pulse of a multi-agent team.
        </p>
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
