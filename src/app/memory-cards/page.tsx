"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import Link from "next/link";
import { Button, Slider } from "@/components/ui";

type GameState = "settings" | "countdown" | "rounds" | "selection" | "result";
type Symbol = "star" | "square" | "circle" | "crescent" | "triangle";
type CardFace = "up" | "down";

const SYMBOLS: Symbol[] = ["star", "square", "circle", "crescent", "triangle"];
const TOTAL_ROUNDS = 10;
const CARDS_COUNT = 5;

interface RoundData {
    order: Symbol[];
}

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

// Symbol SVG components
const SymbolIcon = ({ symbol, className = "" }: { symbol: Symbol; className?: string }) => {
    const icons: Record<Symbol, React.ReactNode> = {
        star: (
            <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
        ),
        square: (
            <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
        ),
        circle: (
            <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
            </svg>
        ),
        crescent: (
            <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
        ),
        triangle: (
            <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2z" />
            </svg>
        ),
    };
    return icons[symbol];
};

export default function MemoryCardsPage() {
    const [gameState, setGameState] = useState<GameState>("settings");
    const [revealTime, setRevealTime] = useState(3);
    const [countdown, setCountdown] = useState(3);

    // Store all rounds data
    const [rounds, setRounds] = useState<RoundData[]>([]);
    // Store the FIRST round's order for answer comparison
    const [firstRoundOrder, setFirstRoundOrder] = useState<Symbol[]>([]);

    const [currentRound, setCurrentRound] = useState(0);
    // Explicit card face state: "up" or "down"
    const [cardFace, setCardFace] = useState<CardFace>("down");

    const [selectionIndex, setSelectionIndex] = useState(0);
    const [answers, setAnswers] = useState<(Symbol | null)[]>([]);
    const [showPicker, setShowPicker] = useState(false);

    const cardsRef = useRef<HTMLDivElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);

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

    // Shuffle array using Fisher-Yates
    const shuffleArray = <T,>(arr: T[]): T[] => {
        const newArr = [...arr];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    // Generate all rounds upfront
    const generateRounds = useCallback((): RoundData[] => {
        const newRounds: RoundData[] = [];
        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            newRounds.push({ order: shuffleArray([...SYMBOLS]) });
        }
        return newRounds;
    }, []);

    // Start game
    const startGame = useCallback(() => {
        // Ensure audio context is created
        if (!audioCtxRef.current) {
            audioCtxRef.current = createAudioContext();
        }
        setGameState("countdown");
        setCountdown(3);
        setCurrentRound(0);
        setCardFace("down");
        setSelectionIndex(0);
        setAnswers(Array(TOTAL_ROUNDS * CARDS_COUNT).fill(null));
        setShowPicker(false);
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

            // Generate all rounds
            const newRounds = generateRounds();
            setRounds(newRounds);
            // Store first round order for answer comparison
            setFirstRoundOrder([...newRounds[0].order]);
            setCardFace("up"); // Start first round face up
            setGameState("rounds");
        }
    }, [gameState, countdown, generateRounds]);

    // Round sequence using GSAP timeline
    useEffect(() => {
        if (gameState !== "rounds" || rounds.length === 0) return;

        // Kill any existing timeline
        if (timelineRef.current) {
            timelineRef.current.kill();
        }

        const cardsContainer = cardsRef.current;
        if (!cardsContainer) return;

        // Ensure cards start face up at beginning of each round
        setCardFace("up");

        // Create timeline for this round
        const tl = gsap.timeline();
        timelineRef.current = tl;

        // Wait for reveal time
        tl.to({}, { duration: revealTime });

        // Flip cards face down
        tl.call(() => {
            setCardFace("down");
            playBeep(audioCtxRef.current, 400, 0.1, 0.1);
        });

        // Wait for flip animation
        tl.to({}, { duration: 0.5 });

        if (currentRound < TOTAL_ROUNDS - 1) {
            // Shuffle animation: lift cards
            tl.to(cardsContainer.children, {
                y: -20,
                duration: 0.2,
                stagger: 0.03,
                ease: "power2.out",
            });

            // Move cards horizontally with rotation
            tl.to(cardsContainer.children, {
                x: () => (Math.random() - 0.5) * 80,
                rotation: () => (Math.random() - 0.5) * 15,
                duration: 0.25,
                stagger: 0.02,
                ease: "power1.inOut",
            });

            // Return cards to position
            tl.to(cardsContainer.children, {
                x: 0,
                y: 0,
                rotation: 0,
                duration: 0.25,
                stagger: 0.02,
                ease: "power2.out",
            });

            // Advance to next round and flip face up
            tl.call(() => {
                setCurrentRound((prev) => prev + 1);
                // Face will be set to "up" by the next effect cycle
            });
        } else {
            // All rounds complete - go to selection phase
            tl.call(() => {
                setGameState("selection");
            });
        }

        return () => {
            if (timelineRef.current) {
                timelineRef.current.kill();
            }
        };
    }, [gameState, currentRound, rounds.length, revealTime]);

    // Handle symbol selection
    const handleSymbolSelect = (symbol: Symbol) => {
        const newAnswers = [...answers];
        newAnswers[selectionIndex] = symbol;
        setAnswers(newAnswers);
        setShowPicker(false);

        // Play selection sound
        playBeep(audioCtxRef.current, 600, 0.08, 0.1);

        if (selectionIndex < TOTAL_ROUNDS * CARDS_COUNT - 1) {
            setSelectionIndex((prev) => prev + 1);
        } else {
            // All answers submitted
            setTimeout(() => setGameState("result"), 300);
        }
    };

    // Calculate score - compare against ALL rounds
    const calculateScore = (): number => {
        let correct = 0;
        for (let i = 0; i < TOTAL_ROUNDS * CARDS_COUNT; i++) {
            const roundIdx = Math.floor(i / CARDS_COUNT);
            const cardIdx = i % CARDS_COUNT;
            const expectedSymbol = rounds[roundIdx]?.order[cardIdx];
            if (answers[i] === expectedSymbol) {
                correct++;
            }
        }
        return correct;
    };

    const resetGame = () => {
        setGameState("settings");
        setRounds([]);
        setFirstRoundOrder([]);
        setCurrentRound(0);
        setCardFace("down");
        setSelectionIndex(0);
        setAnswers([]);
    };

    const currentRoundIndex = Math.floor(selectionIndex / CARDS_COUNT);
    const currentCardIndex = selectionIndex % CARDS_COUNT;

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
                        Sequential Memory Cards
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
                                How long should each sequence be visible?
                            </p>
                        </div>

                        <div className="space-y-6 rounded-2xl bg-surface border border-border p-6">
                            <Slider
                                label="Reveal Time per Round"
                                value={revealTime}
                                onChange={setRevealTime}
                                min={1}
                                max={30}
                                unit="s"
                            />
                            <div className="pt-4 border-t border-border">
                                <p className="text-sm text-muted">
                                    <span className="text-foreground font-medium">How to play:</span> Watch 10 rounds of card shuffles.
                                    After all rounds, recall the symbol on each card for each round.
                                    {TOTAL_ROUNDS * CARDS_COUNT} total answers required.
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

                {/* Rounds - Card Display */}
                {gameState === "rounds" && rounds.length > 0 && (
                    <div className="w-full max-w-3xl">
                        {/* Status */}
                        <div className="mb-8 text-center">
                            <p className="text-muted">
                                Round <span className="text-primary font-bold font-[family-name:var(--font-space-grotesk)]">{currentRound + 1}</span> of {TOTAL_ROUNDS}
                            </p>
                            {cardFace === "up" && (
                                <p className="mt-2 text-sm text-muted">Memorize the positions...</p>
                            )}
                        </div>

                        {/* Cards - Using explicit cardFace state */}
                        <div
                            ref={cardsRef}
                            className="flex justify-center gap-3 sm:gap-4 md:gap-6"
                            style={{ perspective: "1000px" }}
                        >
                            {rounds[currentRound]?.order.map((symbol, idx) => (
                                <div
                                    key={`${currentRound}-${idx}`}
                                    className="relative w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36"
                                    style={{
                                        transformStyle: "preserve-3d",
                                        transition: "transform 0.4s ease-out",
                                        transform: cardFace === "down" ? "rotateY(180deg)" : "rotateY(0deg)",
                                    }}
                                >
                                    {/* Front face (symbols visible) */}
                                    <div
                                        className="absolute inset-0 rounded-xl bg-surface-2 border border-border flex items-center justify-center"
                                        style={{
                                            backfaceVisibility: "hidden",
                                            transform: "rotateY(0deg)",
                                        }}
                                    >
                                        <SymbolIcon symbol={symbol} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary" />
                                    </div>
                                    {/* Back face (hidden) */}
                                    <div
                                        className="absolute inset-0 rounded-xl bg-surface-3 border border-border flex items-center justify-center"
                                        style={{
                                            backfaceVisibility: "hidden",
                                            transform: "rotateY(180deg)",
                                        }}
                                    >
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-2" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Progress */}
                        <div className="mt-8 flex justify-center gap-1">
                            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 w-6 rounded-full transition-colors ${i <= currentRound ? "bg-primary" : "bg-surface-3"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Selection Phase */}
                {gameState === "selection" && (
                    <div className="w-full max-w-3xl">
                        {/* Status */}
                        <div className="mb-6 text-center">
                            <p className="text-muted">
                                Round <span className="text-primary font-bold font-[family-name:var(--font-space-grotesk)]">{currentRoundIndex + 1}</span>,
                                Card <span className="text-primary font-bold font-[family-name:var(--font-space-grotesk)]">{currentCardIndex + 1}</span>
                            </p>
                            <p className="mt-1 text-sm text-muted">
                                Answer {selectionIndex + 1} of {TOTAL_ROUNDS * CARDS_COUNT}
                            </p>
                        </div>

                        {/* Card positions - Show first round's LAYOUT for reference */}
                        <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 mb-8">
                            {Array.from({ length: CARDS_COUNT }).map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => idx === currentCardIndex && setShowPicker(true)}
                                    className={`
                    w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-xl
                    flex items-center justify-center transition-all
                    ${idx === currentCardIndex
                                            ? "bg-primary/20 border-2 border-primary"
                                            : idx < currentCardIndex
                                                ? "bg-surface-2 border border-border"
                                                : "bg-surface border border-border opacity-50"
                                        }
                  `}
                                >
                                    {idx < currentCardIndex && answers[currentRoundIndex * CARDS_COUNT + idx] && (
                                        <SymbolIcon
                                            symbol={answers[currentRoundIndex * CARDS_COUNT + idx]!}
                                            className="w-8 h-8 sm:w-10 sm:h-10 text-muted"
                                        />
                                    )}
                                    {idx === currentCardIndex && (
                                        <span className="text-2xl text-primary">?</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Symbol Picker */}
                        {showPicker && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
                                <div className="rounded-2xl bg-surface border border-border p-6">
                                    <p className="mb-4 text-center text-foreground font-medium">
                                        What symbol was on this card?
                                    </p>
                                    <div className="flex gap-4">
                                        {SYMBOLS.map((symbol) => (
                                            <button
                                                key={symbol}
                                                onClick={() => handleSymbolSelect(symbol)}
                                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface-2 border border-border 
                          flex items-center justify-center transition-all
                          hover:bg-surface-3 hover:border-primary"
                                            >
                                                <SymbolIcon symbol={symbol} className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setShowPicker(false)}
                                        className="mt-4 w-full text-sm text-muted hover:text-foreground"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Tap hint */}
                        {!showPicker && (
                            <p className="text-center text-muted text-sm">
                                Tap the highlighted card to select a symbol
                            </p>
                        )}

                        {/* Progress */}
                        <div className="mt-8 flex justify-center gap-1">
                            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 w-6 rounded-full transition-colors ${i < currentRoundIndex
                                            ? "bg-success"
                                            : i === currentRoundIndex
                                                ? "bg-primary"
                                                : "bg-surface-3"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Result */}
                {gameState === "result" && (
                    <div className="w-full max-w-md space-y-8 text-center">
                        <div>
                            {(() => {
                                const score = calculateScore();
                                const percent = Math.round((score / (TOTAL_ROUNDS * CARDS_COUNT)) * 100);
                                return (
                                    <>
                                        <div
                                            className={`mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full ${percent >= 80 ? "bg-success/20" : percent >= 50 ? "bg-primary/20" : "bg-error/20"
                                                }`}
                                        >
                                            <span className={`font-[family-name:var(--font-space-grotesk)] text-2xl font-bold ${percent >= 80 ? "text-success" : percent >= 50 ? "text-primary" : "text-error"
                                                }`}>
                                                {percent}%
                                            </span>
                                        </div>
                                        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-foreground">
                                            {percent >= 80 ? "Excellent!" : percent >= 50 ? "Good Effort!" : "Keep Practicing!"}
                                        </h2>

                                        <div className="mt-6 rounded-2xl bg-surface border border-border p-6">
                                            <p className="text-sm text-muted mb-2">Your Score</p>
                                            <p className="font-[family-name:var(--font-space-grotesk)] text-5xl font-bold text-foreground">
                                                {score}<span className="text-2xl text-muted">/{TOTAL_ROUNDS * CARDS_COUNT}</span>
                                            </p>
                                            <p className="mt-4 text-muted">
                                                {percent >= 80
                                                    ? "Outstanding sequential memory!"
                                                    : percent >= 50
                                                        ? "Your memory is improving. Try a longer reveal time."
                                                        : "This is a challenging test. Keep practicing!"}
                                            </p>
                                        </div>
                                    </>
                                );
                            })()}
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
