"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Slider, Input } from "@/components/ui";

type GameState = "settings" | "countdown" | "playing" | "answering" | "result";

// Audio context for generating sounds
const createAudioContext = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
};

// Play countdown beep (sine wave for countdown)
const playCountdownBeep = (audioCtx: AudioContext | null, frequency: number, duration: number, volume: number = 0.15) => {
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

// Play Flash Anzan style tick sound (sharp, crisp click)
const playFlashTick = (audioCtx: AudioContext | null, volume: number = 0.3) => {
    if (!audioCtx) return;

    // Create a short noise burst for the tick sound
    const bufferSize = audioCtx.sampleRate * 0.015; // 15ms duration
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate filtered noise that sounds like a sharp tick/click
    for (let i = 0; i < bufferSize; i++) {
        // Quick exponential decay for sharp attack
        const envelope = Math.exp(-i / (bufferSize * 0.1));
        // Mix of noise for texture
        data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    // High-pass filter to make it crisp
    const highpass = audioCtx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 2000;
    highpass.Q.value = 1;

    // Band-pass for the "tick" character
    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 4000;
    bandpass.Q.value = 2;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;

    source.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    source.start(audioCtx.currentTime);
};

export default function FlashArithmeticPage() {
    const [gameState, setGameState] = useState<GameState>("settings");
    const [digits, setDigits] = useState(2);
    const [count, setCount] = useState(5);
    const [speed, setSpeed] = useState(800);

    const [numbers, setNumbers] = useState<number[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [correctSum, setCorrectSum] = useState(0);
    const [countdown, setCountdown] = useState(3);
    const [showNumber, setShowNumber] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);
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

    // Generate random number with specified digits
    const generateNumber = useCallback((numDigits: number): number => {
        const min = Math.pow(10, numDigits - 1);
        const max = Math.pow(10, numDigits) - 1;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }, []);

    // Start countdown
    const startGame = useCallback(() => {
        // Ensure audio context is created
        if (!audioCtxRef.current) {
            audioCtxRef.current = createAudioContext();
        }
        setGameState("countdown");
        setCountdown(3);
    }, []);

    // Countdown effect with sound
    useEffect(() => {
        if (gameState !== "countdown") return;

        // Play countdown sound
        if (countdown > 0) {
            // Higher pitch for each countdown step (3=lower, 1=higher)
            const freq = countdown === 3 ? 440 : countdown === 2 ? 523 : 659;
            playCountdownBeep(audioCtxRef.current, freq, 0.15, 0.2);

            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Play start sound (higher pitch)
            playCountdownBeep(audioCtxRef.current, 880, 0.1, 0.25);

            // Generate numbers and start
            const nums = Array.from({ length: count }, () => generateNumber(digits));
            setNumbers(nums);
            setCorrectSum(nums.reduce((a, b) => a + b, 0));
            setCurrentIndex(0);
            setShowNumber(true);
            setGameState("playing");
        }
    }, [gameState, countdown, count, digits, generateNumber]);

    // Play sequence - INSTANT display, no animations
    useEffect(() => {
        if (gameState !== "playing" || currentIndex >= numbers.length) return;

        // Show number instantly and play sound
        setShowNumber(true);
        playFlashTick(audioCtxRef.current);

        const timer = setTimeout(() => {
            // Hide number instantly
            setShowNumber(false);

            // Small delay before next number to give visual separation
            setTimeout(() => {
                if (currentIndex < numbers.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                } else {
                    setGameState("answering");
                    setUserAnswer("");
                }
            }, 10);
        }, speed);

        return () => clearTimeout(timer);
    }, [gameState, currentIndex, numbers.length, speed]);

    const checkAnswer = () => {
        setGameState("result");
    };

    const resetGame = () => {
        setGameState("settings");
        setNumbers([]);
        setCurrentIndex(0);
        setUserAnswer("");
    };

    const isCorrect = parseInt(userAnswer) === correctSum;

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
                        Flash Mental Arithmetic
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
                                Adjust difficulty to match your skill level
                            </p>
                        </div>

                        <div className="space-y-6 rounded-2xl bg-surface border border-border p-6">
                            <Slider
                                label="Digits per Number"
                                value={digits}
                                onChange={setDigits}
                                min={1}
                                max={5}
                            />
                            <Slider
                                label="Numbers in Sequence"
                                value={count}
                                onChange={setCount}
                                min={3}
                                max={20}
                            />
                            <Slider
                                label="Display Time"
                                value={speed}
                                onChange={setSpeed}
                                min={10}
                                max={2000}
                                step={10}
                                unit="ms"
                            />
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

                {/* Playing - Number Display (INSTANT, no animation) */}
                {gameState === "playing" && (
                    <div className="text-center">
                        <div
                            className="font-[family-name:var(--font-space-grotesk)] text-7xl sm:text-8xl md:text-9xl font-bold text-foreground tabular-nums"
                            style={{ visibility: showNumber ? "visible" : "hidden" }}
                        >
                            {numbers[currentIndex]}
                        </div>
                        <div className="mt-8 flex justify-center gap-1">
                            {numbers.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 w-8 rounded-full transition-colors ${i <= currentIndex ? "bg-primary" : "bg-surface-3"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Answering */}
                {gameState === "answering" && (
                    <div ref={containerRef} className="w-full max-w-md space-y-6 text-center">
                        <div>
                            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-foreground">
                                What&apos;s the Sum?
                            </h2>
                            <p className="mt-2 text-muted">
                                Enter the total of all {count} numbers
                            </p>
                        </div>

                        <Input
                            type="number"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Enter your answer"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && userAnswer && checkAnswer()}
                        />

                        <Button
                            onClick={checkAnswer}
                            disabled={!userAnswer}
                            className="w-full"
                            size="lg"
                        >
                            Confirm
                        </Button>
                    </div>
                )}

                {/* Result */}
                {gameState === "result" && (
                    <div className="w-full max-w-md space-y-8 text-center">
                        <div>
                            <div
                                className={`mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full ${isCorrect ? "bg-success/20" : "bg-error/20"
                                    }`}
                            >
                                {isCorrect ? (
                                    <svg className="h-10 w-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="h-10 w-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </div>
                            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-foreground">
                                {isCorrect ? "Correct!" : "Incorrect"}
                            </h2>
                        </div>

                        <div className="rounded-2xl bg-surface border border-border p-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-muted mb-1">Your Answer</p>
                                    <p className={`font-[family-name:var(--font-space-grotesk)] text-3xl font-bold ${isCorrect ? "text-success" : "text-error"}`}>
                                        {userAnswer}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted mb-1">Correct Sum</p>
                                    <p className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-foreground">
                                        {correctSum}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-border">
                                <p className="text-sm text-muted mb-2">Numbers in sequence</p>
                                <p className="font-[family-name:var(--font-space-grotesk)] text-lg text-foreground">
                                    {numbers.join(" + ")} = {correctSum}
                                </p>
                            </div>
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
