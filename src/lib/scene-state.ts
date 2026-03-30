import type {
  AgentNode,
  CollaborationEdge,
  OrgGraph,
  StatusFilter,
} from "./types";

export type InspectorModel = {
  selected: AgentNode;
  manager: AgentNode | null;
  reports: AgentNode[];
  collaborators: Array<{ agent: AgentNode; edge: CollaborationEdge }>;
};

function getAgentMap(graph: OrgGraph): Map<string, AgentNode> {
  return new Map(graph.agents.map((agent) => [agent.id, agent]));
}

export function buildInspectorModel(
  graph: OrgGraph,
  selectedId: string
): InspectorModel {
  const agentMap = getAgentMap(graph);
  const selected = agentMap.get(selectedId);

  if (!selected) {
    throw new Error(`Unknown selected agent: ${selectedId}`);
  }

  const manager = selected.managerId ? agentMap.get(selected.managerId) ?? null : null;
  const reports = graph.agents.filter((agent) => agent.managerId === selected.id);
  const collaborators = graph.collaborations
    .filter((edge) => edge.sourceId === selected.id || edge.targetId === selected.id)
    .map((edge) => {
      const collaboratorId =
        edge.sourceId === selected.id ? edge.targetId : edge.sourceId;
      return {
        agent: agentMap.get(collaboratorId)!,
        edge,
      };
    })
    .sort((left, right) => right.edge.strength - left.edge.strength);

  return {
    selected,
    manager,
    reports,
    collaborators,
  };
}

export function getRelatedAgentIds(graph: OrgGraph, selectedId: string): Set<string> {
  const related = new Set<string>([selectedId]);
  const selected = graph.agents.find((agent) => agent.id === selectedId);

  if (!selected) {
    return related;
  }

  if (selected.managerId) {
    related.add(selected.managerId);
  }

  for (const report of graph.agents) {
    if (report.managerId === selectedId) {
      related.add(report.id);
    }
  }

  for (const edge of graph.collaborations) {
    if (edge.sourceId === selectedId) {
      related.add(edge.targetId);
    } else if (edge.targetId === selectedId) {
      related.add(edge.sourceId);
    }
  }

  return related;
}

export function getAgentPresentation(
  graph: OrgGraph,
  selectedId: string,
  statusFilter: StatusFilter
): Record<
  string,
  { emphasis: number; dimmedByFilter: boolean; isSelected: boolean; isRelated: boolean }
> {
  const relatedIds = getRelatedAgentIds(graph, selectedId);

  return Object.fromEntries(
    graph.agents.map((agent) => {
      const dimmedByFilter = statusFilter !== "all" && agent.status !== statusFilter;
      const isSelected = agent.id === selectedId;
      const isRelated = relatedIds.has(agent.id);

      let emphasis = 0.28;
      if (isSelected) {
        emphasis = dimmedByFilter ? 0.72 : 1.12;
      } else if (isRelated) {
        emphasis = dimmedByFilter ? 0.42 : 0.82;
      } else if (dimmedByFilter) {
        emphasis = 0.14;
      }

      return [
        agent.id,
        {
          emphasis,
          dimmedByFilter,
          isSelected,
          isRelated,
        },
      ];
    })
  );
}

export function getHierarchyEdgeEmphasis(
  graph: OrgGraph,
  selectedId: string,
  statusFilter: StatusFilter
): Record<string, number> {
  const presentation = getAgentPresentation(graph, selectedId, statusFilter);

  return Object.fromEntries(
    graph.agents
      .filter((agent) => agent.managerId != null)
      .map((agent) => {
        const key = `${agent.managerId}->${agent.id}`;
        const isPrimary =
          agent.id === selectedId || agent.managerId === selectedId;
        const intensity =
          isPrimary
            ? 0.94
            : Math.min(
                presentation[agent.id].emphasis,
                presentation[agent.managerId as string].emphasis
              ) * 0.68;
        return [key, intensity];
      })
  );
}

export function getCollaborationEdgeEmphasis(
  graph: OrgGraph,
  selectedId: string,
  statusFilter: StatusFilter
): Record<string, number> {
  const presentation = getAgentPresentation(graph, selectedId, statusFilter);

  return Object.fromEntries(
    graph.collaborations.map((edge) => {
      const connectsSelection =
        edge.sourceId === selectedId || edge.targetId === selectedId;
      const base =
        connectsSelection
          ? 0.4 + edge.strength * 0.58
          : 0.18 + edge.strength * 0.22;

      const intensity =
        base *
        Math.min(
          presentation[edge.sourceId].emphasis,
          presentation[edge.targetId].emphasis
        );

      return [`${edge.sourceId}->${edge.targetId}`, intensity];
    })
  );
}
