"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import Link from "next/link";

interface CardProps {
    title: string;
    description: string;
    href: string;
    icon?: React.ReactNode;
}

export function Card({ title, description, href, icon }: CardProps) {
    const cardRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseEnter = () => {
            gsap.to(card, {
                y: -8,
                duration: 0.3,
                ease: "power2.out",
            });
            gsap.to(card.querySelector(".card-glow"), {
                opacity: 1,
                duration: 0.3,
            });
        };

        const handleMouseLeave = () => {
            gsap.to(card, {
                y: 0,
                duration: 0.3,
                ease: "power2.out",
            });
            gsap.to(card.querySelector(".card-glow"), {
                opacity: 0,
                duration: 0.3,
            });
        };

        card.addEventListener("mouseenter", handleMouseEnter);
        card.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            card.removeEventListener("mouseenter", handleMouseEnter);
            card.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    return (
        <Link
            ref={cardRef}
            href={href}
            className="group relative block rounded-2xl bg-surface border border-border p-8 transition-colors hover:border-primary/50"
        >
            {/* Glow effect */}
            <div className="card-glow pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/10 to-transparent opacity-0" />

            {/* Content */}
            <div className="relative z-10">
                {icon && (
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-2 text-primary">
                        {icon}
                    </div>
                )}

                <h3 className="mb-3 font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-foreground">
                    {title}
                </h3>

                <p className="mb-6 text-muted leading-relaxed">
                    {description}
                </p>

                <div className="flex items-center gap-2 text-primary font-medium">
                    <span>Start Training</span>
                    <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
