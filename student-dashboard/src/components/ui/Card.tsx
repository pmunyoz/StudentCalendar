import React from "react";
import { cn } from "../../lib/utils";

/**
 * Tarjeta base para presentación de contenido.
 */
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", className)}
            {...props}
        />
    )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("px-6 py-5 border-b border-slate-100", className)} {...props} />
    )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn("text-lg font-bold text-slate-800 leading-none", className)} {...props} />
    )
);
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("p-6", className)} {...props} />
    )
);
CardContent.displayName = "CardContent";
