import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[84px] w-full rounded-[12px] border border-border bg-[#11151D] px-4 py-3 text-[14px] text-text-near-white transition-colors outline-none placeholder:text-text-placeholder focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive/50 aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
