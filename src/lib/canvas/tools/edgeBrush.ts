import fabric from 'fabric'

interface EdgeBrushOptions {
  canvas: fabric.Canvas
  color: string
  width: number
  mode: 'draw' | 'erase'
}

/**
 * Edge brush tool for refining edge detection results
 * Allows for drawing or erasing edge lines
 */
export class EdgeBrushTool {
  private canvas: fabric.Canvas
  private color: string
  private width: number
  private mode: 'draw' | 'erase'
  private isDrawing: boolean = false
  private points: Array<{ x: number; y: number }> = []
  private path: fabric.Path | null = null
  private tempPath: fabric.Path | null = null

  constructor(options: EdgeBrushOptions) {
    this.canvas = options.canvas
    this.color = options.color
    this.width = options.width
    this.mode = options.mode
    this.setupEvents()
  }

  private setupEvents() {
    this.canvas.on('mouse:down', this.onMouseDown.bind(this))
    this.canvas.on('mouse:move', this.onMouseMove.bind(this))
    this.canvas.on('mouse:up', this.onMouseUp.bind(this))
  }

  private onMouseDown(event: fabric.IEvent<MouseEvent>) {
    if (!event.pointer) return

    this.isDrawing = true
    this.points = []
    
    const pointer = this.canvas.getPointer(event.e)
    this.points.push({ x: pointer.x, y: pointer.y })

    // Start a new path for drawing mode
    if (this.mode === 'draw') {
      this.path = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
        strokeWidth: this.width,
        stroke: this.color,
        fill: '',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      })
      this.canvas.add(this.path)
    } else if (this.mode === 'erase') {
      // In erase mode, we'll create a temporary visual indicator
      this.tempPath = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
        strokeWidth: this.width,
        stroke: 'rgba(255, 0, 0, 0.5)',
        fill: '',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      })
      this.canvas.add(this.tempPath)
    }
  }

  private onMouseMove(event: fabric.IEvent<MouseEvent>) {
    if (!this.isDrawing || !event.pointer) return

    const pointer = this.canvas.getPointer(event.e)
    this.points.push({ x: pointer.x, y: pointer.y })

    // Update the path
    if (this.mode === 'draw' && this.path) {
      this.path.path.push(['L', pointer.x, pointer.y])
      this.canvas.renderAll()
    } else if (this.mode === 'erase' && this.tempPath) {
      this.tempPath.path.push(['L', pointer.x, pointer.y])
      this.canvas.renderAll()

      // Erase existing paths that intersect with the eraser
      this.eraseIntersectingPaths(pointer)
    }
  }

  private onMouseUp() {
    this.isDrawing = false
    
    if (this.mode === 'erase' && this.tempPath) {
      // Remove the temporary eraser path
      this.canvas.remove(this.tempPath)
      this.tempPath = null
    }
    
    // Reset points array
    this.points = []
    this.canvas.renderAll()
  }

  private eraseIntersectingPaths(pointer: { x: number; y: number }) {
    const objects = this.canvas.getObjects('path')
    
    // Skip if there are no paths to erase or if the current path is the temporary eraser
    if (objects.length === 0) return
    
    objects.forEach((obj) => {
      // Skip the temporary eraser path
      if (obj === this.tempPath) return
      
      // Calculate distance to the path
      const path = obj as fabric.Path
      const pathPoints = path.path || []
      
      for (let i = 1; i < pathPoints.length; i++) {
        const p1 = pathPoints[i - 1]
        const p2 = pathPoints[i]
        
        // Skip if not line segments
        if (p1[0] !== 'L' && p1[0] !== 'M') continue
        
        const x1 = p1[1] as number
        const y1 = p1[2] as number
        const x2 = p2[1] as number
        const y2 = p2[2] as number
        
        // Check if pointer is close to this line segment
        const dist = this.distToSegment(pointer, { x: x1, y: y1 }, { x: x2, y: y2 })
        
        if (dist < this.width / 2) {
          this.canvas.remove(obj)
          break // Once we've erased this object, move on
        }
      }
    })
  }

  private distToSegment(p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) {
    // Calculate distance from point p to line segment vw
    const l2 = this.distSquared(v, w)
    if (l2 === 0) return this.dist(p, v) // v == w case
    
    // Consider the line extending the segment, parameterized as v + t (w - v)
    // We find the projection of p onto the line.
    // It falls where t = [(p-v) . (w-v)] / |w-v|^2
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
    
    // We clamp t to [0,1] to get the projection onto the segment
    t = Math.max(0, Math.min(1, t))
    
    const projection = {
      x: v.x + t * (w.x - v.x),
      y: v.y + t * (w.y - v.y)
    }
    
    return this.dist(p, projection)
  }

  private dist(v: { x: number; y: number }, w: { x: number; y: number }) {
    return Math.sqrt(this.distSquared(v, w))
  }

  private distSquared(v: { x: number; y: number }, w: { x: number; y: number }) {
    return Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2)
  }

  setColor(color: string) {
    this.color = color
  }

  setWidth(width: number) {
    this.width = width
  }

  setMode(mode: 'draw' | 'erase') {
    this.mode = mode
  }

  cleanup() {
    this.canvas.off('mouse:down', this.onMouseDown.bind(this))
    this.canvas.off('mouse:move', this.onMouseMove.bind(this))
    this.canvas.off('mouse:up', this.onMouseUp.bind(this))
  }
} 