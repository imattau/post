import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center text-[12px] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-pill bg-brand text-white hover:brightness-110",
        outline:
          "rounded-pill border border-border bg-pill-subtle text-text-secondary hover:bg-surface-active hover:text-text-near-white",
        secondary:
          "rounded-pill border border-brand/70 bg-surface-active text-brand-light hover:brightness-110",
        ghost:
          "text-text-tertiary hover:text-text-near-white",
        destructive:
          "rounded-pill border border-danger/40 bg-danger/12 text-danger hover:bg-danger/20",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[11px]",
        lg: "h-10 px-6 text-[13px] font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
