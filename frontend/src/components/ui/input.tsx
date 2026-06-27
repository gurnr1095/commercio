import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100",
        "placeholder:text-zinc-500",
        "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "read-only:bg-zinc-800/50 read-only:text-zinc-500",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
