'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { getPatient } from '@/lib/patients'
import { getImage } from '@/lib/images'
import type { Patient, Image } from '@/types/database'
import { EdgeRefinementControls } from '@/components/processing/EdgeRefinementControls'
import { Script } from 'next/script'

// Match the step enum in the landing page
enum Step {
  SELECT_PATIENT,
  UPLOAD_XRAYS,
  EDGE_DETECTION,
  EDGE_REFINEMENT,
  ANNOTATION
}

// Make sure fabric is only loaded in browser
let fabric: typeof import('fabric').default | null = null;
if (typeof window !== 'undefined') {
  import('fabric').then(module => {
    fabric = module.default;
  });
}

export default function EdgeRefinementPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const patientId = searchParams.get('patient')
  const topViewId = searchParams.get('topView')
  const sideViewId = searchParams.get('sideView')
  
  // Log query parameters for debugging
  console.log('Edge Refinement query params:', { patientId, topViewId, sideViewId });
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<any | null>(null)
  const fabricReadyRef = useRef<boolean>(false)
  const [canvasLoaded, setCanvasLoaded] = useState(false)
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [sideViewImage, setSideViewImage] = useState<Image | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Edge refinement tools
  const [edgeBrush, setEdgeBrush] = useState<any | null>(null)
  const [edgeSmoothingTool, setEdgeSmoothingTool] = useState<any | null>(null)
  
  // Canvas setup and tool initialization
  useEffect(() => {
    // Make sure we're in a browser environment
    if (typeof window === 'undefined') {
      console.error('Cannot initialize fabric.js - not in browser environment');
      return;
    }
    
    if (!fabric) {
      console.log('Fabric.js not loaded yet, waiting...');
      return;
    }

    if (!canvasRef.current) {
      console.log('Canvas ref not ready yet');
      return;
    }
    
    console.log('Setting up fabric canvas...');
    
    const setupCanvas = async () => {
      try {
        // Initialize Fabric.js canvas
        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
          selection: false,
          preserveObjectStacking: true
        })
        
        console.log('Fabric canvas initialized successfully');
        
        // Store canvas reference
        fabricCanvasRef.current = fabricCanvas
        fabricReadyRef.current = true
        setCanvasLoaded(true)
        
        // Initialize edge refinement tools
        const EdgeBrushTool = (await import('@/lib/canvas/tools/edgeBrush')).EdgeBrushTool;
        const EdgeSmoothingTool = (await import('@/lib/canvas/tools/edgeSmoothing')).EdgeSmoothingTool;
        
        const brush = new EdgeBrushTool({
          canvas: fabricCanvas,
          color: '#00FF00',
          width: 5,
          mode: 'draw'
        })
        
        const smoother = new EdgeSmoothingTool({
          canvas: fabricCanvas,
          smoothingFactor: 3
        })
        
        setEdgeBrush(brush)
        setEdgeSmoothingTool(smoother)
        
        return () => {
          if (brush) brush.cleanup()
          fabricCanvas.dispose()
        }
      } catch (e) {
        console.error('Error setting up fabric.js canvas:', e);
      }
    }
    
    setupCanvas()
  }, [fabric])
  
  // Load patient and image data
  useEffect(() => {
    const fetchData = async () => {
      if (!patientId || !sideViewId) {
        setError('Missing required parameters')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Load patient and image data
        const [patientData, image] = await Promise.all([
          getPatient(patientId),
          getImage(sideViewId)
        ])
        
        if (!patientData) {
          setError('Patient not found')
          return
        }
        
        if (!image) {
          setError('Side view image not found')
          return
        }
        
        console.log('Loaded side view image:', image);
        
        // Verify this is actually a side view image
        if (image.viewType !== 'side') {
          console.error(`Error: Expected a side view image but got ${image.viewType}. Check the URL parameters.`);
          setError(`The image provided for side view is actually a ${image.viewType} view. Please go back and try again.`);
          return;
        }
        
        setPatient(patientData)
        setSideViewImage(image)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [patientId, sideViewId])

  // Handle loading the detected edges and image
  useEffect(() => {
    if (!sideViewImage) {
      console.log('Cannot load contours - missing side view image');
      return;
    }

    if (!fabricReadyRef.current || !fabricCanvasRef.current) {
      console.log('Canvas not ready yet, waiting for fabric initialization');
      return;
    }
    
    console.log('Edge refinement: Loading image with details:', {
      id: sideViewImage.id,
      viewType: sideViewImage.viewType,
      url: sideViewImage.url
    });
    
    try {
      console.log('Loading image into fabric canvas...');
      
      // Load the X-ray image
      fabric.Image.fromURL(sideViewImage.url, (img) => {
        console.log('Image loaded successfully into fabric');
        
        if (!fabricCanvasRef.current) {
          console.log('Canvas reference lost after image loaded');
          return;
        }
        
        // Set canvas dimensions to match image
        fabricCanvasRef.current.setWidth(img.width ?? 800)
        fabricCanvasRef.current.setHeight(img.height ?? 600)
        
        // Add image as background
        img.set({
          selectable: false,
          evented: false,
          left: 0,
          top: 0,
          opacity: 0.7 // Semi-transparent to see edges better
        })
        
        fabricCanvasRef.current.add(img)
        fabricCanvasRef.current.sendToBack(img)
        
        // Try to load edge data from storage
        try {
          // Try to get data from sessionStorage first
          let edgeData = sessionStorage.getItem(`edge-detection-${sideViewId}`);
          
          // If not found, try localStorage as backup
          if (!edgeData) {
            edgeData = localStorage.getItem(`edge-detection-${sideViewId}`);
            if (edgeData) {
              console.log(`Found edge data in localStorage for image ID ${sideViewId}`);
            }
          } else {
            console.log(`Found edge data in sessionStorage for image ID ${sideViewId}`);
          }
          
          console.log(`Edge data for image ID ${sideViewId}:`, 
            edgeData ? `Found data with ${JSON.parse(edgeData).length} points` : 'No data found');
          
          if (edgeData) {
            // Parse the edge data (assuming it's a list of points)
            const points = JSON.parse(edgeData)
            
            if (points && points.length > 0) {
              // Create a path from the points
              let pathData = `M ${points[0].x} ${points[0].y}`
              for (let i = 1; i < points.length; i++) {
                pathData += ` L ${points[i].x} ${points[i].y}`
              }
              
              console.log(`Creating path with ${points.length} points`)
              
              const edgePath = new fabric.Path(pathData, {
                stroke: '#00FF00',
                strokeWidth: 3,
                fill: '',
                selectable: false,
                evented: false
              })
              
              fabricCanvasRef.current.add(edgePath)
              fabricCanvasRef.current.renderAll()
              console.log('Added edge path to canvas');
            } else {
              console.log('Points array was empty or invalid, using placeholder')
              createPlaceholderContour()
            }
          } else {
            console.log('No edge data found in storage, using placeholder')
            createPlaceholderContour()
          }
        } catch (e) {
          console.error('Error loading edge data:', e)
          createPlaceholderContour()
        }
      }, { crossOrigin: 'Anonymous' })
    } catch (e) {
      console.error('Error loading image:', e)
      createPlaceholderContour()
    }
    
    // Helper to create a placeholder contour if we don't have edge data
    function createPlaceholderContour() {
      if (!fabricCanvasRef.current) return
      
      const placeholderEdge = new fabric.Path(
        'M 100 200 L 150 150 L 200 180 L 250 150 L 300 200 L 350 150 L 400 200 L 450 250 L 500 300 L 450 350 L 400 380 L 350 400 L 300 380 L 250 350 L 200 320 L 150 280 L 100 200', 
        {
          stroke: '#00FF00',
          strokeWidth: 3,
          fill: '',
          selectable: false,
          evented: false
        }
      )
      
      fabricCanvasRef.current.add(placeholderEdge)
      fabricCanvasRef.current.renderAll()
      console.log('Added placeholder contour');
    }
  }, [sideViewImage, canvasLoaded])

  // Handle completion of edge refinement
  const handleComplete = () => {
    // Save the refined edges if the canvas is available
    if (fabricCanvasRef.current && sideViewId) {
      try {
        // Get all path objects
        const paths = fabricCanvasRef.current.getObjects('path');
        
        if (paths.length > 0) {
          // Convert paths to point data
          const pointsData = [];
          
          for (const path of paths) {
            if (path.path) {
              for (let i = 0; i < path.path.length; i++) {
                const command = path.path[i];
                if (command[0] === 'M' || command[0] === 'L') {
                  pointsData.push({
                    x: command[1],
                    y: command[2]
                  });
                }
              }
            }
          }
          
          if (pointsData.length > 0) {
            console.log(`Saving ${pointsData.length} refined contour points`);
            
            // Save to both storage mechanisms
            const data = JSON.stringify(pointsData);
            sessionStorage.setItem(`edge-refinement-${sideViewId}`, data);
            localStorage.setItem(`edge-refinement-${sideViewId}`, data);
            
            console.log('Saved refined contour data to storage');
          }
        }
      } catch (e) {
        console.error('Error saving refined contour data:', e);
      }
    }
    
    // Navigate to annotation page
    router.push(`/annotate?patient=${patientId}&topView=${topViewId}&sideView=${sideViewId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading image for edge refinement...</p>
        </div>
      </div>
    )
  }

  if (error || !patient || !sideViewImage) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700 mb-6">{error || 'Could not load image data'}</p>
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => router.back()} 
          className="text-blue-500 hover:underline flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Edge Detection
        </button>
      </div>
      
      {/* Patient information card */}
      <Card className="p-4 mb-4 bg-blue-50 border border-blue-100">
        <div className="flex items-center">
          <div>
            <h3 className="font-semibold text-blue-800">Patient</h3>
            <p className="text-blue-600">{patient.name}, {patient.medicalRecordNumber || 'No MRN'}</p>
          </div>
        </div>
      </Card>
      
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {/* Step 1: Select Patient */}
          <div className={`flex items-center text-blue-600`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2`}>
              1
            </div>
            <span className="font-medium">Select Patient</span>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-0.5 mx-4 bg-blue-600`}></div>
          
          {/* Step 2: Upload X-rays */}
          <div className={`flex items-center text-blue-600`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2`}>
              2
            </div>
            <span className="font-medium">Upload X-rays</span>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-0.5 mx-4 bg-blue-600`}></div>
          
          {/* Step 3: Edge Detection */}
          <div className={`flex items-center text-blue-600`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2`}>
              3
            </div>
            <span className="font-medium">Edge Detection</span>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-0.5 mx-4 bg-blue-600`}></div>
          
          {/* Step 4: Edge Refinement (current step) */}
          <div className={`flex items-center text-blue-600`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white mr-2`}>
              4
            </div>
            <span className="font-medium">Edge Refinement</span>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-0.5 mx-4 bg-gray-200`}></div>
          
          {/* Step 5: Annotation */}
          <div className={`flex items-center text-gray-400`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 mr-2`}>
              5
            </div>
            <span className="font-medium">Annotation</span>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">
          Edge Refinement for {patient.name}
        </h1>
        <p className="text-gray-600 mb-4">
          Use the tools to refine and smooth the detected edges in the side view X-ray
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="h-full">
              <EdgeRefinementControls 
                edgeBrush={edgeBrush}
                edgeSmoothingTool={edgeSmoothingTool}
                onComplete={handleComplete}
              />
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card className="p-4">
              <div className="relative">
                <canvas 
                  ref={canvasRef} 
                  className="border border-gray-200 mx-auto"
                  width="800"
                  height="600"
                />
                <div className="absolute top-4 left-4 bg-white/80 px-3 py-1 rounded-md text-sm">
                  Edge Refinement
                </div>
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-500">
                <p>Use the tools on the left to refine the detected edges.</p>
                <p>Draw to add edges, erase to remove them, and apply smoothing for cleaner contours.</p>
                <p className="mt-2 text-xs italic">
                  The refined contours will be used for measurements and analysis.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 