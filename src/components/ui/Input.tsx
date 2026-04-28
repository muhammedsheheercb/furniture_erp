"use client";
import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, leftIcon, rightIcon, wrapperClassName, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
        return (
            <div className={cn("flex flex-col gap-1", wrapperClassName)}>
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            {leftIcon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900",
                            "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                            "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
                            "transition-colors",
                            error && "border-red-500 focus:ring-red-500",
                            leftIcon && "pl-9",
                            rightIcon && "pr-9",
                            className,
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            {rightIcon}
                        </span>
                    )}
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";
export default Input;