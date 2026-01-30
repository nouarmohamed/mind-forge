"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Card } from "@/components/ui";

const games = [
  {
    title: "Flash Mental Arithmetic",
    description:
      "Numbers flash on screen in rapid succession. Calculate their sum mentally and test your arithmetic speed.",
    href: "/flash-arithmetic",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Chimpanzee Memory Test",
    description:
      "Inspired by primate cognition research. Memorize number positions and recall them in ascending order.",
    href: "/chimp-test",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    title: "Sequential Memory Cards",
    description:
      "Track symbols through 10 shuffle rounds. A demanding test of your visual and sequential memory.",
    href: "/memory-cards",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation
      gsap.from(heroRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power3.out",
      });

      // Stagger cards
      gsap.from(cardsRef.current?.children || [], {
        opacity: 0,
        y: 40,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.3,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-foreground">
              Mind Forge
            </span>
          </div>
          <nav className="hidden items-center gap-8 sm:flex">
            <a href="#games" className="text-sm text-muted transition-colors hover:text-foreground">
              Games
            </a>
            <a href="#about" className="text-sm text-muted transition-colors hover:text-foreground">
              About
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex min-h-screen items-center justify-center px-6 pt-16">
        <div ref={heroRef} className="mx-auto max-w-4xl text-center">
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Train Your Mind.
            <br />
            <span className="text-primary">Sharpen Your Focus.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">
            Professional cognitive training designed to enhance your mental arithmetic,
            memory, and focus. Science-backed exercises, distraction-free experience.
          </p>
          <div className="mt-10">
            <a
              href="#games"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Training
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section id="games" className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-foreground sm:text-3xl">
              Choose Your Training
            </h2>
            <p className="mt-3 text-muted">
              Select a cognitive exercise to begin your session
            </p>
          </div>
          <div
            ref={cardsRef}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {games.map((game) => (
              <Card key={game.href} {...game} />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-foreground sm:text-3xl">
            Why Mind Forge?
          </h2>
          <p className="mt-6 text-muted leading-relaxed">
            Mind Forge is built on principles from cognitive science research.
            Each exercise is designed to challenge specific mental faculties—arithmetic
            processing, working memory, and sequential recall. The minimal, distraction-free
            interface ensures you stay focused on what matters: improving your cognitive performance.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div>
              <div className="mb-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-primary">3</div>
              <div className="text-sm text-muted">Targeted Exercises</div>
            </div>
            <div>
              <div className="mb-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted">Distraction-Free</div>
            </div>
            <div>
              <div className="mb-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-primary">∞</div>
              <div className="text-sm text-muted">Practice Sessions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-dark">
          <p>© 2026 Mind Forge. Train smarter, think faster.</p>
        </div>
      </footer>
    </div>
  );
}
