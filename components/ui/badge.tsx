import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-pill border px-3 py-1 text-[11px] font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "bg-brand/12 text-brand-light border-brand/40",
        outline: "border-border bg-pill-subtle text-text-secondary",
        brand: "bg-brand/12 text-brand-light border-brand/40",
        info: "bg-info/12 text-info border-info/40",
        ok: "bg-ok/12 text-ok border-ok/40",
        warn: "bg-warn/12 text-warn border-warn/40",
        danger: "bg-danger/12 text-danger border-danger/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
