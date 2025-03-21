import fabric from 'fabric'

interface EdgeSmoothingOptions {
  canvas: fabric.Canvas
  smoothingFactor: number
}

/**
 * Edge smoothing tool for refining edge detection results
 * Applies smoothing algorithms to selected paths
 */
export class EdgeSmoothingTool {
  private canvas: fabric.Canvas
  private smoothingFactor: number

  constructor(options: EdgeSmoothingOptions) {
    this.canvas = options.canvas
    this.smoothingFactor = options.smoothingFactor
  }

  /**
   * Apply smoothing to a specific path
   */
  smoothPath(path: fabric.Path) {
    if (!path.path) return

    const pathData = path.path
    // Skip if path has too few points
    if (pathData.length < 3) return

    // Get all points from the path
    const points: Array<{ x: number; y: number }> = []
    
    for (let i = 0; i < pathData.length; i++) {
      const command = pathData[i]
      if (command[0] === 'M' || command[0] === 'L') {
        points.push({ x: command[1] as number, y: command[2] as number })
      }
    }

    // Apply smoothing algorithm (moving average)
    const smoothedPoints = this.applyMovingAverage(points, Math.round(this.smoothingFactor))

    // Create a new path string
    let newPathData = []
    
    if (smoothedPoints.length > 0) {
      newPathData.push(['M', smoothedPoints[0].x, smoothedPoints[0].y])
      
      for (let i = 1; i < smoothedPoints.length; i++) {
        newPathData.push(['L', smoothedPoints[i].x, smoothedPoints[i].y])
      }
    }

    // Update the path
    path.set({ path: newPathData })
    this.canvas.renderAll()
  }

  /**
   * Apply smoothing to all paths on the canvas
   */
  smoothAllPaths() {
    const objects = this.canvas.getObjects('path')
    
    objects.forEach((obj) => {
      this.smoothPath(obj as fabric.Path)
    })
  }

  /**
   * Apply moving average smoothing to points
   */
  private applyMovingAverage(points: Array<{ x: number; y: number }>, windowSize: number): Array<{ x: number; y: number }> {
    if (points.length < windowSize) return points
    
    const result: Array<{ x: number; y: number }> = []
    
    // Keep the first point unchanged
    result.push(points[0])
    
    // Apply moving average to middle points
    for (let i = 0; i < points.length; i++) {
      let sumX = 0
      let sumY = 0
      let count = 0
      
      // Calculate the window range
      const start = Math.max(0, i - Math.floor(windowSize / 2))
      const end = Math.min(points.length - 1, i + Math.floor(windowSize / 2))
      
      // Sum the values in the window
      for (let j = start; j <= end; j++) {
        sumX += points[j].x
        sumY += points[j].y
        count++
      }
      
      // Calculate the average
      if (count > 0) {
        result.push({
          x: sumX / count,
          y: sumY / count
        })
      }
    }
    
    // Keep the last point unchanged
    if (points.length > 1 && result.length > 0 && 
        (result[result.length - 1].x !== points[points.length - 1].x || 
         result[result.length - 1].y !== points[points.length - 1].y)) {
      result.push(points[points.length - 1])
    }
    
    return result
  }

  /**
   * Apply Chaikin's algorithm for curve smoothing
   * This creates a smoother curve by cutting corners
   */
  applyChaikinSmoothing(points: Array<{ x: number; y: number }>, iterations: number = 1): Array<{ x: number; y: number }> {
    if (points.length < 2) return points
    
    let result = [...points]
    
    for (let iter = 0; iter < iterations; iter++) {
      const newPoints: Array<{ x: number; y: number }> = []
      
      // Always keep the first point
      newPoints.push(result[0])
      
      // Apply Chaikin's algorithm to each pair of points
      for (let i = 0; i < result.length - 1; i++) {
        const p0 = result[i]
        const p1 = result[i + 1]
        
        // Q point (1/4 of the way from p0 to p1)
        const q = {
          x: p0.x + 0.25 * (p1.x - p0.x),
          y: p0.y + 0.25 * (p1.y - p0.y)
        }
        
        // R point (3/4 of the way from p0 to p1)
        const r = {
          x: p0.x + 0.75 * (p1.x - p0.x),
          y: p0.y + 0.75 * (p1.y - p0.y)
        }
        
        newPoints.push(q, r)
      }
      
      // Always keep the last point
      newPoints.push(result[result.length - 1])
      
      result = newPoints
    }
    
    return result
  }

  setFactor(factor: number) {
    this.smoothingFactor = factor
  }
} 