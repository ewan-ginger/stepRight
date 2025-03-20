import { fabric } from 'fabric'
import { v4 as uuidv4 } from 'uuid'
import type { Canvas } from 'fabric/fabric-impl'
import type { CanvasToolHandler, ToolOptions, CanvasState, AnnotationObject } from '@/types/canvas'

class LineTool implements CanvasToolHandler {
  private line: fabric.Line | null = null
  private startPoint: { x: number; y: number } | null = null
  private options: ToolOptions = {}
  private patientId: string = ''
  private imageId: string = ''

  initialize(canvas: Canvas, options: ToolOptions = {}): void {
    this.options = options
    canvas.defaultCursor = 'crosshair'
    canvas.selection = false
    canvas.discardActiveObject()
    canvas.renderAll()
  }

  cleanup(canvas: Canvas): void {
    this.line = null
    this.startPoint = null
    canvas.defaultCursor = 'default'
    canvas.selection = true
    canvas.renderAll()
  }

  onMouseDown(event: fabric.IEvent, point: fabric.Point, state: CanvasState): void {
    if (!state.canvas) return

    this.patientId = state.patientId
    this.imageId = state.imageId
    this.startPoint = point
    
    const points = [point.x, point.y, point.x, point.y]
    
    this.line = new fabric.Line(points, {
      stroke: this.options.strokeColor || '#FF0000',
      strokeWidth: this.options.strokeWidth || 2,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center'
    }) as unknown as fabric.Line
    
    state.canvas.add(this.line)
    state.canvas.renderAll()
  }

  onMouseMove(event: fabric.IEvent, point: fabric.Point, state: CanvasState): void {
    if (!state.canvas || !this.line || !this.startPoint) return

    this.line.set({
      x2: point.x,
      y2: point.y
    })
    
    state.canvas.renderAll()
  }

  onMouseUp(event: fabric.IEvent, point: fabric.Point, state: CanvasState): void {
    if (!state.canvas || !this.line || !this.startPoint) return

    // Remove the temporary line
    state.canvas.remove(this.line)

    // Check if it's a valid line (not just a click)
    const minLength = 5
    const dx = point.x - this.startPoint.x
    const dy = point.y - this.startPoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < minLength) {
      state.canvas.renderAll()
      return
    }

    // Create the final line
    const finishedLine = new fabric.Line(
      [this.startPoint.x, this.startPoint.y, point.x, point.y],
      {
        stroke: this.options.strokeColor || '#FF0000',
        strokeWidth: this.options.strokeWidth || 2,
        selectable: true,
        evented: true
      }
    ) as unknown as AnnotationObject
    
    // Add custom properties
    finishedLine.id = uuidv4()
    finishedLine.type = 'line'
    finishedLine.patientId = this.patientId
    finishedLine.imageId = this.imageId
    finishedLine.toolType = 'line'
    
    state.canvas.add(finishedLine)
    state.canvas.setActiveObject(finishedLine)
    state.canvas.renderAll()

    // Reset the tool
    this.line = null
    this.startPoint = null
  }
}

export default new LineTool() 