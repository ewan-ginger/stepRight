import type { Canvas } from 'fabric/fabric-impl'
import type { CanvasToolHandler, ToolOptions, CanvasState, AnnotationObject } from '@/types/canvas'

class SelectionTool implements CanvasToolHandler {
  initialize(canvas: Canvas, options: ToolOptions = {}): void {
    canvas.defaultCursor = 'default'
    canvas.selection = true
    canvas.renderAll()
  }

  cleanup(canvas: Canvas): void {
    // No specific cleanup required
  }

  onObjectSelected(object: AnnotationObject, state: CanvasState): void {
    // This is called when an object is selected
    if (!state.canvas) return

    // Update the selected object in state
    state.selectedObject = object
  }

  onObjectModified(object: AnnotationObject, state: CanvasState): void {
    // This is called when an object is modified (moved, resized, etc.)
    if (!state.canvas) return

    // You could save the modification to the server here
    console.log('Object modified:', object)
  }
}

export default new SelectionTool() 