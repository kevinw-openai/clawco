import type { AgentNode, OrgGraph, OrgLayout, PositionedAgentNode } from "./types";

const LEAF_SPACING = 4.8;
const ROOT_HEIGHT = 5.6;
const TIER_GAP = 4.7;

type TreeNode = {
  agent: AgentNode;
  children: TreeNode[];
};

function getRootAgent(agents: AgentNode[]): AgentNode {
  const roots = agents.filter((agent) => agent.managerId == null);
  if (roots.length === 0) {
    throw new Error("Clawco graph requires a single root agent.");
  }
  return roots[0];
}

function buildChildrenMap(agents: AgentNode[]): Map<string | null, AgentNode[]> {
  const map = new Map<string | null, AgentNode[]>();

  for (const agent of agents) {
    const key = agent.managerId;
    const bucket = map.get(key) ?? [];
    bucket.push(agent);
    map.set(key, bucket);
  }

  return map;
}

function buildTree(root: AgentNode, childrenMap: Map<string | null, AgentNode[]>): TreeNode {
  return {
    agent: root,
    children: (childrenMap.get(root.id) ?? []).map((child) =>
      buildTree(child, childrenMap)
    ),
  };
}

function assignLeafSlots(
  node: TreeNode,
  leafSlots: Map<string, number>,
  tiers: Map<number, string[]>,
  siblingIndex: number,
  siblingCount: number,
  tier: number,
  nextLeafSlot: { value: number },
  tierIndices: Map<string, number>
): number {
  const tierBucket = tiers.get(tier) ?? [];
  tierIndices.set(node.agent.id, tierBucket.length);
  tierBucket.push(node.agent.id);
  tiers.set(tier, tierBucket);

  if (node.children.length === 0) {
    const slot = nextLeafSlot.value;
    nextLeafSlot.value += 1;
    leafSlots.set(node.agent.id, slot);
    return slot;
  }

  const childSlots = node.children.map((child, childIndex) =>
    assignLeafSlots(
      child,
      leafSlots,
      tiers,
      childIndex,
      node.children.length,
      tier + 1,
      nextLeafSlot,
      tierIndices
    )
  );

  const averageSlot =
    childSlots.reduce((sum, slot) => sum + slot, 0) / childSlots.length;
  leafSlots.set(node.agent.id, averageSlot);

  void siblingIndex;
  void siblingCount;

  return averageSlot;
}

function createPositions(
  node: TreeNode,
  leafSlots: Map<string, number>,
  tiers: Map<number, string[]>,
  tierIndices: Map<string, number>,
  positioned: Record<string, PositionedAgentNode>,
  tier: number,
  totalLeafCount: number
): void {
  const tierIndex = tierIndices.get(node.agent.id) ?? 0;
  const centeredSlot =
    (leafSlots.get(node.agent.id) ?? 0) - (totalLeafCount - 1) / 2;
  const x = centeredSlot * LEAF_SPACING;
  const y = ROOT_HEIGHT - tier * TIER_GAP;

  positioned[node.agent.id] = {
    ...node.agent,
    childIds: node.children.map((child) => child.agent.id),
    tier,
    tierIndex,
    position: [x, y, 0],
  };

  for (const child of node.children) {
    createPositions(
      child,
      leafSlots,
      tiers,
      tierIndices,
      positioned,
      tier + 1,
      totalLeafCount
    );
  }
}

export function buildOrgLayout(graph: OrgGraph): OrgLayout {
  const root = getRootAgent(graph.agents);
  const childrenMap = buildChildrenMap(graph.agents);
  const tree = buildTree(root, childrenMap);

  const tiers = new Map<number, string[]>();
  const tierIndices = new Map<string, number>();
  const leafSlots = new Map<string, number>();
  const leafCounter = { value: 0 };
  assignLeafSlots(
    tree,
    leafSlots,
    tiers,
    0,
    1,
    0,
    leafCounter,
    tierIndices
  );

  const nodes: Record<string, PositionedAgentNode> = {};
  createPositions(tree, leafSlots, tiers, tierIndices, nodes, 0, leafCounter.value);

  return {
    rootId: root.id,
    tierOrder: Array.from(tiers.entries())
      .sort(([leftTier], [rightTier]) => leftTier - rightTier)
      .map(([, ids]) => ids),
    nodes,
    hierarchyEdges: graph.agents
      .filter((agent) => agent.managerId != null)
      .map((agent) => ({
        managerId: agent.managerId as string,
        reportId: agent.id,
      })),
  };
}
