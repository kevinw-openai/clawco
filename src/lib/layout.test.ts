import { describe, expect, it } from "vitest";

import { clawcoGraph } from "../data/orgGraph";
import { buildOrgLayout } from "./layout";

describe("buildOrgLayout", () => {
  it("places the root on tier zero", () => {
    const layout = buildOrgLayout(clawcoGraph);

    expect(layout.rootId).toBe("atlas");
    expect(layout.nodes.atlas.tier).toBe(0);
    expect(layout.nodes.atlas.position[1]).toBeGreaterThan(layout.nodes.loom.position[1]);
  });

  it("groups children under the correct manager and tier", () => {
    const layout = buildOrgLayout(clawcoGraph);

    expect(layout.nodes.loom.childIds).toEqual(["glyph", "signal"]);
    expect(layout.nodes.relay.childIds).toEqual(["ember"]);
    expect(layout.nodes.glyph.tier).toBe(layout.nodes.loom.tier + 1);
    expect(layout.nodes.ember.tier).toBe(layout.nodes.relay.tier + 1);
  });

  it("returns deterministic positions for identical input order", () => {
    const first = buildOrgLayout(clawcoGraph);
    const second = buildOrgLayout(clawcoGraph);

    expect(first.nodes.signal.position).toEqual(second.nodes.signal.position);
    expect(first.nodes.prism.position).toEqual(second.nodes.prism.position);
    expect(first.tierOrder).toEqual(second.tierOrder);
  });
});
