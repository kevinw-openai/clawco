import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";

import { buildOrgLayout } from "../lib/layout";
import {
  getAgentPresentation,
  getCollaborationEdgeEmphasis,
  getHierarchyEdgeEmphasis,
} from "../lib/scene-state";
import { LANE_META, STATUS_META, type OrgGraph, type StatusFilter } from "../lib/types";

type ControlRoomSceneProps = {
  graph: OrgGraph;
  selectedId: string;
  statusFilter: StatusFilter;
  cameraResetToken: number;
  onSelect: (agentId: string) => void;
};

function curvePoint(
  start: THREE.Vector3,
  control: THREE.Vector3,
  end: THREE.Vector3,
  t: number
): [number, number, number] {
  const oneMinusT = 1 - t;
  return [
    oneMinusT * oneMinusT * start.x +
      2 * oneMinusT * t * control.x +
      t * t * end.x,
    oneMinusT * oneMinusT * start.y +
      2 * oneMinusT * t * control.y +
      t * t * end.y,
    oneMinusT * oneMinusT * start.z +
      2 * oneMinusT * t * control.z +
      t * t * end.z,
  ];
}

function buildCurvePoints(
  start: THREE.Vector3,
  end: THREE.Vector3,
  lift: number
): [number, number, number][] {
  const midpoint = start.clone().lerp(end, 0.5);
  midpoint.y += lift;

  return Array.from({ length: 25 }, (_, index) =>
    curvePoint(start, midpoint, end, index / 24)
  );
}

