import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Seed of the shadcn/ui-style layer: Radix primitive + Tailwind + `cva`.
 * New UI is built here rather than as another CSS module.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-transform disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-sage-700)] text-[var(--color-paper)] hover:bg-[var(--color-sage-800)]",
        secondary:
          "bg-[var(--color-surface)] text-[var(--color-wood-800)] border border-[var(--color-sand-200)]",
        ghost: "bg-transparent text-[var(--color-wood-600)] hover:bg-[var(--color-sand-100)]",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
