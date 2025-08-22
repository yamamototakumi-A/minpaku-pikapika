"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, Camera } from 'lucide-react'
import { LoadingBar } from "@/components/loading-bar"

interface ImageFile {
  id: string
  file: File
  preview: string
}

interface ImageUploadGalleryProps {
  title?: string
  description?: string
  maxFiles?: number
  acceptedTypes?: string
  className?: string
  onImagesChange?: (images: File[]) => void
}

export default function ImageUploadGallery({
  title = "画像選択",
  description = "写真を選択してください（Reportボタンで一括アップロード・通知）",
  maxFiles = 10,
  acceptedTypes = "image/*",
  className = "",
  onImagesChange
}: ImageUploadGalleryProps) {
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalImageSrc, setModalImageSrc] = useState("")
  const [modalCaption, setModalCaption] = useState("")

  // Notify parent component when images change (only when actually different)
  useEffect(() => {
    if (onImagesChange) {
      const files = selectedImages.map(img => img.file)
      onImagesChange(files)
    }
  }, [selectedImages.length, onImagesChange])

  // Modal functions
  const openModal = (imageSrc: string, caption: string) => {
    setModalImageSrc(imageSrc)
    setModalCaption(caption)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newImages: ImageFile[] = []
    const currentCount = selectedImages.length

    for (let i = 0; i < files.length && currentCount + newImages.length < maxFiles; i++) {
      const file = files[i]
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        continue
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const preview = URL.createObjectURL(file)
      
      newImages.push({
        id,
        file,
        preview
      })
    }

    setSelectedImages(prev => [...prev, ...newImages])
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (id: string) => {
    setSelectedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id)
      if (imageToRemove) {
        // Revoke the object URL to free memory
        URL.revokeObjectURL(imageToRemove.preview)
      }
      return prev.filter(img => img.id !== id)
    })
  }

  return (
    <div className={className}>
      <LoadingBar 
        isLoading={false} 
        message="" 
      />

      <Card className="bg-white shadow-lg border-2 border-green-600">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-600 font-japanese font-bold text-lg sm:text-xl">
            <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes}
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Button 
                variant="outline" 
                asChild 
                className="border-2 border-gray-300 font-japanese"
                disabled={selectedImages.length >= maxFiles}
              >
                <span>写真を選択</span>
              </Button>
            </label>
            <p className="text-sm text-gray-500 mt-2 font-japanese">
              {description}
            </p>
            {selectedImages.length >= maxFiles && (
              <p className="text-sm text-orange-600 mt-2 font-japanese">
                最大{maxFiles}枚まで選択可能です
              </p>
            )}
          </div>

          {/* Image Preview Gallery */}
          {selectedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800 font-japanese">
                  選択された画像 ({selectedImages.length}枚)
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    selectedImages.forEach(img => URL.revokeObjectURL(img.preview))
                    setSelectedImages([])
                  }}
                  className="text-red-600 border-red-300 hover:bg-red-50 font-japanese"
                >
                  すべて削除
                </Button>
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {selectedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-400 transition-colors relative">
                      <img
                        src={image.preview}
                        alt={`Preview ${image.file.name}`}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-70 transition-opacity duration-300"
                        onClick={() => openModal(image.preview, image.file.name)}
                      />
                      {/* Zoom indicator */}
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM8 2a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </div>
                      Remove Button
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(image.id)
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate font-japanese">
                      {image.file.name}
                    </p>
                    <p className="text-xs text-gray-400 font-japanese">
                      {(image.file.size / 1024 / 1024).toFixed(1)}MB
                    </p>
                  </div>
                ))}
              </div>

              {/* Removed: Upload Button - Images are now uploaded via Report button */}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={closeModal}
        >
          <div className="relative w-[90vw] h-[90vh] max-w-7xl max-h-full flex flex-col">
            <button 
              className="absolute top-4 right-4 text-white text-4xl font-bold cursor-pointer hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
              onClick={closeModal}
            >
              &times;
            </button>
            <div className="flex-1 flex items-center justify-center">
              <img 
                className="max-w-full max-h-full object-contain"
                src={modalImageSrc}
                alt={modalCaption}
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder.svg?height=400&width=600&text=画像を読み込めません'
                }}
              />
            </div>
            <div className="text-center text-white mt-4 p-4 bg-black bg-opacity-50 rounded">
              <h3 className="text-lg font-bold">{modalCaption}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 