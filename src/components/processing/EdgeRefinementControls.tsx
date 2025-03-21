import React from 'react'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { EdgeBrushTool } from '@/lib/canvas/tools/edgeBrush'
import { EdgeSmoothingTool } from '@/lib/canvas/tools/edgeSmoothing'

interface EdgeRefinementControlsProps {
  edgeBrush: EdgeBrushTool | null
  edgeSmoothingTool: EdgeSmoothingTool | null
  onComplete: () => void
}

export function EdgeRefinementControls({
  edgeBrush,
  edgeSmoothingTool,
  onComplete
}: EdgeRefinementControlsProps) {
  const [brushMode, setBrushMode] = React.useState<'draw' | 'erase'>('draw')
  const [brushWidth, setBrushWidth] = React.useState(5)
  const [brushColor, setBrushColor] = React.useState('#00FF00')
  const [smoothingFactor, setSmoothingFactor] = React.useState(3)

  // Toggle between draw and erase modes
  const toggleBrushMode = () => {
    const newMode = brushMode === 'draw' ? 'erase' : 'draw'
    setBrushMode(newMode)
    if (edgeBrush) {
      edgeBrush.setMode(newMode)
    }
  }

  // Update brush width
  React.useEffect(() => {
    if (edgeBrush) {
      edgeBrush.setWidth(brushWidth)
    }
  }, [brushWidth, edgeBrush])

  // Update brush color
  React.useEffect(() => {
    if (edgeBrush) {
      edgeBrush.setColor(brushColor)
    }
  }, [brushColor, edgeBrush])

  // Update smoothing factor
  React.useEffect(() => {
    if (edgeSmoothingTool) {
      edgeSmoothingTool.setFactor(smoothingFactor)
    }
  }, [smoothingFactor, edgeSmoothingTool])

  // Apply smoothing to all paths
  const applySmoothing = () => {
    if (edgeSmoothingTool) {
      edgeSmoothingTool.smoothAllPaths()
    }
  }

  return (
    <div className="space-y-6 p-4">
      <h3 className="font-semibold mb-4">Edge Refinement Tools</h3>
      
      <div className="space-y-6">
        {/* Tool Selection */}
        <div className="flex gap-2">
          <Button
            variant={brushMode === 'draw' ? 'default' : 'outline'}
            onClick={() => {
              setBrushMode('draw')
              if (edgeBrush) edgeBrush.setMode('draw')
            }}
            className="flex-1"
          >
            Draw
          </Button>
          <Button
            variant={brushMode === 'erase' ? 'default' : 'outline'}
            onClick={() => {
              setBrushMode('erase')
              if (edgeBrush) edgeBrush.setMode('erase')
            }}
            className="flex-1"
          >
            Erase
          </Button>
        </div>

        {/* Brush Width Control */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="brushWidth" className="block text-sm font-medium text-gray-700">
              Brush Width: {brushWidth}px
            </label>
          </div>
          <Slider
            id="brushWidth"
            min={1}
            max={20}
            step={1}
            value={[brushWidth]}
            onValueChange={(value) => setBrushWidth(value[0])}
          />
          <p className="text-xs text-gray-500">
            Controls the width of the drawing/erasing brush
          </p>
        </div>

        {/* Color Selection for draw mode */}
        {brushMode === 'draw' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Brush Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {['#00FF00', '#FFFFFF', '#FF0000', '#0000FF', '#FFFF00', '#FF00FF'].map((color) => (
                <button
                  key={color}
                  onClick={() => setBrushColor(color)}
                  className={`w-full h-8 rounded-md ${
                    brushColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Smoothing Controls */}
        <div className="space-y-4 pt-2 border-t border-gray-200">
          <h4 className="font-medium text-sm">Smoothing Options</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <label htmlFor="smoothingFactor" className="block text-sm font-medium text-gray-700">
                Smoothing Strength: {smoothingFactor}
              </label>
            </div>
            <Slider
              id="smoothingFactor"
              min={1}
              max={10}
              step={1}
              value={[smoothingFactor]}
              onValueChange={(value) => setSmoothingFactor(value[0])}
            />
            <p className="text-xs text-gray-500">
              Higher values produce smoother curves but may lose detail
            </p>
          </div>
          
          <Button 
            onClick={applySmoothing}
            variant="outline"
            className="w-full"
          >
            Apply Smoothing
          </Button>
        </div>

        {/* Complete Button */}
        <div className="pt-4 border-t border-gray-200">
          <Button 
            onClick={onComplete}
            className="w-full"
          >
            Complete Edge Refinement
          </Button>
        </div>
      </div>
    </div>
  )
} 