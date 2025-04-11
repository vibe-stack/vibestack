"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react"

interface InspectorProps {
  nodeId?: string | null
}

export default function Inspector({ nodeId }: InspectorProps) {
  const [sections, setSections] = useState({
    transform: true,
    renderer: true,
    physics: false,
    script: true,
  })

  const toggleSection = (section: keyof typeof sections) => {
    setSections({
      ...sections,
      [section]: !sections[section],
    })
  }

  // If no node is selected, show a message
  if (!nodeId) {
    return <div className="flex items-center justify-center h-full text-zinc-400">Select an object to inspect</div>
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="object-name" className="text-sm font-medium">
              Name
            </Label>
          </div>
          <Input id="object-name" value="Player" className="h-9 bg-zinc-800/30 border-0 rounded-lg" />
        </div>

        <Separator className="bg-zinc-800/30" />

        {/* Transform Component */}
        <div className="space-y-3">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("transform")}>
            <div className="flex items-center">
              {sections.transform ? (
                <ChevronDown className="h-4 w-4 mr-1.5 opacity-70" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1.5 opacity-70" />
              )}
              <Label className="text-sm font-medium text-zinc-200">Transform</Label>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
              <Trash2 className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </div>

          {sections.transform && (
            <div className="grid grid-cols-3 gap-3 pl-6">
              <div className="space-y-1.5">
                <Label htmlFor="pos-x" className="text-xs text-zinc-400">
                  X
                </Label>
                <Input id="pos-x" value="100" className="h-8 bg-zinc-800/30 border-0 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pos-y" className="text-xs text-zinc-400">
                  Y
                </Label>
                <Input id="pos-y" value="150" className="h-8 bg-zinc-800/30 border-0 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pos-z" className="text-xs text-zinc-400">
                  Z
                </Label>
                <Input id="pos-z" value="0" className="h-8 bg-zinc-800/30 border-0 rounded-lg" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="scale-x" className="text-xs text-zinc-400">
                  Scale X
                </Label>
                <Input id="scale-x" value="1" className="h-8 bg-zinc-800/30 border-0 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="scale-y" className="text-xs text-zinc-400">
                  Scale Y
                </Label>
                <Input id="scale-y" value="1" className="h-8 bg-zinc-800/30 border-0 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rotation" className="text-xs text-zinc-400">
                  Rotation
                </Label>
                <Input id="rotation" value="0" className="h-8 bg-zinc-800/30 border-0 rounded-lg" />
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-zinc-800/30" />

        {/* Renderer Component */}
        <div className="space-y-3">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("renderer")}>
            <div className="flex items-center">
              {sections.renderer ? (
                <ChevronDown className="h-4 w-4 mr-1.5 opacity-70" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1.5 opacity-70" />
              )}
              <Label className="text-sm font-medium text-zinc-200">Sprite Renderer</Label>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
              <Trash2 className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </div>

          {sections.renderer && (
            <div className="space-y-3 pl-6">
              <div className="space-y-1.5">
                <Label htmlFor="sprite" className="text-xs text-zinc-400">
                  Sprite
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="sprite"
                    value="player.png"
                    className="h-8 flex-1 bg-zinc-800/30 border-0 rounded-lg"
                    readOnly
                  />
                  <Button variant="outline" size="sm" className="h-8 rounded-lg bg-zinc-800/50 border-0">
                    Browse
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="flip-x" className="rounded data-[state=checked]:bg-violet-600 border-zinc-700" />
                <Label htmlFor="flip-x" className="text-xs text-zinc-300">
                  Flip X
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="flip-y" className="rounded data-[state=checked]:bg-violet-600 border-zinc-700" />
                <Label htmlFor="flip-y" className="text-xs text-zinc-300">
                  Flip Y
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="color" className="text-xs text-zinc-400">
                  Color
                </Label>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-500" />
                  <Input id="color" value="#8b5cf6" className="h-8 flex-1 bg-zinc-800/30 border-0 rounded-lg" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="order" className="text-xs text-zinc-400">
                  Sorting Order
                </Label>
                <Input id="order" value="0" className="h-8 bg-zinc-800/30 border-0 rounded-lg" type="number" />
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-zinc-800/30" />

        {/* Physics Component */}
        <div className="space-y-3">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("physics")}>
            <div className="flex items-center">
              {sections.physics ? (
                <ChevronDown className="h-4 w-4 mr-1.5 opacity-70" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1.5 opacity-70" />
              )}
              <Label className="text-sm font-medium text-zinc-200">Physics</Label>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
              <Trash2 className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </div>

          {sections.physics && (
            <div className="space-y-3 pl-6">
              <div className="space-y-1.5">
                <Label htmlFor="body-type" className="text-xs text-zinc-400">
                  Body Type
                </Label>
                <select id="body-type" className="w-full h-8 rounded-lg bg-zinc-800/30 border-0 px-3 py-1 text-sm">
                  <option>Dynamic</option>
                  <option>Static</option>
                  <option>Kinematic</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="is-sensor" className="rounded data-[state=checked]:bg-violet-600 border-zinc-700" />
                <Label htmlFor="is-sensor" className="text-xs text-zinc-300">
                  Is Sensor
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mass" className="text-xs text-zinc-400">
                  Mass
                </Label>
                <Input id="mass" value="1" className="h-8 bg-zinc-800/30 border-0 rounded-lg" type="number" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="friction" className="text-xs text-zinc-400">
                  Friction
                </Label>
                <Input
                  id="friction"
                  value="0.2"
                  className="h-8 bg-zinc-800/30 border-0 rounded-lg"
                  type="number"
                  step="0.1"
                />
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-zinc-800/30" />

        {/* Script Component */}
        <div className="space-y-3">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("script")}>
            <div className="flex items-center">
              {sections.script ? (
                <ChevronDown className="h-4 w-4 mr-1.5 opacity-70" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1.5 opacity-70" />
              )}
              <Label className="text-sm font-medium text-zinc-200">Script</Label>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
              <Trash2 className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </div>

          {sections.script && (
            <div className="space-y-3 pl-6">
              <div className="space-y-1.5">
                <Label htmlFor="script-file" className="text-xs text-zinc-400">
                  Script
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="script-file"
                    value="player.js"
                    className="h-8 flex-1 bg-zinc-800/30 border-0 rounded-lg"
                    readOnly
                  />
                  <Button variant="outline" size="sm" className="h-8 rounded-lg bg-zinc-800/50 border-0">
                    Browse
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Properties</Label>
                <div className="space-y-2 rounded-lg bg-zinc-800/20 p-3">
                  <div className="flex gap-2">
                    <Input placeholder="Name" value="speed" className="h-8 flex-1 bg-zinc-800/30 border-0 rounded-lg" />
                    <Input placeholder="Value" value="5" className="h-8 flex-1 bg-zinc-800/30 border-0 rounded-lg" />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Name"
                      value="health"
                      className="h-8 flex-1 bg-zinc-800/30 border-0 rounded-lg"
                    />
                    <Input placeholder="Value" value="100" className="h-8 flex-1 bg-zinc-800/30 border-0 rounded-lg" />
                  </div>
                  <Button variant="outline" size="sm" className="w-full h-8 rounded-lg bg-zinc-800/30 border-0 mt-2">
                    <Plus className="h-3 w-3 mr-1.5" />
                    Add Property
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-zinc-800/30" />

        <Button variant="outline" size="sm" className="w-full rounded-lg bg-zinc-800/30 border-0 h-9">
          <Plus className="h-4 w-4 mr-2" />
          Add Component
        </Button>
      </div>
    </ScrollArea>
  )
}
