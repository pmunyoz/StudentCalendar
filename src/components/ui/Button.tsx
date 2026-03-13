import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
}

/**
 * Componente principal de Botón.
 * Soporta varias variantes y tamaños según el sistema de diseño.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {

        const variants = {
            primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm",
            secondary: "bg-primary-100 text-primary-700 hover:bg-primary-200 active:bg-primary-300",
            outline: "border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-xs rounded-lg",
            md: "px-4 py-2 text-sm rounded-xl",
            lg: "px-6 py-3 text-base rounded-2xl",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";
