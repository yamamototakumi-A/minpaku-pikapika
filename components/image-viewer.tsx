"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Move } from "lucide-react"
import Image from "next/image"

interface ImageViewerProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  currentIndex: number
  onIndexChange: (index: number) => void
  titles: string[]
}

export function ImageViewer({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  titles
}: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Modal dragging state
  const [isModalDragging, setIsModalDragging] = useState(false)
  const [modalDragStart, setModalDragStart] = useState({ x: 0, y: 0 })
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
  const [isModalExpanded, setIsModalExpanded] = useState(false)

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [currentIndex])

  // Reset modal position when opening
  useEffect(() => {
    if (isOpen) {
      setModalPosition({ x: 0, y: 0 })
      setIsModalExpanded(false)
    }
  }, [isOpen])

  // Mouse drag handlers for image
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Modal dragging handlers
  const handleModalMouseDown = (e: React.MouseEvent) => {
    if (isModalExpanded || scale > 1) {
      e.stopPropagation()
      setIsModalDragging(true)
      setModalDragStart({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      })
    }
  }

  const handleModalMouseMove = (e: React.MouseEvent) => {
    if (isModalDragging && (isModalExpanded || scale > 1)) {
      setModalPosition({
        x: e.clientX - modalDragStart.x,
        y: e.clientY - modalDragStart.y
      })
    }
  }

  const handleModalMouseUp = () => {
    setIsModalDragging(false)
  }

  // Touch drag handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      e.preventDefault()
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2)
      setIsModalExpanded(true)
    }
  }

  const toggleModalExpand = () => {
    setIsModalExpanded(!isModalExpanded)
    if (!isModalExpanded) {
      setScale(2)
    } else {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  const nextImage = () => {
    if (currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1)
    }
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 4))
    if (scale >= 1) {
      setIsModalExpanded(true)
    }
  }

  const zoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 0.5)
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 })
        setIsModalExpanded(false)
      }
      return newScale
    })
  }

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsModalExpanded(false)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return
    
    switch (e.key) {
      case 'ArrowLeft':
        prevImage()
        break
      case 'ArrowRight':
        nextImage()
        break
      case 'Escape':
        onClose()
        break
      case '+':
      case '=':
        zoomIn()
        break
      case '-':
        zoomOut()
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex])

  // Global mouse move handler for modal dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isModalDragging && (isModalExpanded || scale > 1)) {
        setModalPosition({
          x: e.clientX - modalDragStart.x,
          y: e.clientY - modalDragStart.y
        })
      }
    }

    const handleGlobalMouseUp = () => {
      setIsModalDragging(false)
    }

    if (isModalDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isModalDragging, isModalExpanded, scale, modalDragStart])

  if (!isOpen || images.length === 0) return null

  const currentTitle = titles[currentIndex] || `ステップ ${currentIndex + 1}`
  const currentImage = images[currentIndex]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`w-[95vw] h-[95vh] max-w-[98vw] max-h-[98vh] p-0 bg-black transition-all duration-300 ${
          isModalExpanded || scale > 1 ? 'cursor-move' : ''
        }`}
        style={{
          transform: (isModalExpanded || scale > 1) ? `translate(${modalPosition.x}px, ${modalPosition.y}px)` : 'none',
          position: (isModalExpanded || scale > 1) ? 'fixed' : 'relative',
          zIndex: (isModalExpanded || scale > 1) ? 9999 : 'auto'
        }}
        onMouseDown={handleModalMouseDown}
        onMouseMove={handleModalMouseMove}
        onMouseUp={handleModalMouseUp}
      >
        <DialogTitle className="sr-only">
          {currentTitle} - 画像ビューア
        </DialogTitle>
        
        <DialogDescription className="sr-only">
          {currentTitle}の画像ビューアです。ズーム、移動、ナビゲーションが可能です。
        </DialogDescription>
        
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-2 sm:p-4 bg-black text-white">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevImage}
                disabled={currentIndex === 0}
                className="text-white hover:bg-white/20 p-1 sm:p-2"
                aria-label="前の画像"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <span className="text-xs sm:text-sm">
                {currentIndex + 1} / {images.length}
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline ml-2">
                (ダブルクリックでズーム)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextImage}
                disabled={currentIndex === images.length - 1}
                className="text-white hover:bg-white/20 p-1 sm:p-2"
                aria-label="次の画像"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                className="text-white hover:bg-white/20 p-1 sm:p-2"
                aria-label="縮小"
              >
                <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <span className="text-xs sm:text-sm min-w-[40px] sm:min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                className="text-white hover:bg-white/20 p-1 sm:p-2"
                aria-label="拡大"
              >
                <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleModalExpand}
                className="text-white hover:bg-white/20 p-1 sm:p-2"
                title={isModalExpanded ? "縮小" : "拡大"}
                aria-label={isModalExpanded ? "モーダル縮小" : "モーダル拡大"}
              >
                <Move className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="text-white hover:bg-white/20 p-1 sm:p-2"
                title="リセット"
                aria-label="ズームリセット"
              >
                <span className="text-xs">100%</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 p-1 sm:p-2"
                aria-label="閉じる"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 relative overflow-hidden bg-gray-900">
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={currentImage}
                alt={currentTitle}
                className="object-contain"
                style={{ 
                  width: 'auto', 
                  height: 'auto', 
                  maxWidth: '100%', 
                  maxHeight: '100%' 
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder.svg?height=400&width=600&text=画像を読み込めません'
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-2 sm:p-4 bg-black text-white">
            <h3 className="text-sm sm:text-lg font-semibold text-center">
              {currentTitle}
            </h3>
          </div>

          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <div className="p-2 sm:p-4 bg-black border-t border-gray-700">
              <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => onIndexChange(index)}
                    className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 border-2 rounded overflow-hidden ${
                      index === currentIndex 
                        ? 'border-green-500' 
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    aria-label={`ステップ ${index + 1} を表示`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="object-cover"
                      style={{ 
                        width: 'auto', 
                        height: 'auto', 
                        maxWidth: '100%', 
                        maxHeight: '100%' 
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder.svg?height=64&width=64&text=×'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
