import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400",
        critical:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants }
