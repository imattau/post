"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"

function MenuRoot(props: MenuPrimitive.Root.Props) {
  return (
    <MenuPrimitive.Root
      data-slot="menu"
      {...props}
    />
  )
}

function MenuTrigger({ className, ...props }: MenuPrimitive.Trigger.Props) {
  return (
    <MenuPrimitive.Trigger
      data-slot="menu-trigger"
      nativeButton={false}
      className={cn("cursor-pointer", className)}
      {...props}
    />
  )
}

function MenuPopup({
  className,
  side = "bottom",
  align = "end",
  sideOffset = 8,
  ...props
}: MenuPrimitive.Popup.Props & Pick<MenuPrimitive.Positioner.Props, "side" | "align" | "sideOffset">) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <MenuPrimitive.Popup
          data-slot="menu-popup"
          className={cn(
            "w-[180px] rounded-[12px] border border-border bg-dock py-1 shadow-lg",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function MenuItem({
  className,
  ...props
}: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      className={cn(
        "flex w-full cursor-default items-center px-4 py-2.5 text-left text-[12px] font-medium outline-none select-none hover:bg-surface-active focus-visible:bg-surface-active data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export {
  MenuRoot,
  MenuTrigger,
  MenuPopup,
  MenuItem,
}
