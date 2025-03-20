'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { getPatient } from '@/lib/patients'
import { getImage } from '@/lib/images'
import type { Patient, Image } from '@/types/database'
import { Slider } from '@/components/ui/Slider'

// OpenCV module type
declare global {
  interface Window {
    cv: any;
    Module: {
      onRuntimeInitialized: () => void;
    };
  }
}

// Match the step enum in the landing page
enum Step {
  SELECT_PATIENT,
  UPLOAD_XRAYS,
  EDGE_DETECTION,
  ANNOTATION
}

export default function EdgeDetectionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalCanvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  
  const patientId = searchParams.get('patient')
  const topViewId = searchParams.get('topView')
  const sideViewId = searchParams.get('sideView')
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [sideViewImage, setSideViewImage] = useState<Image | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [edgeDetectionComplete, setEdgeDetectionComplete] = useState(false)
  const [showSideBySide, setShowSideBySide] = useState(false)
  const [processingEdges, setProcessingEdges] = useState(false)
  const [opencvLoaded, setOpencvLoaded] = useState(false)
  
  // Edge detection parameters (based on Python script)
  const [cannyThresholdLow, setCannyThresholdLow] = useState(50)
  const [cannyThresholdHigh, setCannyThresholdHigh] = useState(165)
  const [dilationSize, setDilationSize] = useState(2)
  const [closingIterations, setClosingIterations] = useState(2)
  
  // Original image data
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null)

  // Manually load OpenCV.js
  useEffect(() => {
    if (window.cv) {
      // OpenCV already loaded
      setOpencvLoaded(true)
      return
    }

    // Function to call when OpenCV is ready
    window.Module = {
      onRuntimeInitialized: () => {
        console.log('OpenCV.js initialized');
        setOpencvLoaded(true);
        if (sideViewImage && imageRef.current?.complete && canvasRef.current) {
          processImageWithOpenCV();
        }
      }
    };

    // Load OpenCV.js script
    const script = document.createElement('script');
    script.src = '/opencv/opencv.js';
    script.async = true;
    script.onerror = () => {
      console.error('Failed to load OpenCV.js');
      setError('Failed to load OpenCV.js. Please refresh the page.');
    };
    document.body.appendChild(script);

    // Cleanup
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Load data
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

  // Set up canvas once image is loaded
  useEffect(() => {
    if (!sideViewImage) return
    
    const img = imageRef.current
    if (!img) return

    const loadImage = () => {
      const canvas = canvasRef.current
      const originalCanvas = originalCanvasRef.current
      if (!canvas || !originalCanvas) return

      // Set canvas dimensions
      canvas.width = img.width
      canvas.height = img.height
      originalCanvas.width = img.width
      originalCanvas.height = img.height

      // Draw the image to both canvases
      const ctx = canvas.getContext('2d')
      const originalCtx = originalCanvas.getContext('2d')
      if (!ctx || !originalCtx) return
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      originalCtx.drawImage(img, 0, 0, originalCanvas.width, originalCanvas.height)
      
      // Store the original image data for reuse
      const imgData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height)
      setOriginalImageData(imgData)
      
      // Apply initial edge detection if OpenCV is loaded
      if (opencvLoaded && window.cv) {
        processImageWithOpenCV()
      }
    }

    if (img.complete) {
      loadImage()
    } else {
      img.onload = loadImage
    }
  }, [sideViewImage, opencvLoaded])

  // Process the image with OpenCV.js
  const processImageWithOpenCV = () => {
    if (!canvasRef.current || !originalCanvasRef.current || !window.cv) return
    
    const canvas = canvasRef.current
    const originalCanvas = originalCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    try {
      // Get the image data from the original canvas
      const imgData = originalCanvas.getContext('2d')?.getImageData(
        0, 0, originalCanvas.width, originalCanvas.height
      )
      
      if (!imgData) return
      
      // Create OpenCV matrices
      const src = window.cv.matFromImageData(imgData)
      const dst = new window.cv.Mat()
      
      // Convert to grayscale
      window.cv.cvtColor(src, src, window.cv.COLOR_RGBA2GRAY)
      
      // Apply dilation to connect gaps before edge detection
      const dilationKernel = window.cv.Mat.ones(dilationSize, dilationSize, window.cv.CV_8U)
      window.cv.dilate(src, src, dilationKernel, new window.cv.Point(-1, -1), 1)
      
      // Apply Canny edge detection with thresholds
      window.cv.Canny(src, dst, cannyThresholdLow, cannyThresholdHigh)
      
      // Apply morphological closing to fill small gaps
      const closingKernel = window.cv.Mat.ones(3, 3, window.cv.CV_8U)
      window.cv.morphologyEx(dst, dst, window.cv.MORPH_CLOSE, closingKernel, new window.cv.Point(-1, -1), closingIterations)
      
      // Find contours
      const contours = new window.cv.MatVector()
      const hierarchy = new window.cv.Mat()
      window.cv.findContours(dst, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE)
      
      // Create a new matrix for the result
      const result = window.cv.Mat.zeros(dst.rows, dst.cols, window.cv.CV_8UC4)
      
      // Find the largest contour
      let maxArea = 0
      let maxContourIndex = -1
      
      for (let i = 0; i < contours.size(); i++) {
        const area = window.cv.contourArea(contours.get(i))
        if (area > maxArea) {
          maxArea = area
          maxContourIndex = i
        }
      }
      
      // Draw edges
      window.cv.cvtColor(dst, result, window.cv.COLOR_GRAY2RGBA)
      
      // Draw largest contour if found
      if (maxContourIndex >= 0) {
        // Draw all contours in white first
        window.cv.drawContours(
          result,
          contours,
          -1, // Draw all contours
          new window.cv.Scalar(255, 255, 255, 255),
          1,
          window.cv.LINE_8,
          hierarchy,
          2
        )
        
        // Draw the largest contour in green
        window.cv.drawContours(
          result,
          contours,
          maxContourIndex,
          new window.cv.Scalar(0, 255, 0, 255),
          2,
          window.cv.LINE_8,
          hierarchy,
          0
        )
      }
      
      // Put the result back to the canvas
      window.cv.imshow(canvas, result)
      
      // Clean up
      src.delete()
      dst.delete()
      dilationKernel.delete()
      closingKernel.delete()
      contours.delete()
      hierarchy.delete()
      result.delete()
      
    } catch (e) {
      console.error('Error processing image with OpenCV:', e)
    }
  }

  // Apply the current parameters and mark as complete
  const handleApplyEdgeDetection = () => {
    if (!window.cv) {
      setError('OpenCV.js is not loaded yet. Please wait.')
      return
    }
    
    setProcessingEdges(true)
    // Use setTimeout to allow the UI to update with the loading state
    setTimeout(() => {
      processImageWithOpenCV()
      setProcessingEdges(false)
      setEdgeDetectionComplete(true)
    }, 100)
  }

  // Continue to annotation page
  const handleContinue = () => {
    router.push(`/annotate?patient=${patientId}&topView=${topViewId}&sideView=${sideViewId}`)
  }

  // Function to reset parameters to defaults
  const resetParameters = () => {
    setCannyThresholdLow(50)
    setCannyThresholdHigh(165)
    setDilationSize(2)
    setClosingIterations(2)
    setEdgeDetectionComplete(false)
    
    if (window.cv) {
      processImageWithOpenCV()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading image for edge detection...</p>
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
          Back to Upload
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
          
          {/* Step 3: Edge Detection (current step) */}
          <div className={`flex items-center text-blue-600`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white mr-2`}>
              3
            </div>
            <span className="font-medium">Edge Detection</span>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-0.5 mx-4 bg-gray-200`}></div>
          
          {/* Step 4: Annotation */}
          <div className={`flex items-center text-gray-400`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 mr-2`}>
              4
            </div>
            <span className="font-medium">Annotation</span>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">
          Edge Detection for {patient.name}
        </h1>
        <p className="text-gray-600 mb-4">
          Adjust the parameters to detect the edges in the side view X-ray
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Edge Detection Parameters</h3>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">Adjust parameters to improve edge detection</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetParameters}
                >
                  Reset to Defaults
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Canny Low Threshold */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="lowThreshold" className="block text-sm font-medium text-gray-700">
                      Canny Low Threshold: {cannyThresholdLow}
                    </label>
                  </div>
                  <Slider
                    id="lowThreshold"
                    min={10}
                    max={200}
                    step={5}
                    value={[cannyThresholdLow]}
                    onValueChange={(value) => setCannyThresholdLow(value[0])}
                  />
                  <p className="text-xs text-gray-500">
                    Lower values detect more edges. Increase to reduce noise.
                  </p>
                </div>
                
                {/* Canny High Threshold */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="highThreshold" className="block text-sm font-medium text-gray-700">
                      Canny High Threshold: {cannyThresholdHigh}
                    </label>
                  </div>
                  <Slider
                    id="highThreshold"
                    min={100}
                    max={300}
                    step={5}
                    value={[cannyThresholdHigh]}
                    onValueChange={(value) => setCannyThresholdHigh(value[0])}
                  />
                  <p className="text-xs text-gray-500">
                    Higher values create stronger, more defined edges.
                  </p>
                </div>
                
                {/* Dilation Size */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="dilationSize" className="block text-sm font-medium text-gray-700">
                      Dilation Size: {dilationSize}
                    </label>
                  </div>
                  <Slider
                    id="dilationSize"
                    min={1}
                    max={5}
                    step={1}
                    value={[dilationSize]}
                    onValueChange={(value) => setDilationSize(value[0])}
                  />
                  <p className="text-xs text-gray-500">
                    Expands edges and fills small gaps. Higher values connect more edges.
                  </p>
                </div>
                
                {/* Closing Iterations */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="closingIterations" className="block text-sm font-medium text-gray-700">
                      Closing Iterations: {closingIterations}
                    </label>
                  </div>
                  <Slider
                    id="closingIterations"
                    min={1}
                    max={5}
                    step={1}
                    value={[closingIterations]}
                    onValueChange={(value) => setClosingIterations(value[0])}
                  />
                  <p className="text-xs text-gray-500">
                    Number of times to apply closing operation. Helps fill gaps in contours.
                  </p>
                </div>
                
                <div className="pt-4 space-y-3">
                  <Button 
                    onClick={handleApplyEdgeDetection}
                    className="w-full"
                    disabled={processingEdges || !opencvLoaded}
                  >
                    {processingEdges ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                        Processing...
                      </>
                    ) : !opencvLoaded ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></span>
                        Loading OpenCV...
                      </>
                    ) : (
                      'Apply Edge Detection'
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleContinue}
                    disabled={!edgeDetectionComplete}
                    className="w-full"
                    variant={edgeDetectionComplete ? "default" : "outline"}
                  >
                    Continue to Annotation
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card className="p-4">
              <div className="flex justify-end mb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSideBySide(!showSideBySide)}
                >
                  {showSideBySide ? 'Show Only Result' : 'Show Side by Side'}
                </Button>
              </div>
              
              <div className={`relative ${showSideBySide ? 'grid grid-cols-2 gap-4' : ''}`}>
                {showSideBySide && (
                  <div className="relative">
                    <img
                      src={sideViewImage.url}
                      alt="Original Side view X-ray"
                      className="max-w-full h-auto mx-auto border border-gray-200"
                    />
                    <div className="absolute top-4 left-4 bg-white/80 px-3 py-1 rounded-md text-sm">
                      Original Image
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={sideViewImage.url}
                    alt="Side view X-ray"
                    className="hidden"
                  />
                  <canvas 
                    ref={canvasRef} 
                    className="max-w-full h-auto mx-auto border border-gray-200"
                  />
                  <canvas
                    ref={originalCanvasRef}
                    className="hidden"
                  />
                  <div className="absolute top-4 left-4 bg-white/80 px-3 py-1 rounded-md text-sm">
                    {showSideBySide ? 'Edge Detection' : 'Side View X-ray - Edge Detection'}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-500">
                <p>The edge detection algorithm is detecting the contours of the foot.</p>
                <p>Adjust parameters and click "Apply Edge Detection" to update the image.</p>
                <p className="mt-2 text-xs italic">
                  Using OpenCV.js for professional-quality edge detection, similar to the Python implementation.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 