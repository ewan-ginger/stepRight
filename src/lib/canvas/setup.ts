import { fabric } from 'fabric'
import { v4 as uuidv4 } from 'uuid'
import type { AnnotationObject, ToolOptions } from '@/types/canvas'

export function createCanvas(
  canvasId: string,
  width: number,
  height: number,
  options: fabric.ICanvasOptions = {}
): fabric.Canvas {
  // Check if fabric is available (only in browser)
  if (typeof window === 'undefined') {
    throw new Error('Canvas can only be initialized in browser environment')
  }

  // Create canvas
  const canvas = new fabric.Canvas(canvasId, {
    width,
    height,
    selection: true,
    preserveObjectStacking: true,
    ...options
  })

  // Set default options
  canvas.freeDrawingBrush.width = 3
  canvas.freeDrawingBrush.color = '#ff0000'

  return canvas
}

export function disposeCanvas(canvas: fabric.Canvas): void {
  canvas.dispose()
}

export function setCanvasBackgroundImage(
  canvas: fabric.Canvas,
  imageUrl: string,
  callback?: () => void
): void {
  fabric.Image.fromURL(imageUrl, (img) => {
    const canvasWidth = canvas.getWidth()
    const canvasHeight = canvas.getHeight()
    
    // Calculate the scale to fit the image within the canvas while maintaining aspect ratio
    const scaleX = canvasWidth / img.width!
    const scaleY = canvasHeight / img.height!
    const scale = Math.min(scaleX, scaleY)
    
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: (canvasWidth - img.width! * scale) / 2,
      top: (canvasHeight - img.height! * scale) / 2,
      selectable: false,
      evented: false,
    })
    
    // Set the image as background
    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
      originX: 'left',
      originY: 'top',
    })
    
    if (callback) callback()
  })
}

export function createLine(
  canvas: fabric.Canvas,
  points: number[],
  options: ToolOptions = {},
  patientId: string,
  imageId: string
): AnnotationObject {
  const defaultOptions = {
    stroke: options.strokeColor || '#000000',
    strokeWidth: options.strokeWidth || 2,
    opacity: options.opacity || 1,
    selectable: options.selectable !== false
  }
  
  const line = new fabric.Line(points, defaultOptions) as AnnotationObject
  
  // Add additional properties for annotation objects
  line.id = uuidv4()
  line.type = 'line'
  line.patientId = patientId
  line.imageId = imageId
  line.toolType = 'line'
  
  canvas.add(line)
  canvas.setActiveObject(line)
  canvas.renderAll()
  
  return line
}

export function createEllipse(
  canvas: fabric.Canvas,
  left: number,
  top: number,
  width: number,
  height: number,
  options: ToolOptions = {},
  patientId: string,
  imageId: string
): AnnotationObject {
  const defaultOptions = {
    stroke: options.strokeColor || '#000000',
    strokeWidth: options.strokeWidth || 2,
    fill: options.fillColor || 'rgba(0,0,0,0)',
    opacity: options.opacity || 1,
    selectable: options.selectable !== false
  }
  
  const ellipse = new fabric.Ellipse({
    left,
    top,
    rx: width / 2,
    ry: height / 2,
    ...defaultOptions
  }) as AnnotationObject
  
  // Add additional properties for annotation objects
  ellipse.id = uuidv4()
  ellipse.type = 'ellipse'
  ellipse.patientId = patientId
  ellipse.imageId = imageId
  ellipse.toolType = 'ellipse'
  
  canvas.add(ellipse)
  canvas.setActiveObject(ellipse)
  canvas.renderAll()
  
  return ellipse
}

export function zoomCanvas(
  canvas: fabric.Canvas,
  zoom: number,
  point?: { x: number; y: number }
): void {
  const center = point || { 
    x: canvas.getWidth() / 2, 
    y: canvas.getHeight() / 2 
  }

  canvas.zoomToPoint(center as fabric.Point, zoom)
  canvas.renderAll()
}

export function resetCanvasZoom(canvas: fabric.Canvas): void {
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
  canvas.renderAll()
}

export function serializeCanvas(canvas: fabric.Canvas): string {
  return JSON.stringify(canvas.toJSON(['id', 'type', 'patientId', 'imageId', 'toolType', 'metadata']))
}

export function deserializeCanvas(
  canvas: fabric.Canvas,
  json: string,
  callback?: () => void
): void {
  canvas.loadFromJSON(json, () => {
    canvas.renderAll()
    if (callback) callback()
  })
} 