"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-zinc-900/40 backdrop-blur-md shadow-md ring-1 ring-green-800/10 text-zinc-300 inline-flex h-8 w-fit items-center justify-center rounded-xl p-0.5 border border-green-900/10",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:shadow-[0_1px_8px_0_rgba(16,255,120,0.06)] data-[state=active]:border-b-2 data-[state=active]:border-green-400/40 data-[state=active]:text-green-200 focus-visible:ring-1 focus-visible:ring-green-400/30 focus-visible:outline-none text-zinc-200 dark:text-zinc-300 inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-lg border-b-2 border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 hover:text-green-200/80",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
