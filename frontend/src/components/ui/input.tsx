import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
        "placeholder:text-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "read-only:bg-gray-50 read-only:text-gray-500",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
