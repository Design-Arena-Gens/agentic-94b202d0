/* eslint-disable react/no-unknown-property */
"use client";

import { useMemo, useRef } from "react";
import { Group, MathUtils, Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { Float, Text, Trail } from "@react-three/drei";
import { laneOffsets, useGameStore } from "@/store/useGameStore";

const GameLoop = () => {
  const tick = useGameStore((state) => state.tick);

  useFrame((_, delta) => {
    tick(Math.min(delta, 0.1));
  });

  return null;
};

const MovingRoad = () => {
  const segmentRefs = useRef<Mesh[]>([]);
  const stripeRefs = useRef<Mesh[]>([]);

  const segments = useMemo(() => Array.from({ length: 10 }, (_, index) => index), []);

  useFrame((_, delta) => {
    const { speed } = useGameStore.getState();
    const movement = speed * delta;
    const segmentLength = 12;
    const loopDistance = segmentLength * segments.length;

    segmentRefs.current.forEach((mesh) => {
      if (!mesh) return;
      mesh.position.z += movement;
      if (mesh.position.z > segmentLength) {
        mesh.position.z -= loopDistance;
      }
    });

    stripeRefs.current.forEach((mesh) => {
      if (!mesh) return;
      mesh.position.z += movement * 1.2;
      if (mesh.position.z > 6) {
        mesh.position.z -= loopDistance;
      }
    });
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {segments.map((index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            if (mesh) segmentRefs.current[index] = mesh;
          }}
          position={[0, 0, -index * 12]}
          receiveShadow
        >
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}

      {segments.map((index) =>
        laneOffsets.slice(0, laneOffsets.length - 1).map((lane, laneIndex) => (
          <mesh
            key={`${index}-${laneIndex}`}
            ref={(mesh) => {
              if (!mesh) return;
              const stripeIndex = index * (laneOffsets.length - 1) + laneIndex;
              stripeRefs.current[stripeIndex] = mesh;
            }}
            position={[lane + 1.6, 0.02, -index * 12]}
            receiveShadow
          >
            <boxGeometry args={[0.12, 10, 0.4]} />
            <meshStandardMaterial color="#334155" emissive="#1e293b" emissiveIntensity={0.6} />
          </mesh>
        )),
      )}
    </group>
  );
};

const SideScenery = () => {
  const pillarRefs = useRef<Mesh[]>([]);
  const pillars = useMemo(() => Array.from({ length: 18 }, (_, index) => index), []);

  useFrame((_, delta) => {
    const { speed } = useGameStore.getState();
    const movement = speed * delta * 0.9;
    const spacing = 16;
    const loopDistance = spacing * pillars.length;

    pillarRefs.current.forEach((mesh) => {
      if (!mesh) return;
      mesh.position.z += movement;
      if (mesh.position.z > 8) {
        mesh.position.z -= loopDistance;
      }
    });
  });

  return (
    <group>
      {pillars.map((index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            if (mesh) pillarRefs.current[index] = mesh;
          }}
          position={[
            index % 2 === 0 ? -6.5 : 6.5,
            2.4,
            -index * 16 + (index % 2 === 0 ? -8 : -4),
          ]}
          castShadow
        >
          <boxGeometry args={[0.6, 4.8, 0.6]} />
          <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
};

const PlayerCar = () => {
  const laneIndex = useGameStore((state) => state.laneIndex);
  const mode = useGameStore((state) => state.mode);
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    const targetX = laneOffsets[laneIndex];
    const tiltTarget = MathUtils.clamp((group.current.position.x - targetX) * -0.12, -0.25, 0.25);
    group.current.position.x = MathUtils.damp(group.current.position.x, targetX, 6.5, delta);
    group.current.rotation.z = MathUtils.damp(group.current.rotation.z, tiltTarget, 12, delta);
    const { distance } = useGameStore.getState();
    const hover = Math.sin(distance * 0.15) * 0.1 + Math.cos(distance * 0.08) * 0.05;
    group.current.position.y = MathUtils.damp(group.current.position.y, 0.65 + hover, 4, delta);
    if (mode === "gameover") {
      group.current.rotation.x = MathUtils.damp(group.current.rotation.x, 0.6, 2, delta);
    } else {
      group.current.rotation.x = MathUtils.damp(group.current.rotation.x, -0.1, 6, delta);
    }
  });

  return (
    <group ref={group} position={[0, 0.6, 3]}>
      <Trail
        width={0.8}
        length={6}
        color="#22d3ee"
        attenuation={(t) => t * t}
      >
        <mesh position={[0.8, 0.2, -1.6]}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      </Trail>
      <Trail
        width={0.8}
        length={6}
        color="#f472b6"
        attenuation={(t) => t * t}
      >
        <mesh position={[-0.8, 0.2, -1.6]}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshBasicMaterial color="#f472b6" />
        </mesh>
      </Trail>
      <group>
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[2.4, 0.8, 3.2]} />
          <meshStandardMaterial
            color="#1f2937"
            metalness={0.4}
            roughness={0.6}
            emissive="#0ea5e9"
            emissiveIntensity={0.15}
          />
        </mesh>
        <mesh castShadow position={[0, 0.95, -0.2]}>
          <boxGeometry args={[1.8, 0.9, 1.8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 1.35, -0.7]}>
          <boxGeometry args={[1.4, 0.4, 0.9]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.95, 0.18, -1.45]}>
          <boxGeometry args={[0.4, 0.4, 0.8]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[-0.95, 0.18, -1.45]}>
          <boxGeometry args={[0.4, 0.4, 0.8]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
};

const GatePanel = ({
  gateZ,
  laneIndex,
  option,
  status,
  isCorrect,
}: {
  gateZ: number;
  laneIndex: number;
  option: number;
  status: "pending" | "correct" | "missed";
  isCorrect: boolean;
}) => {
  const panelRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!panelRef.current) return;
    const wobble = Math.sin((gateZ + laneIndex * 4) * 0.2) * 0.05;
    panelRef.current.rotation.y = MathUtils.damp(panelRef.current.rotation.y, wobble, 8, delta);
  });

  const color =
    status === "pending" ? "#0ea5e9" : status === "correct" ? "#22c55e" : "#f97316";

  return (
    <group ref={panelRef} position={[laneOffsets[laneIndex], 1.8, gateZ]}>
      <Float speed={3} rotationIntensity={0.12} floatIntensity={0.6}>
        <mesh castShadow>
          <boxGeometry args={[2, 1, 0.2]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive={color}
            emissiveIntensity={status === "pending" ? 0.6 : 1.2}
            roughness={0.3}
            metalness={0.6}
          />
        </mesh>
        <Text
          position={[0, 0, 0.12]}
          fontSize={0.55}
          anchorX="center"
          anchorY="middle"
          color="#e2e8f0"
        >
          {option}
        </Text>
      </Float>
      {isCorrect && status === "pending" && (
        <mesh position={[0, -0.9, 0]}>
          <coneGeometry args={[0.2, 0.6, 6]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
};

const GateFrame = ({
  z,
  status,
}: {
  z: number;
  status: "pending" | "correct" | "missed";
}) => {
  const color =
    status === "pending" ? "#1d4ed8" : status === "correct" ? "#16a34a" : "#f97316";
  return (
    <group position={[0, 1.2, z]}>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[10, 0.2, 0.2]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive={color}
          emissiveIntensity={status === "pending" ? 0.4 : 0.9}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[-5, 0, 0]}>
        <boxGeometry args={[0.35, 3.6, 0.35]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[5, 0, 0]}>
        <boxGeometry args={[0.35, 3.6, 0.35]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  );
};

const GateField = () => {
  const gates = useGameStore((state) => state.gates);

  return (
    <group>
      {gates.map((gate) => (
        <group key={gate.id}>
          <GateFrame z={gate.z} status={gate.status} />
          {gate.options.map((option, index) => (
            <GatePanel
              key={`${gate.id}-${index}`}
              gateZ={gate.z - 0.5}
              laneIndex={index}
              option={option}
              status={gate.status}
              isCorrect={index === gate.correctIndex}
            />
          ))}
          <Text
            position={[0, 3.8, gate.z - 0.4]}
            fontSize={0.8}
            anchorX="center"
            anchorY="middle"
            color="#e2e8f0"
            outlineWidth={0.02}
            outlineColor="#0f172a"
          >
            {gate.question}
          </Text>
        </group>
      ))}
    </group>
  );
};

const Lighting = () => (
  <>
    <ambientLight intensity={0.4} />
    <directionalLight
      castShadow
      intensity={1.3}
      position={[8, 14, 12]}
      shadow-mapSize={2048}
    />
    <directionalLight intensity={0.5} position={[-12, 6, -10]} color="#38bdf8" />
    <pointLight intensity={0.8} position={[0, 6, -8]} color="#22d3ee" />
  </>
);

const GameScene = () => (
  <>
    <GameLoop />
    <Lighting />
    <MovingRoad />
    <SideScenery />
    <GateField />
    <PlayerCar />
  </>
);

export default GameScene;
