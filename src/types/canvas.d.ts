import { Canvas, Object as FabricObject, Point } from 'fabric/fabric-impl'

export type CanvasTool = 'select' | 'line' | 'ellipse' | 'edgeBrush' | 'edgeEraser' | 'heelEllipse' | 'toeEllipse' | 'boneLine' | 'bunionEllipse'

export interface ToolOptions {
  strokeWidth?: number
  strokeColor?: string
  fillColor?: string
  opacity?: number
  selectable?: boolean
}

export interface AnnotationObject extends FabricObject {
  id: string
  type: string
  patientId: string
  imageId: string
  toolType: CanvasTool
  metadata?: Record<string, any>
}

export interface CanvasState {
  canvas: Canvas | null
  activeTool: CanvasTool
  selectedObject: AnnotationObject | null
  objects: AnnotationObject[]
  patientId: string
  imageId: string
  isDrawing: boolean
  zoom: number
  toolOptions: ToolOptions
}

export interface CanvasToolHandler {
  initialize: (canvas: Canvas, options?: ToolOptions) => void
  cleanup: (canvas: Canvas) => void
  onMouseDown?: (event: fabric.IEvent, point: Point, state: CanvasState) => void
  onMouseMove?: (event: fabric.IEvent, point: Point, state: CanvasState) => void
  onMouseUp?: (event: fabric.IEvent, point: Point, state: CanvasState) => void
  onObjectSelected?: (object: AnnotationObject, state: CanvasState) => void
  onObjectModified?: (object: AnnotationObject, state: CanvasState) => void
}

export interface Annotation {
  id: string
  patientId: string
  imageId: string
  createdAt: string
  updatedAt: string
  objects: SerializedAnnotationObject[]
  metadata?: Record<string, any>
}

export interface SerializedAnnotationObject {
  id: string
  type: string
  toolType: CanvasTool
  json: string
  metadata?: Record<string, any>
} 