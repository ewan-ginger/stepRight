'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getImageAnnotations, createAnnotation } from '@/lib/annotations'
import type { Annotation, AnnotationData } from '@/types/database'

interface CanvasComponentProps {
  imageUrl: string
  patientId: string
  imageId: string
}

type AnnotationTool = 'line' | 'ellipse' | 'point' | 'angle' | 'select' | 'none'

export default function CanvasComponent({ imageUrl, patientId, imageId }: CanvasComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [selectedTool, setSelectedTool] = useState<AnnotationTool>('none')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load annotations on mount
  useEffect(() => {
    const loadAnnotations = async () => {
      try {
        setLoading(true)
        const data = await getImageAnnotations(imageId)
        setAnnotations(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load annotations')
      } finally {
        setLoading(false)
    }
    }

    loadAnnotations()
  }, [imageId])

  // Initialize canvas when image loads
  useEffect(() => {
    const img = imageRef.current
    if (!img) return

    const handleImageLoad = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      // Set canvas dimensions to match the image
      canvas.width = img.width
      canvas.height = img.height

      // Draw the image on the canvas
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // Draw existing annotations
      drawAnnotations(ctx)
    }

    img.addEventListener('load', handleImageLoad)
    
    return () => {
      img.removeEventListener('load', handleImageLoad)
    }
  }, [annotations])

  // Draw all annotations on the canvas
  const drawAnnotations = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    
    // Redraw the image
    const img = imageRef.current
    if (img) {
      ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height)
    }
    
    // Draw each annotation
    annotations.forEach(annotation => {
      switch (annotation.type) {
        case 'line':
          drawLine(ctx, annotation.data as any)
          break
        case 'ellipse':
          drawEllipse(ctx, annotation.data as any)
          break
        case 'point':
          drawPoint(ctx, annotation.data as any)
          break
        case 'angle':
          drawAngle(ctx, annotation.data as any)
          break
      }
    })
    }

  // Drawing functions for each annotation type
  const drawLine = (ctx: CanvasRenderingContext2D, data: any) => {
    ctx.beginPath()
    ctx.moveTo(data.x1, data.y1)
    ctx.lineTo(data.x2, data.y2)
    ctx.strokeStyle = data.color || '#FF0000'
    ctx.lineWidth = data.width || 2
    ctx.stroke()
  }

  const drawEllipse = (ctx: CanvasRenderingContext2D, data: any) => {
    ctx.beginPath()
    ctx.ellipse(data.cx, data.cy, data.rx, data.ry, 0, 0, 2 * Math.PI)
    ctx.strokeStyle = data.color || '#00FF00'
    ctx.lineWidth = data.width || 2
    ctx.stroke()
    }

  const drawPoint = (ctx: CanvasRenderingContext2D, data: any) => {
    ctx.beginPath()
    ctx.arc(data.x, data.y, data.radius || 5, 0, 2 * Math.PI)
    ctx.fillStyle = data.color || '#0000FF'
    ctx.fill()
  }

  const drawAngle = (ctx: CanvasRenderingContext2D, data: any) => {
    // Draw first line
    ctx.beginPath()
    ctx.moveTo(data.x2, data.y2)
    ctx.lineTo(data.x1, data.y1)
    ctx.strokeStyle = data.color || '#FF00FF'
    ctx.lineWidth = data.width || 2
    ctx.stroke()
    
    // Draw second line
    ctx.beginPath()
    ctx.moveTo(data.x2, data.y2)
    ctx.lineTo(data.x3, data.y3)
    ctx.stroke()
  }

  // Handle mouse events for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'none' || selectedTool === 'select') return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setStartPoint({ x, y })
    setIsDrawing(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Clear canvas and redraw everything
    drawAnnotations(ctx)
    
    // Draw the current shape
    switch (selectedTool) {
      case 'line':
        drawLine(ctx, {
          x1: startPoint.x,
          y1: startPoint.y,
          x2: x,
          y2: y,
          color: '#FF0000',
          width: 2
        })
        break
      case 'ellipse':
        const rx = Math.abs(x - startPoint.x)
        const ry = Math.abs(y - startPoint.y)
        drawEllipse(ctx, {
          cx: startPoint.x,
          cy: startPoint.y,
          rx,
          ry,
          color: '#00FF00',
          width: 2
        })
        break
      case 'angle':
        // For angle, we just draw a line while moving
        drawLine(ctx, {
          x1: startPoint.x,
          y1: startPoint.y,
          x2: x,
          y2: y,
          color: '#FF00FF',
          width: 2
        })
        break
    }
  }

  const handleMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    let newAnnotation: Partial<Annotation> | null = null
    
    // Create the annotation data based on tool
    switch (selectedTool) {
      case 'line':
        newAnnotation = {
          imageId,
          patientId,
          type: 'line',
          data: {
            x1: startPoint.x,
            y1: startPoint.y,
            x2: x,
            y2: y,
            color: '#FF0000',
            width: 2
          }
        }
        break
      case 'ellipse':
        const rx = Math.abs(x - startPoint.x)
        const ry = Math.abs(y - startPoint.y)
        newAnnotation = {
          imageId,
          patientId,
          type: 'ellipse',
          data: {
            cx: startPoint.x,
            cy: startPoint.y,
            rx,
            ry,
            color: '#00FF00',
            width: 2
          }
        }
        break
      case 'point':
        newAnnotation = {
          imageId,
          patientId,
          type: 'point',
          data: {
            x,
            y,
            radius: 5,
            color: '#0000FF'
          }
        }
        break
      case 'angle':
        // For now, we don't create the full angle on mouse up
        // In a real app, you would need to handle the third point separately
        newAnnotation = {
          imageId,
          patientId,
          type: 'angle',
          data: {
            x1: startPoint.x,
            y1: startPoint.y,
            x2: x,
            y2: y,
            x3: x + 50, // Default third point for demo
            y3: y + 50,
            color: '#FF00FF',
            width: 2
          }
        }
        break
    }
    
    // Save the annotation
    if (newAnnotation) {
      try {
        const savedAnnotation = await createAnnotation(newAnnotation as Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>)
        setAnnotations(prev => [...prev, savedAnnotation])
      } catch (err) {
        console.error('Failed to save annotation:', err)
      }
    }
    
    setIsDrawing(false)
    setStartPoint(null)
  }

  const handleMouseLeave = () => {
    if (isDrawing) {
      setIsDrawing(false)
      setStartPoint(null)
      
      // Redraw to clear any temporary shapes
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      drawAnnotations(ctx)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex mb-4 space-x-2">
        <Button 
          onClick={() => setSelectedTool('select')}
          variant={selectedTool === 'select' ? 'default' : 'outline'}
        >
          Select
        </Button>
        <Button 
          onClick={() => setSelectedTool('line')}
          variant={selectedTool === 'line' ? 'default' : 'outline'}
        >
          Line
        </Button>
        <Button 
          onClick={() => setSelectedTool('ellipse')}
          variant={selectedTool === 'ellipse' ? 'default' : 'outline'}
        >
          Ellipse
        </Button>
        <Button 
          onClick={() => setSelectedTool('point')}
          variant={selectedTool === 'point' ? 'default' : 'outline'}
        >
          Point
        </Button>
        <Button 
          onClick={() => setSelectedTool('angle')}
          variant={selectedTool === 'angle' ? 'default' : 'outline'}
        >
          Angle
        </Button>
      </div>
      
      <Card className="relative">
        <img 
          ref={imageRef}
          src={imageUrl} 
          alt="X-ray" 
          className="invisible absolute" // Hide the image, we'll draw it on the canvas
        />
        <canvas
          ref={canvasRef}
          className="border border-gray-300"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </Card>
      
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading annotations...</p>
          </div>
        )}
      
      {error && (
        <div className="text-center py-4">
          <p className="text-red-500">{error}</p>
      </div>
      )}
    </div>
  )
} 