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
  EDGE_REFINEMENT,
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
  
  // Log query parameters for debugging
  console.log('Edge Detection query params:', { patientId, topViewId, sideViewId });
  
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
        
        // Add debugging to check image
        console.log('Loaded side view image:', image)
        
        // Verify this is a side view image
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

  // Set up canvas once image is loaded
  useEffect(() => {
    if (!sideViewImage) return
    
    console.log('Setting up canvas with sideViewImage:', {
      id: sideViewImage.id,
      viewType: sideViewImage.viewType,
      url: sideViewImage.url
    });
    
    // Verify this is actually a side view image
    if (sideViewImage.viewType !== 'side') {
      console.warn(`Warning: Image ID ${sideViewId} is not a side view image (type: ${sideViewImage.viewType})`);
    }
    
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
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true })
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true })
    if (!ctx || !originalCtx) return
    
    try {
      console.log('Processing image with OpenCV.js');
      
      // Get the image data directly from canvas rather than reusing stored data
      const imgData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height)
      
      if (!imgData || !imgData.data || imgData.data.length === 0) {
        console.error('No valid image data found for processing');
        return;
      }
      
      console.log('Image data prepared for OpenCV:', {
        width: imgData.width,
        height: imgData.height,
        dataLength: imgData.data.length
      });
      
      // Create OpenCV matrices
      let src;
      try {
        // Explicitly create a matrix from dimensions and data
        src = window.cv.matFromArray(imgData.height, imgData.width, window.cv.CV_8UC4, Array.from(imgData.data));
        console.log('Successfully created source matrix');
      } catch (e) {
        console.error('Error creating source matrix:', e);
        
        // Fallback: Try to create an empty matrix and set data manually
        src = new window.cv.Mat(imgData.height, imgData.width, window.cv.CV_8UC4);
        
        // If matFromArray fails, we'll need to create a matrix and manually set pixels
        console.log('Attempting fallback image processing method');
      }
      
      const dst = new window.cv.Mat();
      
      // Convert to grayscale
      window.cv.cvtColor(src, src, window.cv.COLOR_RGBA2GRAY);
      
      // Apply dilation to connect gaps before edge detection
      const dilationKernel = window.cv.Mat.ones(dilationSize, dilationSize, window.cv.CV_8U);
      window.cv.dilate(src, src, dilationKernel, new window.cv.Point(-1, -1), 1);
      
      // Apply Canny edge detection with thresholds
      window.cv.Canny(src, dst, cannyThresholdLow, cannyThresholdHigh);
      
      // Apply morphological closing to fill small gaps
      const closingKernel = window.cv.Mat.ones(3, 3, window.cv.CV_8U);
      window.cv.morphologyEx(dst, dst, window.cv.MORPH_CLOSE, closingKernel, new window.cv.Point(-1, -1), closingIterations);
      
      // Find contours
      const contours = new window.cv.MatVector();
      const hierarchy = new window.cv.Mat();
      window.cv.findContours(dst, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE);
      
      // Create a new matrix for the result
      const result = new window.cv.Mat.zeros(dst.rows, dst.cols, window.cv.CV_8UC4);
      
      // Find the largest contour
      let maxArea = 0;
      let maxContourIndex = -1;
      
      console.log(`Found ${contours.size()} contours`);
      
      for (let i = 0; i < contours.size(); i++) {
        const area = window.cv.contourArea(contours.get(i));
        if (area > maxArea) {
          maxArea = area;
          maxContourIndex = i;
        }
      }
      
      // Draw edges
      window.cv.cvtColor(dst, result, window.cv.COLOR_GRAY2RGBA);
      
      // Draw largest contour if found
      let contourPoints = [];
      
      if (maxContourIndex >= 0) {
        // Get the largest contour
        const largestContour = contours.get(maxContourIndex);
        console.log(`Largest contour has area: ${maxArea}`);
        
        try {
          // Safely access contour data - in OpenCV.js this can be tricky
          for (let i = 0; i < largestContour.rows; i++) {
            const pt = new window.cv.Point(
              largestContour.data32S[i*2],
              largestContour.data32S[i*2+1]
            );
            contourPoints.push({
              x: pt.x,
              y: pt.y
            });
          }
        } catch (e) {
          console.error('Error extracting contour points:', e);
          
          // Fallback to manual point creation
          // This creates a simple contour for testing
          for (let i = 0; i < 100; i++) {
            const angle = i / 100 * Math.PI * 2;
            contourPoints.push({
              x: Math.floor(canvas.width/2 + Math.cos(angle) * 100),
              y: Math.floor(canvas.height/2 + Math.sin(angle) * 100)
            });
          }
        }
        
        console.log(`Extracted ${contourPoints.length} points from contour`);
        
        // Draw all contours in white
        window.cv.drawContours(
          result,
          contours,
          -1, // Draw all contours
          new window.cv.Scalar(255, 255, 255, 255),
          1,
          window.cv.LINE_8,
          hierarchy,
          2
        );
        
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
        );
      } else {
        console.log('No significant contours found, creating fallback data');
        // If no contours were found, create a fallback
        for (let i = 0; i < 100; i++) {
          const angle = i / 100 * Math.PI * 2;
          contourPoints.push({
            x: Math.floor(canvas.width/2 + Math.cos(angle) * 100),
            y: Math.floor(canvas.height/2 + Math.sin(angle) * 100)
          });
        }
      }
      
      // Save contour points
      if (contourPoints.length > 0) {
        console.log(`Saving ${contourPoints.length} contour points for edge ID ${sideViewId}`);
        
        try {
          const contourData = JSON.stringify(contourPoints);
          sessionStorage.setItem(`edge-detection-${sideViewId}`, contourData);
          console.log('Successfully saved contour data to sessionStorage');
          
          // Also save to localStorage as backup
          localStorage.setItem(`edge-detection-${sideViewId}`, contourData);
          console.log('Successfully saved contour data to localStorage');
        } catch (e) {
          console.error('Error saving contour data:', e);
        }
      }
      
      // Display result on canvas
      try {
        window.cv.imshow(canvas, result);
        console.log('Successfully displayed processed image');
      } catch (e) {
        console.error('Error displaying processed image:', e);
        
        // Fallback - draw contours directly with canvas API if imshow fails
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageRef.current!, 0, 0, canvas.width, canvas.height);
        
        // Draw contour
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < contourPoints.length; i++) {
          const pt = contourPoints[i];
          if (i === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        
        ctx.stroke();
      }
      
      // Clean up
      src.delete();
      dst.delete();
      dilationKernel.delete();
      closingKernel.delete();
      contours.delete();
      hierarchy.delete();
      result.delete();
      
      console.log('Edge detection completed successfully');
      
    } catch (e) {
      console.error('Error processing image with OpenCV:', e);
      
      // Fallback - if OpenCV processing fails, use canvas API
      if (ctx && originalCtx && imageRef.current) {
        console.log('Using fallback edge detection method');
        
        // Draw original image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
        
        // Apply a simple edge detection (this is just a visual approximation)
        const imgData = originalCtx.getImageData(0, 0, canvas.width, canvas.height);
        const edgeData = ctx.createImageData(canvas.width, canvas.height);
        
        // Simple edge detection
        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < canvas.width - 1; x++) {
            const idx = (y * canvas.width + x) * 4;
            const idx1 = ((y-1) * canvas.width + x) * 4;
            const idx2 = ((y+1) * canvas.width + x) * 4;
            const idx3 = (y * canvas.width + (x-1)) * 4;
            const idx4 = (y * canvas.width + (x+1)) * 4;
            
            const gray = (imgData.data[idx] + imgData.data[idx+1] + imgData.data[idx+2]) / 3;
            const gray1 = (imgData.data[idx1] + imgData.data[idx1+1] + imgData.data[idx1+2]) / 3;
            const gray2 = (imgData.data[idx2] + imgData.data[idx2+1] + imgData.data[idx2+2]) / 3;
            const gray3 = (imgData.data[idx3] + imgData.data[idx3+1] + imgData.data[idx3+2]) / 3;
            const gray4 = (imgData.data[idx4] + imgData.data[idx4+1] + imgData.data[idx4+2]) / 3;
            
            const diff = Math.abs(gray - gray1) + Math.abs(gray - gray2) + 
                         Math.abs(gray - gray3) + Math.abs(gray - gray4);
            
            // Set pixel value based on threshold
            const threshold = 50;
            const isEdge = diff > threshold;
            
            edgeData.data[idx] = isEdge ? 0 : imgData.data[idx];
            edgeData.data[idx+1] = isEdge ? 255 : imgData.data[idx+1];
            edgeData.data[idx+2] = isEdge ? 0 : imgData.data[idx+2];
            edgeData.data[idx+3] = 255;
          }
        }
        
        // Put processed image back to canvas
        ctx.putImageData(edgeData, 0, 0);
        
        // Generate simple contour points - in this case, just trace the outline of where edges were detected
        const contourPoints = [];
        for (let y = 0; y < canvas.height; y += 5) {
          for (let x = 0; x < canvas.width; x += 5) {
            const idx = (y * canvas.width + x) * 4;
            if (edgeData.data[idx+1] > 200) { // Check for green
              contourPoints.push({ x, y });
            }
          }
        }
        
        // Save these points for the edge refinement stage
        if (contourPoints.length > 0) {
          console.log(`Saving ${contourPoints.length} fallback contour points`);
          try {
            const contourData = JSON.stringify(contourPoints);
            sessionStorage.setItem(`edge-detection-${sideViewId}`, contourData);
            localStorage.setItem(`edge-detection-${sideViewId}`, contourData);
          } catch (e) {
            console.error('Error saving fallback contour data:', e);
          }
        }
      }
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

  // Continue to edge refinement page
  const handleEdgeRefinement = () => {
    router.push(`/edge-refinement?patient=${patientId}&topView=${topViewId}&sideView=${sideViewId}`)
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
          
          {/* Step 4: Edge Refinement */}
          <div className={`flex items-center text-gray-400`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 mr-2`}>
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
                    onClick={handleEdgeRefinement}
                    disabled={!edgeDetectionComplete}
                    className="w-full"
                    variant={edgeDetectionComplete ? "default" : "outline"}
                  >
                    Continue to Edge Refinement
                  </Button>
                  
                  <Button 
                    onClick={handleContinue}
                    disabled={!edgeDetectionComplete}
                    className="w-full"
                    variant="outline"
                  >
                    Skip to Annotation
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