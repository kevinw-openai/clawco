import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({
    ok: false,
    status: 404,
  }))
);

vi.mock("./scene/ControlRoomScene", () => ({
  ControlRoomScene: ({
    graph,
    onSelect,
  }: {
    graph: {
      agents: Array<{ id: string; name: string }>;
    };
    onSelect: (agentId: string) => void;
  }) => (
    <div data-testid="scene-mock">
      {graph.agents.map((agent) => (
        <button
          key={agent.id}
          type="button"
          onClick={() => onSelect(agent.id)}
        >
          {agent.name}
        </button>
      ))}
    </div>
  ),
}));

import App from "./App";

describe("App", () => {
  it("mounts and updates the inspector when a node is selected", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText("Atlas")[0]).toBeInTheDocument();
      expect(
        screen.getAllByText(/Maintains the global plan, allocates agent attention/i)[0]
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Loom" }));

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: "Loom" })[0]).toBeInTheDocument();
      expect(
        screen.getAllByText(/Breaks the objective into workstreams/i)[0]
      ).toBeInTheDocument();
    });
  });
});
