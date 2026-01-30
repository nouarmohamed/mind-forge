"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
}

export function Button({
    variant = "primary",
    size = "md",
    children,
    className = "",
    disabled,
    ...props
}: ButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const button = buttonRef.current;
        if (!button || disabled) return;

        const handleMouseEnter = () => {
            gsap.to(button, {
                scale: 1.02,
                duration: 0.2,
                ease: "power2.out",
            });
        };

        const handleMouseLeave = () => {
            gsap.to(button, {
                scale: 1,
                duration: 0.2,
                ease: "power2.out",
            });
        };

        const handleMouseDown = () => {
            gsap.to(button, {
                scale: 0.98,
                duration: 0.1,
                ease: "power2.out",
            });
        };

        const handleMouseUp = () => {
            gsap.to(button, {
                scale: 1.02,
                duration: 0.1,
                ease: "power2.out",
            });
        };

        button.addEventListener("mouseenter", handleMouseEnter);
        button.addEventListener("mouseleave", handleMouseLeave);
        button.addEventListener("mousedown", handleMouseDown);
        button.addEventListener("mouseup", handleMouseUp);

        return () => {
            button.removeEventListener("mouseenter", handleMouseEnter);
            button.removeEventListener("mouseleave", handleMouseLeave);
            button.removeEventListener("mousedown", handleMouseDown);
            button.removeEventListener("mouseup", handleMouseUp);
        };
    }, [disabled]);

    const baseStyles =
        "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 rounded-lg";

    const variants = {
        primary:
            "bg-primary text-white hover:bg-primary-light active:bg-primary-dark",
        secondary:
            "bg-surface-2 text-foreground hover:bg-surface-3 border border-border",
        ghost: "text-muted hover:text-foreground hover:bg-surface-2",
    };

    const sizes = {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-base",
        lg: "h-14 px-8 text-lg",
    };

    return (
        <button
            ref={buttonRef}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}
