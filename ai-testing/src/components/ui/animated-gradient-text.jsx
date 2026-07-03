import { cn } from "@/lib/utils";

export function AnimatedGradientText({ children, className, ...props }) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#F97316] bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