function FloorPlate() {
  return (
    <group position={[0, -8.1, 2]}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[28, 80]} />
        <meshStandardMaterial
          color="#071119"
          metalness={0.22}
          roughness={0.9}
          transparent
          opacity={0.96}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
        <ringGeometry args={[8, 20, 72]} />
        <meshBasicMaterial color="#17485c" transparent opacity={0.26} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
        <ringGeometry args={[5.2, 26.5, 72]} />
        <meshBasicMaterial color="#5be6ff" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

function getCameraDestination(
  focusPosition: [number, number, number],
  viewMode: "front" | "focus"
) {
  if (viewMode === "front") {
    return new THREE.Vector3(
      focusPosition[0],
      focusPosition[1] + 0.9,
      focusPosition[2] + 25.5
    );
  }

  return new THREE.Vector3(
    focusPosition[0],
    focusPosition[1] + 1.2,
    focusPosition[2] + 18.25
  );
}

function CameraRig({
  focusPosition,
  cameraResetToken,
  viewMode,
}: {
  focusPosition: [number, number, number];
  cameraResetToken: number;
  viewMode: "front" | "focus";
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetRef = useRef(new THREE.Vector3(...focusPosition));
  const positionRef = useRef(getCameraDestination(focusPosition, viewMode));
  const shouldAnimateRef = useRef(true);

  useEffect(() => {
    targetRef.current.set(...focusPosition);
    positionRef.current.copy(getCameraDestination(focusPosition, viewMode));
    shouldAnimateRef.current = true;
  }, [cameraResetToken, focusPosition, viewMode]);

  useFrame((_, delta) => {
    if (!controlsRef.current) {
      return;
    }

    if (shouldAnimateRef.current) {
      const ease = 1 - Math.exp(-delta * 3.2);
      camera.position.lerp(positionRef.current, ease);
      controlsRef.current.target.lerp(targetRef.current, ease);

      const targetSettled =
        controlsRef.current.target.distanceToSquared(targetRef.current) < 0.0004;
      const positionSettled =
        camera.position.distanceToSquared(positionRef.current) < 0.0004;

      if (targetSettled && positionSettled) {
        controlsRef.current.target.copy(targetRef.current);
        camera.position.copy(positionRef.current);
        shouldAnimateRef.current = false;
      }
    }

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableRotate={false}
      enableDamping
      dampingFactor={0.08}
      screenSpacePanning
      panSpeed={0.9}
      minDistance={9}
      maxDistance={40}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      onStart={() => {
        shouldAnimateRef.current = false;
      }}
    />
  );
}

function AgentCommandNode({
  id,
  name,
  role,
  lane,
  status,
  position,
  emphasis,
  selected,
  related,
  onSelect,
}: {
  id: string;
  name: string;
  role: string;
  lane: keyof typeof LANE_META;
  status: keyof typeof STATUS_META;
  position: [number, number, number];
  emphasis: number;
  selected: boolean;
  related: boolean;
  onSelect: (agentId: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const laneMeta = LANE_META[lane];
  const statusMeta = STATUS_META[status];
  const seed = useMemo(
    () =>
      Array.from(id).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0),
    [id]
  );

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() + seed * 0.005;
    const floatOffset = Math.sin(time * 0.8) * 0.18;
    const pulse =
      status === "blocked"
        ? 0.32 + Math.sin(time * 2.4) * 0.06
        : 0.18 + Math.sin(time * 2.1) * 0.08;

    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1] + floatOffset, position[2]);
    }

    if (orbRef.current) {
      const scale = 0.98 + pulse * 0.18 + (selected ? 0.1 : 0) + emphasis * 0.05;
      orbRef.current.scale.setScalar(scale + (hovered ? 0.04 : 0));
    }

    if (haloRef.current) {
      haloRef.current.rotation.z += 0.01;
      const haloScale = 1.22 + pulse * 0.22 + (selected ? 0.28 : 0);
      haloRef.current.scale.set(haloScale, haloScale, haloScale);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerEnter={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect(id);
      }}
    >
      <mesh position={[0, -0.72, 0]} receiveShadow>
        <cylinderGeometry args={[0.88, 1.18, 0.4, 40]} />
        <meshStandardMaterial
          color="#091923"
          metalness={0.68}
          roughness={0.32}
          emissive="#0a1f2b"
          emissiveIntensity={0.32 + emphasis * 0.22}
        />
      </mesh>

      <mesh ref={haloRef} position={[0, 0.26, 0]}>
        <torusGeometry args={[1.02, 0.04, 16, 80]} />
        <meshBasicMaterial
          color={statusMeta.accent}
          transparent
          opacity={0.2 + emphasis * 0.24}
        />
      </mesh>

      <mesh ref={orbRef} castShadow position={[0, 0.42, 0]}>
        <icosahedronGeometry args={[0.92, 1]} />
        <meshPhysicalMaterial
          color={laneMeta.accent}
          metalness={0.12}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.18}
          emissive={new THREE.Color(statusMeta.accent)}
          emissiveIntensity={0.22 + emphasis * 0.5}
          transparent
          opacity={0.9}
          transmission={0.26}
        />
      </mesh>

      <mesh position={[0, 1.64, 0]}>
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshBasicMaterial
          color={selected ? "#ffffff" : statusMeta.accent}
          transparent
          opacity={0.55 + emphasis * 0.25}
        />
      </mesh>

      <Html transform sprite position={[0, 2.28, 0.1]} distanceFactor={11} center>
        <button
          type="button"
          className={`agent-chip ${selected ? "agent-chip--selected" : ""} ${
            related ? "agent-chip--related" : ""
          }`}
          style={
            {
              "--accent": statusMeta.accent,
              "--panel": laneMeta.panel,
            } as CSSProperties
          }
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            onSelect(id);
          }}
        >
          <strong>{name}</strong>
          <div className="agent-chip__meta">
            <span className="agent-chip__tag">{role}</span>
            <span className="agent-chip__tag agent-chip__tag--status">
              {statusMeta.label}
            </span>
          </div>
        </button>
      </Html>
    </group>
  );
}

function HierarchyConnection({
  start,
  end,
  intensity,
}: {
  start: [number, number, number];
  end: [number, number, number];
  intensity: number;
}) {
  const startVector = useMemo(
    () => new THREE.Vector3(start[0], start[1] - 0.18, start[2]),
    [start]
  );
  const endVector = useMemo(
    () => new THREE.Vector3(end[0], end[1] + 0.92, end[2]),
    [end]
  );

  const points = useMemo(() => buildCurvePoints(startVector, endVector, 0.95), [
    endVector,
    startVector,
  ]);

  return (
    <Line
      points={points}
      color="#4ba4c6"
      transparent
      opacity={0.16 + intensity * 0.68}
      lineWidth={0.8 + intensity * 2.2}
    />
  );
}

