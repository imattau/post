import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-[12px] border border-border bg-[#11151D] px-4 py-1 text-[14px] text-text-near-white transition-colors outline-none placeholder:text-text-placeholder focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive/50 aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
