"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button, Slider } from "@/components/ui";

type GameState = "settings" | "countdown" | "memorize" | "recall" | "result";

interface TileData {
    number: number | null;
    isClicked: boolean;
    isCorrect: boolean | null;
}

const GRID_COLS = 8;
const GRID_ROWS = 5;
const GRID_SIZE = GRID_COLS * GRID_ROWS; // 40 tiles
const NUMBER_COUNT = 10; // Numbers 0-9

// Audio context for generating sounds
const createAudioContext = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
};

// Play a short beep sound
const playBeep = (audioCtx: AudioContext | null, frequency: number, duration: number, volume: number = 0.15) => {
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
};

export default function ChimpTestPage() {
    const [gameState, setGameState] = useState<GameState>("settings");
    const [displayTime, setDisplayTime] = useState(3);
    const [countdown, setCountdown] = useState(3);

    // Tile data - separate from grid positions
    const [tiles, setTiles] = useState<TileData[]>([]);
    const [nextExpected, setNextExpected] = useState(0);
    const [score, setScore] = useState(0);

    const audioCtxRef = useRef<AudioContext | null>(null);

    // Initialize audio context on user interaction
    useEffect(() => {
        const initAudio = () => {
            if (!audioCtxRef.current) {
                audioCtxRef.current = createAudioContext();
            }
        };

        document.addEventListener("click", initAudio, { once: true });
        return () => document.removeEventListener("click", initAudio);
    }, []);

    // Generate tile data with random number placement
    // Uses useMemo-style generation to avoid re-randomizing on renders
    const generateTiles = useCallback((): TileData[] => {
        // Create empty tiles
        const newTiles: TileData[] = Array.from({ length: GRID_SIZE }, () => ({
            number: null,
            isClicked: false,
            isCorrect: null,
        }));

        // Randomly select 10 unique positions for numbers
        const allPositions = Array.from({ length: GRID_SIZE }, (_, i) => i);
        const shuffledPositions: number[] = [];

        // Fisher-Yates shuffle to select 10 random positions
        for (let i = 0; i < NUMBER_COUNT; i++) {
            const randomIndex = Math.floor(Math.random() * (allPositions.length - i)) + i;
            [allPositions[i], allPositions[randomIndex]] = [allPositions[randomIndex], allPositions[i]];
            shuffledPositions.push(allPositions[i]);
        }

        // Assign numbers 0-9 to selected positions
        shuffledPositions.forEach((pos, idx) => {
            newTiles[pos].number = idx;
        });

        return newTiles;
    }, []);

    // Start game
    const startGame = useCallback(() => {
        // Ensure audio context is created
        if (!audioCtxRef.current) {
            audioCtxRef.current = createAudioContext();
        }
        setGameState("countdown");
        setCountdown(3);
        setScore(0);
        setNextExpected(0);
    }, []);

    // Countdown effect with sound
    useEffect(() => {
        if (gameState !== "countdown") return;

        if (countdown > 0) {
            // Play countdown sound
            const freq = countdown === 3 ? 440 : countdown === 2 ? 523 : 659;
            playBeep(audioCtxRef.current, freq, 0.15, 0.2);

            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Play start sound
            playBeep(audioCtxRef.current, 880, 0.1, 0.25);

            // Generate tiles ONCE and enter memorize state
            const newTiles = generateTiles();
            setTiles(newTiles);
            setGameState("memorize");
        }
    }, [gameState, countdown, generateTiles]);

    // Memorize phase timer - NO animations that affect layout
    useEffect(() => {
        if (gameState !== "memorize") return;

        const timer = setTimeout(() => {
            // Simply transition to recall state - tiles are already rendered
            setGameState("recall");
        }, displayTime * 1000);

        return () => clearTimeout(timer);
    }, [gameState, displayTime]);

    // Handle tile click
    const handleTileClick = (index: number) => {
        if (gameState !== "recall") return;

        const tile = tiles[index];
        if (tile.isClicked || tile.number === null) return;

        const isCorrect = tile.number === nextExpected;

        // Update only the clicked tile
        setTiles((prev) => {
            const newTiles = [...prev];
            newTiles[index] = { ...newTiles[index], isClicked: true, isCorrect };
            return newTiles;
        });

        if (isCorrect) {
            // Play success sound
            playBeep(audioCtxRef.current, 800, 0.08, 0.1);

            setScore((prev) => prev + 1);

            if (nextExpected === NUMBER_COUNT - 1) {
                // All correct - play victory sound
                setTimeout(() => {
                    playBeep(audioCtxRef.current, 1000, 0.15, 0.2);
                    setGameState("result");
                }, 300);
            } else {
                setNextExpected((prev) => prev + 1);
            }
        } else {
            // Play error sound
            playBeep(audioCtxRef.current, 200, 0.2, 0.15);

            // Wrong tile - reveal all remaining numbers
            setTiles((prev) =>
                prev.map((t) => ({
                    ...t,
                    isClicked: t.number !== null ? true : t.isClicked,
                }))
            );
            setTimeout(() => setGameState("result"), 1000);
        }
    };

    const resetGame = () => {
        setGameState("settings");
        setTiles([]);
        setNextExpected(0);
        setScore(0);
    };

    // Memoized grid to prevent re-renders during gameplay
    const gridContent = useMemo(() => {
        if (tiles.length === 0) return null;

        return tiles.map((tile, index) => {
            const hasNumber = tile.number !== null;
            const showNumber = (gameState === "memorize" && hasNumber) || (tile.isClicked && hasNumber);

            // Determine tile styling based on state
            let tileClass = "bg-surface-2"; // Default empty tile

            if (hasNumber) {
                if (tile.isClicked) {
                    if (tile.isCorrect === true) {
                        tileClass = "bg-success text-white";
                    } else if (tile.isCorrect === false) {
                        tileClass = "bg-error text-white";
                    } else {
                        tileClass = "bg-surface-3 text-muted";
                    }
                } else if (gameState === "memorize") {
                    tileClass = "bg-primary text-white";
                } else if (gameState === "recall") {
                    tileClass = "bg-surface-2 hover:bg-surface-3 cursor-pointer border border-primary/50";
                }
            }

            const isClickable = gameState === "recall" && hasNumber && !tile.isClicked;

            return (
                <button
                    key={index}
                    onClick={() => handleTileClick(index)}
                    disabled={!isClickable}
                    className={`
            w-full aspect-square rounded-lg
            font-[family-name:var(--font-space-grotesk)] text-lg sm:text-xl md:text-2xl font-bold
            flex items-center justify-center
            transition-colors duration-100
            ${tileClass}
            ${!isClickable ? "cursor-default" : ""}
          `}
                >
                    {showNumber ? tile.number : ""}
                </button>
            );
        });
    }, [tiles, gameState]);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-border bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2 text-muted hover:text-foreground transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-sm">Back</span>
                    </Link>
                    <h1 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-foreground">
                        Chimpanzee Memory Test
                    </h1>
                    <div className="w-16" />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-6 py-12">
                {/* Settings */}
                {gameState === "settings" && (
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-center">
                            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-foreground">
                                Configure Your Session
                            </h2>
                            <p className="mt-2 text-muted">
                                How long should numbers be visible?
                            </p>
                        </div>

                        <div className="space-y-6 rounded-2xl bg-surface border border-border p-6">
                            <Slider
                                label="Display Time"
                                value={displayTime}
                                onChange={setDisplayTime}
                                min={1}
                                max={10}
                                unit="s"
                            />
                            <div className="pt-4 border-t border-border">
                                <p className="text-sm text-muted">
                                    <span className="text-foreground font-medium">How to play:</span> Memorize the positions of numbers 0-9.
                                    When they disappear, click the tiles in ascending order (0 → 9).
                                    One wrong click ends the game.
                                </p>
                            </div>
                        </div>

                        <Button onClick={startGame} className="w-full" size="lg">
                            Start Training
                        </Button>
                    </div>
                )}

                {/* Countdown */}
                {gameState === "countdown" && (
                    <div className="text-center">
                        <div className="font-[family-name:var(--font-space-grotesk)] text-9xl font-bold text-primary">
                            {countdown}
                        </div>
                        <p className="mt-4 text-muted">Get ready...</p>
                    </div>
                )}

                {/* Game Grid - FIXED LAYOUT */}
                {(gameState === "memorize" || gameState === "recall") && tiles.length > 0 && (
                    <div className="w-full max-w-3xl">
                        {/* Status bar */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="text-muted">
                                {gameState === "memorize" ? (
                                    <span className="text-primary font-medium">Memorize the positions...</span>
                                ) : (
                                    <span>Click: <span className="text-primary font-bold font-[family-name:var(--font-space-grotesk)]">{nextExpected}</span></span>
                                )}
                            </div>
                            <div className="text-muted">
                                Score: <span className="text-foreground font-medium font-[family-name:var(--font-space-grotesk)]">{score}/10</span>
                            </div>
                        </div>

                        {/* Fixed Grid - 8 columns, equal sized cells */}
                        <div
                            className="grid gap-2 sm:gap-3"
                            style={{
                                gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                                gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
                            }}
                        >
                            {gridContent}
                        </div>
                    </div>
                )}

                {/* Result */}
                {gameState === "result" && (
                    <div className="w-full max-w-md space-y-8 text-center">
                        <div>
                            <div
                                className={`mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full ${score === 10 ? "bg-success/20" : "bg-primary/20"
                                    }`}
                            >
                                {score === 10 ? (
                                    <svg className="h-10 w-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <span className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-primary">
                                        {score}
                                    </span>
                                )}
                            </div>
                            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-foreground">
                                {score === 10 ? "Perfect Score!" : "Game Over"}
                            </h2>
                        </div>

                        <div className="rounded-2xl bg-surface border border-border p-6">
                            <p className="text-sm text-muted mb-2">Your Score</p>
                            <p className="font-[family-name:var(--font-space-grotesk)] text-5xl font-bold text-foreground">
                                {score}<span className="text-2xl text-muted">/10</span>
                            </p>
                            <p className="mt-4 text-muted">
                                {score === 10
                                    ? "Incredible! You matched chimpanzee-level memory."
                                    : score >= 7
                                        ? "Great job! Keep practicing to improve."
                                        : score >= 4
                                            ? "Good start! Try a longer display time."
                                            : "Don't give up! Memory improves with practice."}
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <Button onClick={resetGame} variant="secondary" className="flex-1">
                                Change Settings
                            </Button>
                            <Button onClick={startGame} className="flex-1">
                                Play Again
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
