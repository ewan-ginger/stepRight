import { fabric } from 'fabric'
import { v4 as uuidv4 } from 'uuid'
import type { Canvas } from 'fabric/fabric-impl'
import type { CanvasToolHandler, ToolOptions, CanvasState, AnnotationObject } from '@/types/canvas'

class EllipseTool implements CanvasToolHandler {
  private ellipse: fabric.Ellipse | null = null
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
    this.ellipse = null
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
    
    this.ellipse = new fabric.Ellipse({
      left: point.x,
      top: point.y,
      rx: 0,
      ry: 0,
      stroke: this.options.strokeColor || '#FF0000',
      strokeWidth: this.options.strokeWidth || 2,
      fill: this.options.fillColor || 'rgba(255, 0, 0, 0.2)',
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center'
    }) as unknown as fabric.Ellipse
    
    state.canvas.add(this.ellipse)
    state.canvas.renderAll()
  }

  onMouseMove(event: fabric.IEvent, point: fabric.Point, state: CanvasState): void {
    if (!state.canvas || !this.ellipse || !this.startPoint) return

    // Calculate width and height
    const width = Math.abs(point.x - this.startPoint.x)
    const height = Math.abs(point.y - this.startPoint.y)
    
    // Calculate center point
    const left = Math.min(this.startPoint.x, point.x) + width / 2
    const top = Math.min(this.startPoint.y, point.y) + height / 2
    
    this.ellipse.set({
      left,
      top,
      rx: width / 2,
      ry: height / 2
    })
    
    state.canvas.renderAll()
  }

  onMouseUp(event: fabric.IEvent, point: fabric.Point, state: CanvasState): void {
    if (!state.canvas || !this.ellipse || !this.startPoint) return

    // Remove the temporary ellipse
    state.canvas.remove(this.ellipse)

    // Check if it's a valid ellipse (not just a click)
    const minSize = 5
    const dx = point.x - this.startPoint.x
    const dy = point.y - this.startPoint.y
    const width = Math.abs(dx)
    const height = Math.abs(dy)
    
    if (width < minSize || height < minSize) {
      state.canvas.renderAll()
      return
    }

    // Calculate center point
    const left = Math.min(this.startPoint.x, point.x) + width / 2
    const top = Math.min(this.startPoint.y, point.y) + height / 2
    
    // Create the final ellipse
    const finishedEllipse = new fabric.Ellipse({
      left,
      top,
      rx: width / 2,
      ry: height / 2,
      stroke: this.options.strokeColor || '#FF0000',
      strokeWidth: this.options.strokeWidth || 2,
      fill: this.options.fillColor || 'rgba(255, 0, 0, 0.2)',
      selectable: true,
      evented: true,
      originX: 'center',
      originY: 'center'
    }) as unknown as AnnotationObject
    
    // Add custom properties
    finishedEllipse.id = uuidv4()
    finishedEllipse.type = 'ellipse'
    finishedEllipse.patientId = this.patientId
    finishedEllipse.imageId = this.imageId
    finishedEllipse.toolType = 'ellipse'
    
    state.canvas.add(finishedEllipse)
    state.canvas.setActiveObject(finishedEllipse)
    state.canvas.renderAll()

    // Reset the tool
    this.ellipse = null
    this.startPoint = null
  }
}

export default new EllipseTool() 