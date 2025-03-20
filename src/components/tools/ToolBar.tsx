'use client'

import React from 'react'
import ToolButton from './ToolButton'
import type { CanvasTool } from '@/types/canvas'

interface ToolBarProps {
  activeTool: CanvasTool
  onToolChange: (tool: CanvasTool) => void
}

export default function ToolBar({ activeTool, onToolChange }: ToolBarProps) {
  return (
    <div className="bg-white p-2 rounded-lg shadow-md flex space-x-2">
      <ToolButton
        tool="select"
        label="Select"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
          </svg>
        }
        activeTool={activeTool}
        onClick={onToolChange}
      />
      <ToolButton
        tool="line"
        label="Line"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        }
        activeTool={activeTool}
        onClick={onToolChange}
      />
      <ToolButton
        tool="ellipse"
        label="Ellipse"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        }
        activeTool={activeTool}
        onClick={onToolChange}
      />
    </div>
  )
} 