/* eslint-disable react/no-unknown-property */
"use client";

import { Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Loader } from "@react-three/drei";
import clsx from "clsx";
import GameScene from "./game/GameScene";
import { useGameStore } from "@/store/useGameStore";

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

const Hud = () => {
  const {
    score,
    distance,
    speed,
    health,
    streak,
    mode,
    reset,
    gates,
    activeGateId,
  } = useGameStore((state) => ({
    score: state.score,
    distance: state.distance,
    speed: state.speed,
    health: state.health,
    streak: state.streak,
    mode: state.mode,
    reset: state.reset,
    gates: state.gates,
    activeGateId: state.activeGateId,
  }));

  const activeGate = useMemo(
    () => gates.find((gate) => gate.id === activeGateId),
    [activeGateId, gates],
  );

  const kmh = Math.round(speed * 7.5);
  const meters = Math.floor(distance * 4);

  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 flex w-full items-start justify-between p-6 text-xs uppercase tracking-[0.35em] text-slate-200 sm:text-sm">
        <div className="space-y-3">
          <div>
            <p className="text-[0.6rem] text-slate-400">Score</p>
            <p className="text-2xl font-semibold tracking-[0.25em]">
              {formatNumber(score)}
            </p>
          </div>
          <div className="hidden lg:block">
            <p className="text-[0.6rem] text-slate-400">Distance</p>
            <p className="text-lg font-semibold tracking-[0.5em]">
              {formatNumber(meters)} m
            </p>
          </div>
        </div>
        <div className="items-right flex flex-col items-end space-y-3">
          <div className="text-right">
            <p className="text-[0.6rem] text-slate-400">Speed</p>
            <p className="text-2xl font-semibold tracking-[0.25em]">
              {kmh} km/h
            </p>
          </div>
          <div className="flex gap-2 text-base">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={clsx(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-400/40 font-semibold",
                  index < health ? "bg-rose-500/80 text-white" : "bg-slate-600/30 text-slate-500",
                )}
              >
                ♥
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto w-full max-w-xl px-6 text-center text-sm text-slate-200 sm:text-base">
        {mode === "playing" && activeGate && (
          <div className="rounded-lg border border-white/10 bg-black/35 px-5 py-4 shadow-[0_0_30px_rgba(23,23,60,0.45)] backdrop-blur">
            <p className="text-[0.85rem] font-medium text-cyan-200">
              Solve: {activeGate.question}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.35em] text-slate-400">
              Steer into the lane with the correct answer
            </p>
          </div>
        )}
        {mode === "gameover" && (
          <div className="pointer-events-auto rounded-lg border border-rose-400/40 bg-black/60 px-6 py-6 shadow-[0_0_35px_rgba(220,38,38,0.35)] backdrop-blur">
            <p className="text-lg font-semibold uppercase tracking-[0.4em] text-rose-200">
              Impact Detected
            </p>
            <p className="mt-3 text-sm text-slate-200">
              Final score {formatNumber(score)} • Distance {formatNumber(meters)} m •
              Streak {streak}
            </p>
            <button
              type="button"
              onClick={reset}
              className="pointer-events-auto mt-4 inline-flex rounded-md border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/10"
            >
              Restart
            </button>
            <p className="mt-2 text-[0.65rem] text-slate-400">
              press Space or Enter to reboot
            </p>
          </div>
        )}
        {mode === "playing" && (
          <div className="mt-6 text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">
            ← move left • → move right
          </div>
        )}
      </div>
      {streak > 1 && mode === "playing" && (
        <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-emerald-100 sm:block">
          {streak}x combo
        </div>
      )}
    </>
  );
};

const Game = () => {
  const reset = useGameStore((state) => state.reset);
  const moveLane = useGameStore((state) => state.moveLane);
  const mode = useGameStore((state) => state.mode);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "ArrowLeft" || event.code === "KeyA") {
        moveLane(-1);
      } else if (event.code === "ArrowRight" || event.code === "KeyD") {
        moveLane(1);
      } else if (mode === "gameover" && (event.code === "Space" || event.code === "Enter")) {
        reset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, moveLane, reset]);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        camera={{ position: [0, 4.8, 9.6], fov: 48, near: 0.1, far: 120 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#05060a"]} />
        <fog attach="fog" args={["#05060a", 14, 70]} />
        <Suspense fallback={null}>
          <GameScene />
          <Environment preset="night" blur={0.4} />
        </Suspense>
      </Canvas>
      <Hud />
      <Loader />
    </div>
  );
};

export default Game;