function CollaborationConnection({
  start,
  end,
  intensity,
  animatePulse,
}: {
  start: [number, number, number];
  end: [number, number, number];
  intensity: number;
  animatePulse: boolean;
}) {
  const startVector = useMemo(
    () => new THREE.Vector3(start[0], start[1] + 0.48, start[2]),
    [start]
  );
  const endVector = useMemo(
    () => new THREE.Vector3(end[0], end[1] + 0.48, end[2]),
    [end]
  );
  const control = useMemo(() => {
    const midpoint = startVector.clone().lerp(endVector, 0.5);
    midpoint.y += 2.4;
    return midpoint;
  }, [endVector, startVector]);
  const points = useMemo(
    () => Array.from({ length: 30 }, (_, index) => curvePoint(startVector, control, endVector, index / 29)),
    [control, endVector, startVector]
  );
  const moverRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!animatePulse || !moverRef.current) {
      return;
    }
    const t = (clock.getElapsedTime() * 0.24) % 1;
    const [x, y, z] = curvePoint(startVector, control, endVector, t);
    moverRef.current.position.set(x, y, z);
  });

  return (
    <group>
      <Line
        points={points}
        color="#79efff"
        transparent
        opacity={0.09 + intensity * 0.48}
        lineWidth={0.45 + intensity * 1.8}
      />
      {animatePulse ? (
        <mesh ref={moverRef}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color="#d2feff" />
        </mesh>
      ) : null}
    </group>
  );
}

function SceneContents({
  graph,
  selectedId,
  statusFilter,
  cameraResetToken,
  onSelect,
}: ControlRoomSceneProps) {
  const layout = useMemo(() => buildOrgLayout(graph), [graph]);
  const agentPresentation = useMemo(
    () => getAgentPresentation(graph, selectedId, statusFilter),
    [graph, selectedId, statusFilter]
  );
  const hierarchyEmphasis = useMemo(
    () => getHierarchyEdgeEmphasis(graph, selectedId, statusFilter),
    [graph, selectedId, statusFilter]
  );
  const collaborationEmphasis = useMemo(
    () => getCollaborationEdgeEmphasis(graph, selectedId, statusFilter),
    [graph, selectedId, statusFilter]
  );
  const selectedNode = layout.nodes[selectedId];
  const rootId = layout.rootId;
  const viewMode = selectedId === rootId ? "front" : "focus";
  const cameraFocusPosition = useMemo<[number, number, number]>(() => {
    if (viewMode === "focus") {
      return selectedNode?.position ?? layout.nodes[rootId].position;
    }

    const positions = Object.values(layout.nodes).map((node) => node.position);
    const xs = positions.map(([x]) => x);
    const ys = positions.map(([, y]) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return [(minX + maxX) / 2, (minY + maxY) / 2 + 0.35, 0];
  }, [layout.nodes, rootId, selectedNode, viewMode]);

  return (
    <>
      <color attach="background" args={["#04070d"]} />

      <ambientLight intensity={0.88} color="#7ec7e8" />
      <directionalLight
        position={[12, 18, 8]}
        intensity={1.8}
        color="#d7f5ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-12, 6, 16]} intensity={32} color="#2dd9ff" distance={40} />
      <pointLight position={[14, 3, -8]} intensity={26} color="#7dff9f" distance={36} />

      <FloorPlate />
      <CameraRig
        focusPosition={cameraFocusPosition}
        cameraResetToken={cameraResetToken}
        viewMode={viewMode}
      />

      {layout.hierarchyEdges.map((edge) => (
        <HierarchyConnection
          key={`${edge.managerId}-${edge.reportId}`}
          start={layout.nodes[edge.managerId].position}
          end={layout.nodes[edge.reportId].position}
          intensity={hierarchyEmphasis[`${edge.managerId}->${edge.reportId}`] ?? 0.2}
        />
      ))}

      {graph.collaborations.map((edge) => (
        <CollaborationConnection
          key={`${edge.sourceId}-${edge.targetId}`}
          start={layout.nodes[edge.sourceId].position}
          end={layout.nodes[edge.targetId].position}
          intensity={collaborationEmphasis[`${edge.sourceId}->${edge.targetId}`] ?? 0.2}
          animatePulse={layout.nodes[edge.sourceId].status === "delegating"}
        />
      ))}

      {graph.agents.map((agent) => {
        const presentation = agentPresentation[agent.id];
        return (
          <AgentCommandNode
            key={agent.id}
            id={agent.id}
            name={agent.name}
            role={agent.role}
            lane={agent.lane}
            status={agent.status}
            position={layout.nodes[agent.id].position}
            emphasis={presentation.emphasis}
            selected={presentation.isSelected}
            related={presentation.isRelated}
            onSelect={onSelect}
          />
        );
      })}
    </>
  );
}

export function ControlRoomScene(props: ControlRoomSceneProps) {
  return (
    <div className="scene-canvas-shell">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 42, position: [0, 1.8, 25.5] }}>
        <SceneContents {...props} />
      </Canvas>
    </div>
  );
}
