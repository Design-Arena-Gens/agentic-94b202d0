import { create } from "zustand";

type GateStatus = "pending" | "correct" | "missed";

interface Gate {
  id: number;
  z: number;
  question: string;
  options: number[];
  correctIndex: number;
  status: GateStatus;
  resolved: boolean;
}

type GameMode = "playing" | "gameover";

interface GameState {
  mode: GameMode;
  speed: number;
  baseSpeed: number;
  distance: number;
  score: number;
  streak: number;
  health: number;
  laneIndex: number;
  spawnTimer: number;
  gateCounter: number;
  gates: Gate[];
  activeGateId: number | null;
  reset: () => void;
  tick: (delta: number) => void;
  moveLane: (direction: -1 | 1) => void;
  setGameOver: () => void;
}

const LANE_COUNT = 3;
const ROAD_DEPTH = 70;

const laneIndexToX = (index: number) => {
  const laneWidth = 3.2;
  return (index - 1) * laneWidth;
};

export const laneOffsets = Array.from({ length: LANE_COUNT }, (_, index) =>
  laneIndexToX(index),
);

const generateQuestion = (difficulty: number) => {
  const operations = difficulty > 3 ? ["+", "-", "×"] : ["+", "-"];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let a = 0;
  let b = 0;
  let answer = 0;

  switch (op) {
    case "+":
      a = Math.floor(Math.random() * (6 + difficulty * 3)) + 2;
      b = Math.floor(Math.random() * (6 + difficulty * 3)) + 2;
      answer = a + b;
      break;
    case "-":
      a = Math.floor(Math.random() * (8 + difficulty * 4)) + 4;
      b = Math.floor(Math.random() * Math.min(a - 1, 6 + difficulty * 3)) + 1;
      answer = a - b;
      break;
    default:
      a = Math.floor(Math.random() * (4 + difficulty)) + 2;
      b = Math.floor(Math.random() * (3 + difficulty)) + 2;
      answer = a * b;
      break;
  }

  const question = `${a} ${op} ${b}`;
  const options = new Set<number>([answer]);
  while (options.size < LANE_COUNT) {
    const fuzz = Math.floor(Math.random() * 6) + 1;
    const candidate = Math.random() > 0.5 ? answer + fuzz : Math.max(1, answer - fuzz);
    options.add(candidate);
  }

  const shuffled = Array.from(options);
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const correctIndex = shuffled.indexOf(answer);

  return { question, options: shuffled, correctIndex, answer };
};

const createGate = (id: number, difficulty: number): Gate => {
  const { question, options, correctIndex } = generateQuestion(difficulty);
  return {
    id,
    z: -ROAD_DEPTH,
    question,
    options,
    correctIndex,
    status: "pending",
    resolved: false,
  };
};

const initialState = (): GameState => ({
  mode: "playing",
  speed: 14,
  baseSpeed: 12,
  distance: 0,
  score: 0,
  streak: 0,
  health: 3,
  laneIndex: 1,
  spawnTimer: 1.5,
  gateCounter: 0,
  gates: [],
  activeGateId: null,
  reset: () => {},
  tick: () => {},
  moveLane: () => {},
  setGameOver: () => {},
});

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState(),
  reset: () => {
    const state = initialState();
    set({
      ...state,
      reset: get().reset,
      tick: get().tick,
      moveLane: get().moveLane,
      setGameOver: get().setGameOver,
      gates: [createGate(1, 1)],
      gateCounter: 1,
      activeGateId: 1,
    });
  },
  setGameOver: () => {
    set((state) => ({
      ...state,
      mode: "gameover",
      speed: 0,
    }));
  },
  moveLane: (direction) => {
    set((state) => {
      if (state.mode !== "playing") return state;
      const nextLane = Math.min(LANE_COUNT - 1, Math.max(0, state.laneIndex + direction));
      if (nextLane === state.laneIndex) return state;
      return {
        ...state,
        laneIndex: nextLane,
      };
    });
  },
  tick: (delta) => {
    set((state) => {
      if (state.mode !== "playing") return state;

      const moveDistance = state.speed * delta;
      let speed = state.speed;
      let distance = state.distance + moveDistance;
      let spawnTimer = state.spawnTimer - delta;
      let score = state.score;
      let streak = state.streak;
      let health = state.health;
      let mode: GameMode = state.mode;
      const laneIndex = state.laneIndex;

      const updatedGates: Gate[] = [];

      for (const gate of state.gates) {
        const nextGate: Gate = { ...gate, z: gate.z + moveDistance };

        if (!nextGate.resolved && nextGate.z > -1) {
          const correct = laneIndex === nextGate.correctIndex;
          nextGate.resolved = true;
          nextGate.status = correct ? "correct" : "missed";

          if (correct) {
            const reward = 120 + streak * 25;
            score += reward;
            streak += 1;
            speed = Math.min(speed + 2.8, 40);
          } else {
            streak = 0;
            health -= 1;
            speed = Math.max(state.baseSpeed, speed - 3.5);
            if (health <= 0) {
              mode = "gameover";
              speed = 0;
            }
          }
        }

        if (nextGate.z < 14) {
          updatedGates.push(nextGate);
        }
      }

      let gateCounter = state.gateCounter;
      if (spawnTimer <= 0) {
        gateCounter += 1;
        const difficulty = Math.min(6, Math.floor(score / 300) + 1);
        updatedGates.push(createGate(gateCounter, difficulty));
        spawnTimer = 2.1 + Math.random() * 1.4;
      }

      const pendingGates = updatedGates
        .filter((gate) => gate.status === "pending")
        .sort((a, b) => a.z - b.z);
      const activeGateId = pendingGates.length > 0 ? pendingGates[0].id : null;

      if (mode === "playing") {
        speed = Math.max(state.baseSpeed, speed - delta * 1.2);
      }

      return {
        ...state,
        speed,
        distance,
        spawnTimer,
        score,
        streak,
        health,
        mode,
        gates: updatedGates,
        gateCounter,
        activeGateId,
      };
    });
  },
}));

export const useLanePosition = () => {
  const laneIndex = useGameStore((state) => state.laneIndex);
  return laneIndexToX(laneIndex);
};
