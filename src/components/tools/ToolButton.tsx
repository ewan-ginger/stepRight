'use client'

import React from 'react'
import type { CanvasTool } from '@/types/canvas'

interface ToolButtonProps {
  tool: CanvasTool
  label: string
  icon: React.ReactNode
  activeTool: CanvasTool
  onClick: (tool: CanvasTool) => void
}

export default function ToolButton({
  tool,
  label,
  icon,
  activeTool,
  onClick
}: ToolButtonProps) {
  const isActive = tool === activeTool
  
  return (
    <button
      type="button"
      className={`
        flex flex-col items-center justify-center p-2 rounded-md
        ${isActive 
          ? 'bg-blue-100 text-blue-700' 
          : 'hover:bg-gray-100 text-gray-700'
        }
      `}
      onClick={() => onClick(tool)}
      title={label}
    >
      <div className="text-xl">{icon}</div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  )
} 