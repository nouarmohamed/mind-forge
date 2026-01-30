"use client";

interface SliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
}

export function Slider({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    unit = "",
}: SliderProps) {
    return (
        <div className="w-full">
            <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-muted">{label}</label>
                <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-foreground">
                    {value}
                    {unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-dark">
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
            </div>
        </div>
    );
}
