"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = "", type = "text", ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="mb-2 block text-sm font-medium text-muted">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    type={type}
                    className={`
            w-full rounded-lg border border-border bg-surface-2 px-4 py-3
            text-foreground placeholder:text-muted-dark
            focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
            transition-colors
            ${type === "number" ? "font-[family-name:var(--font-space-grotesk)] text-center text-2xl font-bold" : ""}
            ${error ? "border-error" : ""}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-error">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
