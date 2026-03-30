import { describe, expect, it } from "vitest";

import { clawcoGraph } from "../data/orgGraph";
import {
  buildInspectorModel,
  getAgentPresentation,
  getCollaborationEdgeEmphasis,
  getHierarchyEdgeEmphasis,
} from "./scene-state";

describe("scene-state helpers", () => {
  it("builds the inspector model for the selected agent", () => {
    const inspector = buildInspectorModel(clawcoGraph, "loom");

    expect(inspector.selected.name).toBe("Loom");
    expect(inspector.manager?.id).toBe("atlas");
    expect(inspector.reports.map((agent) => agent.id)).toEqual(["glyph", "signal"]);
    expect(inspector.collaborators[0]?.agent.id).toBe("atlas");
  });

  it("dims filtered nodes and keeps the selected node emphasized", () => {
    const presentation = getAgentPresentation(clawcoGraph, "relay", "blocked");

    expect(presentation.prism.dimmedByFilter).toBe(false);
    expect(presentation.prism.emphasis).toBeLessThan(1);
    expect(presentation.relay.dimmedByFilter).toBe(true);
    expect(presentation.relay.emphasis).toBeGreaterThan(presentation.atlas.emphasis);
  });

  it("brightens hierarchy edges that connect to the selected agent", () => {
    const hierarchy = getHierarchyEdgeEmphasis(clawcoGraph, "loom", "all");
    const collaboration = getCollaborationEdgeEmphasis(clawcoGraph, "loom", "all");

    expect(hierarchy["atlas->loom"]).toBeGreaterThan(hierarchy["atlas->prism"]);
    expect(collaboration["loom->quarry"]).toBeGreaterThan(
      collaboration["prism->ember"]
    );
  });
});
