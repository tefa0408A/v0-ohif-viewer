"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Link,
  Camera,
  RotateCcw,
  RotateCw,
  Move,
  Square,
  Settings,
  User,
  ZoomIn,
  ZoomOut,
  Ruler,
  Circle,
  MousePointer,
  FlipHorizontal,
  FlipVertical,
  Maximize,
  Grid3X3,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  Eye,
  EyeOff,
  Crosshair,
  Triangle,
  MoreHorizontal,
} from "lucide-react"

interface Study {
  id: string
  patientName: string
  mrn: string
  studyDate: string
  studyTime: string
  description: string
  modality: string
  accessionNumber: string
  instances: number
}

interface OHIFViewerProps {
  study: Study
  onBack: () => void
}

const dicomSeries = Array.from({ length: 120 }, (_, index) => ({
  id: index + 1,
  url: `/ct-scan-brain-axial-view-medical-imaging-dicom-gra.png`, // Usando imagen de cerebro para toda la serie
  description: `T2 TSE TRA - Slice ${index + 1}`,
  windowLevel: 35 + (index % 10) - 5, // Variación ligera en window level
  windowWidth: 80 + (index % 20) - 10, // Variación ligera en window width
  sliceThickness: 3.0,
  pixelSpacing: 0.488,
  seriesNumber: 1,
  instanceNumber: index + 1,
  sliceLocation: -60 + index * 1.0, // Posición del slice en mm
  acquisitionTime: `14:32:${String(Math.floor(index / 2)).padStart(2, "0")}.${String((index % 2) * 500).padStart(3, "0")}`,
  echoTime: 90,
  repetitionTime: 4000,
  flipAngle: 150,
}))

interface Measurement {
  id: string
  type: "length" | "angle" | "circle" | "rectangle"
  points: { x: number; y: number }[]
  value?: number
  unit?: string
}

interface Annotation {
  id: string
  x: number
  y: number
  text: string
}

