import * as React from "react";
import { cn } from "../lib/utils";

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    { className, min = 0, max = 100, step = 1, value, defaultValue, onValueChange, ...props },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || 50);
    const currentValue = value ?? internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };

    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        className={cn(
          "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider",
          className
        )}
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentValue - min) / (max - min)) * 100}%, #e5e7eb ${((currentValue - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
        }}
        {...props}
      />
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