export function OHIFViewer({ study, onBack }: OHIFViewerProps) {
  const [showTutorial, setShowTutorial] = useState(true)
  const [currentSliceIndex, setCurrentSliceIndex] = useState(60)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [activeTool, setActiveTool] = useState("pointer")
  const [windowLevel, setWindowLevel] = useState(35)
  const [windowWidth, setWindowWidth] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [layoutMode, setLayoutMode] = useState("single")

  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [currentMeasurement, setCurrentMeasurement] = useState<Measurement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])

  const viewerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const currentSlice = dicomSeries[currentSliceIndex]

  useEffect(() => {
    setWindowLevel(currentSlice.windowLevel)
    setWindowWidth(currentSlice.windowWidth)
  }, [currentSliceIndex])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSliceIndex((prev) => (prev + 1) % dicomSeries.length)
      }, 100) // 10 FPS
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying])

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      if (activeTool === "zoom") {
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoom((prev) => Math.max(0.1, Math.min(prev * delta, 10)))
      } else {
        const delta = e.deltaY > 0 ? 1 : -1
        setCurrentSliceIndex((prev) => {
          const newIndex = prev + delta
          return Math.max(0, Math.min(dicomSeries.length - 1, newIndex))
        })
      }
    }

    const viewer = viewerRef.current
    if (viewer) {
      viewer.addEventListener("wheel", handleWheel, { passive: false })
      return () => viewer.removeEventListener("wheel", handleWheel)
    }
  }, [activeTool])

  const screenToImageCoords = (screenX: number, screenY: number) => {
    if (!imageRef.current || !viewerRef.current) return { x: 0, y: 0 }

    const rect = viewerRef.current.getBoundingClientRect()
    const imageRect = imageRef.current.getBoundingClientRect()

    const x = (screenX - imageRect.left) / zoom
    const y = (screenY - imageRect.top) / zoom

    return { x, y }
  }

  const calculateDistance = (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
    const pixelDistance = Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
    const mmDistance = pixelDistance * currentSlice.pixelSpacing
    return mmDistance
  }

  const calculateAngle = (points: { x: number; y: number }[]) => {
    if (points.length !== 3) return 0

    const [p1, p2, p3] = points
    const angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x)
    const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x)
    let angle = Math.abs(angle1 - angle2) * (180 / Math.PI)

    if (angle > 180) angle = 360 - angle
    return angle
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = screenToImageCoords(e.clientX, e.clientY)

    if (activeTool === "length") {
      if (!isDrawing) {
        const newMeasurement: Measurement = {
          id: Date.now().toString(),
          type: "length",
          points: [coords],
        }
        setCurrentMeasurement(newMeasurement)
        setIsDrawing(true)
      } else if (currentMeasurement) {
        // Completar medición
        const updatedMeasurement = {
          ...currentMeasurement,
          points: [...currentMeasurement.points, coords],
          value: calculateDistance(currentMeasurement.points[0], coords),
          unit: "mm",
        }
        setMeasurements((prev) => [...prev, updatedMeasurement])
        setCurrentMeasurement(null)
        setIsDrawing(false)
      }
    } else if (activeTool === "angle") {
      if (!currentMeasurement) {
        const newMeasurement: Measurement = {
          id: Date.now().toString(),
          type: "angle",
          points: [coords],
        }
        setCurrentMeasurement(newMeasurement)
        setIsDrawing(true)
      } else if (currentMeasurement.points.length < 2) {
        setCurrentMeasurement({
          ...currentMeasurement,
          points: [...currentMeasurement.points, coords],
        })
      } else {
        const updatedMeasurement = {
          ...currentMeasurement,
          points: [...currentMeasurement.points, coords],
          value: calculateAngle([...currentMeasurement.points, coords]),
          unit: "°",
        }
        setMeasurements((prev) => [...prev, updatedMeasurement])
        setCurrentMeasurement(null)
        setIsDrawing(false)
      }
    } else if (activeTool === "pan" || activeTool === "pointer") {
      // Pan/arrastrar imagen
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && (activeTool === "pan" || activeTool === "pointer")) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    } else if (isDrawing && currentMeasurement) {
      const coords = screenToImageCoords(e.clientX, e.clientY)
      if (currentMeasurement.type === "length" && currentMeasurement.points.length === 1) {
        setCurrentMeasurement({
          ...currentMeasurement,
          points: [currentMeasurement.points[0], coords],
        })
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.25, 10))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.25, 0.1))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setMeasurements([])
    setCurrentMeasurement(null)
    setIsDrawing(false)
  }

  const handleToolSelect = (tool: string) => {
    setActiveTool(tool)
    // Cancelar medición actual si se cambia de herramienta
    if (isDrawing) {
      setCurrentMeasurement(null)
      setIsDrawing(false)
    }
  }

  const handleFlipHorizontal = () => {
    console.log("[v0] Flip horizontal activated")
  }

  const handleFlipVertical = () => {
    console.log("[v0] Flip vertical activated")
  }

  const handleRotateLeft = () => {
    console.log("[v0] Rotate left activated")
  }

  const handleRotateRight = () => {
    console.log("[v0] Rotate right activated")
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleLayoutChange = (layout: string) => {
    setLayoutMode(layout)
  }

  const handleSliceNavigation = (direction: "first" | "prev" | "next" | "last") => {
    switch (direction) {
      case "first":
        setCurrentSliceIndex(0)
        break
      case "prev":
        setCurrentSliceIndex((prev) => Math.max(0, prev - 1))
        break
      case "next":
        setCurrentSliceIndex((prev) => Math.min(dicomSeries.length - 1, prev + 1))
        break
      case "last":
        setCurrentSliceIndex(dicomSeries.length - 1)
        break
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-sm"></div>
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Open Health</div>
            <div className="text-slate-400 text-xs">Imaging Foundation</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1">
          {/* Herramientas de selección */}
          <Button
            variant={activeTool === "pointer" ? "default" : "ghost"}
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => handleToolSelect("pointer")}
          >
            <MousePointer className="w-4 h-4" />
          </Button>

          {/* Herramientas de manipulación */}
          <Button
            variant={activeTool === "pan" ? "default" : "ghost"}
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => handleToolSelect("pan")}
          >
            <Move className="w-4 h-4" />
          </Button>

          <Button
            variant={activeTool === "zoom" ? "default" : "ghost"}
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => handleToolSelect("zoom")}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>

          {/* Separador */}
          <div className="w-px h-6 bg-slate-600 mx-1"></div>

          {/* Herramientas de medición */}
          <Button
            variant={activeTool === "length" ? "default" : "ghost"}
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => handleToolSelect("length")}
          >
            <Ruler className="w-4 h-4" />
          </Button>

          <Button
            variant={activeTool === "angle" ? "default" : "ghost"}
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => handleToolSelect("angle")}
          >
            <Triangle className="w-4 h-4" />
          </Button>

          <Button
            variant={activeTool === "circle" ? "default" : "ghost"}
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => handleToolSelect("circle")}
          >
            <Circle className="w-4 h-4" />
          </Button>

          <Button
            variant={activeTool === "rectangle" ? "default" : "ghost"}
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => handleToolSelect("rectangle")}
          >
            <Square className="w-4 h-4" />
          </Button>

          {/* Separador */}
          <div className="w-px h-6 bg-slate-600 mx-1"></div>

          {/* Herramientas de window/level */}
          <Button
            variant={activeTool === "wwwc" ? "default" : "ghost"}
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => handleToolSelect("wwwc")}
          >
            <Crosshair className="w-4 h-4" />
          </Button>

          {/* Herramientas de transformación */}
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={handleFlipHorizontal}>
            <FlipHorizontal className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={handleFlipVertical}>
            <FlipVertical className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={handleRotateLeft}>
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={handleRotateRight}>
            <RotateCw className="w-4 h-4" />
          </Button>

          {/* Separador */}
          <div className="w-px h-6 bg-slate-600 mx-1"></div>

          {/* Herramientas de captura */}
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Camera className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Download className="w-4 h-4" />
          </Button>

          {/* Layout tools */}
          <Button
            variant={layoutMode === "grid" ? "default" : "ghost"}
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => handleLayoutChange("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Maximize className="w-4 h-4" />
          </Button>

          {/* Separador */}
          <div className="w-px h-6 bg-slate-600 mx-1"></div>

          {/* Controles de reproducción */}
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => handleSliceNavigation("first")}
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => handleSliceNavigation("last")}
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          {/* Herramientas adicionales */}
          <Button
            variant={showAnnotations ? "default" : "ghost"}
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => setShowAnnotations(!showAnnotations)}
          >
            {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>

          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Link className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={handleResetView}>
            <RotateCcw className="w-4 h-4" />
          </Button>

          {/* Más herramientas */}
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onBack} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <User className="w-4 h-4" />
            <span className="ml-1">{study.patientName}</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Panel lateral izquierdo */}
        <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
          {/* Header del panel */}
          <div className="p-3 border-b border-slate-700">
            <div className="flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-white">Studies</span>
            </div>
          </div>

          {/* Lista de estudios */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-slate-400 mb-2">15-Oct-2022</div>
              <div className="bg-slate-800 rounded p-2 mb-2">
                <div className="text-white text-sm font-medium">MR/T2 TSE TRA</div>
                <div className="text-slate-400 text-xs">{dicomSeries.length} images</div>
              </div>
            </div>

            <div className="p-2 border-b border-slate-700">
              <div className="text-xs text-slate-400 mb-2">Slice Navigation</div>
              <input
                type="range"
                min="0"
                max={dicomSeries.length - 1}
                value={currentSliceIndex}
                onChange={(e) => setCurrentSliceIndex(Number.parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1</span>
                <span>{currentSliceIndex + 1}</span>
                <span>{dicomSeries.length}</span>
              </div>
            </div>

            <div className="p-2 space-y-2">
              <div className="text-xs text-slate-400 mb-2">Nearby Slices</div>
              {Array.from({ length: 5 }, (_, i) => {
                const sliceIndex = Math.max(0, Math.min(dicomSeries.length - 1, currentSliceIndex - 2 + i))
                const slice = dicomSeries[sliceIndex]
                return (
                  <div
                    key={sliceIndex}
                    className={`bg-slate-800 rounded p-2 cursor-pointer hover:bg-slate-700 ${
                      sliceIndex === currentSliceIndex ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => setCurrentSliceIndex(sliceIndex)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={slice.url || "/placeholder.svg"}
                        alt={slice.description}
                        className="w-12 h-12 object-cover rounded bg-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-medium truncate">Slice {slice.instanceNumber}</div>
                        <div className="text-slate-400 text-xs">Loc: {slice.sliceLocation.toFixed(1)}mm</div>
                        <div className="text-slate-400 text-xs">{slice.acquisitionTime}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Viewer Area */}
        <div className="flex-1 relative">
          {/* Back Button */}
          <Button
            onClick={onBack}
            variant="outline"
            className="absolute top-4 left-4 z-10 bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la lista
          </Button>

          <div className="absolute top-4 right-4 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 text-sm">
            <div className="text-white font-medium">{currentSlice.description}</div>
            <div className="text-slate-400">
              Slice {currentSliceIndex + 1} of {dicomSeries.length}
            </div>
            <div className="text-slate-400">Zoom: {(zoom * 100).toFixed(0)}%</div>
            <div className="text-slate-400">
              WL: {windowLevel} WW: {windowWidth}
            </div>
            <div className="text-slate-400">Tool: {activeTool}</div>
            <div className="text-slate-400">Spacing: {currentSlice.pixelSpacing.toFixed(3)} mm/px</div>
            <div className="text-slate-400">Thickness: {currentSlice.sliceThickness} mm</div>
            <div className="text-slate-400">Location: {currentSlice.sliceLocation.toFixed(1)} mm</div>
            <div className="text-slate-400">
              TE: {currentSlice.echoTime}ms TR: {currentSlice.repetitionTime}ms
            </div>
          </div>

          {measurements.length > 0 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 text-sm max-w-md">
              <div className="text-white font-medium mb-2">Mediciones</div>
              {measurements.map((measurement, index) => (
                <div key={measurement.id} className="text-slate-300 text-xs mb-1">
                  {measurement.type === "length" && (
                    <span>
                      Longitud {index + 1}: {measurement.value?.toFixed(2)} {measurement.unit}
                    </span>
                  )}
                  {measurement.type === "angle" && (
                    <span>
                      Ángulo {index + 1}: {measurement.value?.toFixed(1)} {measurement.unit}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Viewer Area */}
          <div
            ref={viewerRef}
            className="w-full h-full flex items-center justify-center bg-black overflow-hidden"
            style={{
              cursor:
                activeTool === "pan"
                  ? "grab"
                  : activeTool === "length" || activeTool === "angle"
                    ? "crosshair"
                    : "default",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="relative transition-transform duration-100"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              <img
                ref={imageRef}
                src={currentSlice.url || "/placeholder.svg"}
                alt={currentSlice.description}
                className="max-w-none select-none"
                draggable={false}
                style={{
                  filter: `contrast(${windowWidth / 1000}) brightness(${windowLevel / 400})`,
                }}
              />

              <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
                {/* Mediciones completadas */}
                {measurements.map((measurement) => (
                  <g key={measurement.id}>
                    {measurement.type === "length" && measurement.points.length === 2 && (
                      <>
                        <line
                          x1={measurement.points[0].x}
                          y1={measurement.points[0].y}
                          x2={measurement.points[1].x}
                          y2={measurement.points[1].y}
                          stroke="#00ff00"
                          strokeWidth="2"
                        />
                        <circle cx={measurement.points[0].x} cy={measurement.points[0].y} r="3" fill="#00ff00" />
                        <circle cx={measurement.points[1].x} cy={measurement.points[1].y} r="3" fill="#00ff00" />
                        <text
                          x={(measurement.points[0].x + measurement.points[1].x) / 2}
                          y={(measurement.points[0].y + measurement.points[1].y) / 2 - 10}
                          fill="#00ff00"
                          fontSize="12"
                          textAnchor="middle"
                        >
                          {measurement.value?.toFixed(2)} mm
                        </text>
                      </>
                    )}
                    {measurement.type === "angle" && measurement.points.length === 3 && (
                      <>
                        <line
                          x1={measurement.points[0].x}
                          y1={measurement.points[0].y}
                          x2={measurement.points[1].x}
                          y2={measurement.points[1].y}
                          stroke="#ffff00"
                          strokeWidth="2"
                        />
                        <line
                          x1={measurement.points[1].x}
                          y1={measurement.points[1].y}
                          x2={measurement.points[2].x}
                          y2={measurement.points[2].y}
                          stroke="#ffff00"
                          strokeWidth="2"
                        />
                        {measurement.points.map((point, i) => (
                          <circle key={i} cx={point.x} cy={point.y} r="3" fill="#ffff00" />
                        ))}
                        <text
                          x={measurement.points[1].x + 10}
                          y={measurement.points[1].y - 10}
                          fill="#ffff00"
                          fontSize="12"
                        >
                          {measurement.value?.toFixed(1)}°
                        </text>
                      </>
                    )}
                  </g>
                ))}

                {/* Medición en progreso */}
                {currentMeasurement && (
                  <g>
                    {currentMeasurement.type === "length" && currentMeasurement.points.length >= 1 && (
                      <>
                        {currentMeasurement.points.length === 2 && (
                          <line
                            x1={currentMeasurement.points[0].x}
                            y1={currentMeasurement.points[0].y}
                            x2={currentMeasurement.points[1].x}
                            y2={currentMeasurement.points[1].y}
                            stroke="#00ff00"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                        )}
                        {currentMeasurement.points.map((point, i) => (
                          <circle key={i} cx={point.x} cy={point.y} r="3" fill="#00ff00" />
                        ))}
                      </>
                    )}
                  </g>
                )}
              </svg>

              {/* Medical Overlay Information */}
              {showAnnotations && (
                <>
                  <div className="absolute top-4 left-4 text-white text-xs font-mono bg-black/50 p-2 rounded">
                    <div>Patient: {study.patientName}</div>
                    <div>Study: {study.studyDate}</div>
                    <div>Series: T2 TSE TRA</div>
                    <div>Instance: {currentSlice.instanceNumber}</div>
                    <div>Location: {currentSlice.sliceLocation.toFixed(1)}mm</div>
                  </div>

                  <div className="absolute top-4 right-4 text-white text-xs font-mono bg-black/50 p-2 rounded">
                    <div>
                      Slice: {currentSliceIndex + 1}/{dicomSeries.length}
                    </div>
                    <div>WL: {windowLevel}</div>
                    <div>WW: {windowWidth}</div>
                    <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
                    <div>TE: {currentSlice.echoTime}ms</div>
                    <div>TR: {currentSlice.repetitionTime}ms</div>
                  </div>

                  <div className="absolute bottom-4 left-4 text-white text-xs font-mono bg-black/50 p-2 rounded">
                    <div>A</div>
                  </div>

                  <div className="absolute bottom-4 right-4 text-white text-xs font-mono bg-black/50 p-2 rounded">
                    <div>R</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 text-sm text-center">
            <div className="text-white">
              {activeTool === "length" && "Haz clic en dos puntos para medir distancia"}
              {activeTool === "angle" && "Haz clic en tres puntos para medir ángulo"}
              {activeTool === "zoom" && "Usa la rueda del mouse para hacer zoom"}
              {(activeTool === "pointer" || activeTool === "pan") &&
                `Navegando slice ${currentSliceIndex + 1} de ${dicomSeries.length} • Usa scroll para navegar`}
            </div>
            <div className="text-slate-400">
              {activeTool === "length" && "Las mediciones se muestran en milímetros (mm)"}
              {activeTool === "angle" && "Los ángulos se muestran en grados (°)"}
              {(activeTool === "pointer" || activeTool === "pan") &&
                `${isPlaying ? "Reproduciendo automáticamente" : "Usa el botón Play para reproducir automáticamente"}`}
            </div>
          </div>

          {/* Tutorial Overlay */}
          {showTutorial && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <div className="bg-blue-900 rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-2">Scrolling Through Images</h3>
                <p className="text-slate-300 mb-4">
                  You can scroll through the {dicomSeries.length} slices using the mouse wheel, slider, or play button
                  for automatic playback.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">1/12</span>
                  <Button onClick={() => setShowTutorial(false)} className="bg-blue-600 hover:bg-blue-700">
                    Skip all
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Notice */}
      <div className="bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <div>
              <div className="text-white font-medium">
                OHIF Viewer is <span className="text-blue-400">for investigational use only</span>
              </div>
              <div className="text-blue-400 text-sm cursor-pointer hover:underline">Learn more about OHIF Viewer</div>
            </div>
          </div>
          <Button variant="outline" className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
            Confirm and hide
          </Button>
        </div>
      </div>
    </div>
  )
}
