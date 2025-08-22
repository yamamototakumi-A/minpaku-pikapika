"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ArrowLeft, Search, Calendar, MapPin, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, MessageCircle, Send, Receipt, Edit, Trash2, Eye, Upload, Building2, Home, Clock, CheckCircle, X, AlertCircle } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { LoadingBar } from "@/components/loading-bar"
import LogoutButton from "@/components/logout-button"
import SecuritySettings from "@/components/security-settings"

const months = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
]

const mockMessages = [
  { id: 1, sender: "本社", message: "月次レポートの提出をお願いします", time: "15分前", unread: true },
  { id: 2, sender: "新宿支店", message: "清掃用品の在庫について相談があります", time: "45分前", unread: true },
  { id: 3, sender: "本社スタッフ", message: "新しいガイドラインが更新されました", time: "2時間前", unread: false }
]

export default function BranchDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [hierarchy, setHierarchy] = useState<any>({})
  const [loadingHierarchy, setLoadingHierarchy] = useState(false)
  const [selectedYear, setSelectedYear] = useState(2025)
  const [selectedAlbumType, setSelectedAlbumType] = useState<"before" | "after" | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [selectedReceiptMonth, setSelectedReceiptMonth] = useState<string | null>(null)
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)
  const [selectedFacilityName, setSelectedFacilityName] = useState<string | null>(null)
  const [receiptsByMonth, setReceiptsByMonth] = useState<Record<string, { id: number; url: string }[]>>({})
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [chatMessage, setChatMessage] = useState("")
  const [messages, setMessages] = useState(mockMessages)
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<File[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  // Add state for records and images
  const [facilityRecords, setFacilityRecords] = useState<any[]>([])
  const [roomImages, setRoomImages] = useState<{ before: string[]; after: string[] }>({ before: [], after: [] })
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadMessage, setUploadMessage] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Add accordion state for hierarchical view
  const [expandedFacilities, setExpandedFacilities] = useState<Set<string>>(new Set())
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [expandedBeforeAfter, setExpandedBeforeAfter] = useState<Set<string>>(new Set())

  // New state variables for image preloading and delete functionality
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())
  const [imageScale, setImageScale] = useState(1)
  const [imageOffset, setImageOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [offsetStart, setOffsetStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)
  // Receipt management states
  const [selectedReceiptYear, setSelectedReceiptYear] = useState<number>(new Date().getFullYear())
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<Set<number>>(new Set())
  const [isReceiptDeleting, setIsReceiptDeleting] = useState(false)
  const [receiptDeleteProgress, setReceiptDeleteProgress] = useState(0)
  const [receiptUploadProgress, setReceiptUploadProgress] = useState(0)
  const [receiptUploadStatus, setReceiptUploadStatus] = useState('')
  const monthUploadInputRef = React.useRef<HTMLInputElement | null>(null)

  // Toggle functions for accordion
  const toggleFacility = (facilityId: string) => {
    const newExpanded = new Set(expandedFacilities)
    if (newExpanded.has(facilityId)) {
      newExpanded.delete(facilityId)
      // Close all child levels
      setExpandedDates(new Set())
      setExpandedRooms(new Set())
      setExpandedBeforeAfter(new Set())
    } else {
      newExpanded.add(facilityId)
    }
    setExpandedFacilities(newExpanded)
  }

  const toggleDate = (facilityId: string, date: string) => {
    const key = `${facilityId}-${date}`
    const newExpanded = new Set(expandedDates)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
      // Close child levels
      setExpandedRooms(new Set())
      setExpandedBeforeAfter(new Set())
    } else {
      newExpanded.add(key)
    }
    setExpandedDates(newExpanded)
  }

  const toggleRoom = (facilityId: string, date: string, roomType: string) => {
    const key = `${facilityId}-${date}-${roomType}`
    const newExpanded = new Set(expandedRooms)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
      // Close child level
      setExpandedBeforeAfter(new Set())
    } else {
      newExpanded.add(key)
    }
    setExpandedRooms(newExpanded)
  }

  const toggleBeforeAfter = (facilityId: string, date: string, roomType: string, beforeAfter: string) => {
    const key = `${facilityId}-${date}-${roomType}-${beforeAfter}`
    const newExpanded = new Set(expandedBeforeAfter)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedBeforeAfter(newExpanded)
  }

  // Authentication check and data fetching
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      // Check if user is authenticated
      const token = localStorage.getItem('auth-token')
      if (!token) {
        // Redirect to login if no token
        window.location.href = '/'
        return
      }

      // Verify token is valid by making a test API call
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!res.ok) {
          // Token is invalid, redirect to login
          localStorage.removeItem('auth-token')
          window.location.href = '/'
          return
        }
        
        // Token is valid, fetch data
        setIsAuthenticated(true)
        await fetchFacilities()
        await fetchHierarchy()
      } catch (error) {
        console.error('Authentication error:', error)
        localStorage.removeItem('auth-token')
        setIsAuthenticated(false)
        window.location.href = '/'
      } finally {
        setIsCheckingAuth(false)
      }
    }

    const fetchFacilities = async () => {
      setLoadingFacilities(true)
      try {
        const token = localStorage.getItem('auth-token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/facilities/branch`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setFacilities(data.facilities || [])
        }
      } catch (e) { /* ignore */ }
      setLoadingFacilities(false)
    }

    const fetchHierarchy = async () => {
      setLoadingHierarchy(true)
      try {
        const token = localStorage.getItem('auth-token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/uploads/hierarchy`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setHierarchy(data.hierarchy || {})
        }
      } catch (e) { /* ignore */ }
      setLoadingHierarchy(false)
    }

    checkAuthAndFetchData()
  }, [])



  // Keyboard support for image viewer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isImageViewerOpen) return
      
      switch (event.key) {
        case 'Escape':
          closeImageViewer()
          break
        case 'ArrowLeft':
          if (viewerImages.length > 1) prevImage()
          break
        case 'ArrowRight':
          if (viewerImages.length > 1) nextImage()
          break
        case '+':
        case '=':
          event.preventDefault()
          zoomIn()
          break
        case '-':
          event.preventDefault()
          zoomOut()
          break
        case '0':
          event.preventDefault()
          resetZoom()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isImageViewerOpen, viewerImages.length])

  // Preload images when hierarchy changes
  useEffect(() => {
    if (!hierarchy || Object.keys(hierarchy).length === 0) return
    
    const preloadAllImages = () => {
      Object.values(hierarchy).forEach((facility: any) => {
        if (facility.records) {
          facility.records.forEach((record: any) => {
            if (record.rooms) {
              record.rooms.forEach((room: any) => {
                if (room.beforeImages) {
                  room.beforeImages.forEach((img: any) => preloadImage(img.url))
                }
                if (room.afterImages) {
                  room.afterImages.forEach((img: any) => preloadImage(img.url))
                }
              })
            }
          })
        }
      })
    }
    
    // Delay preloading to avoid blocking the UI
    const timeoutId = setTimeout(preloadAllImages, 1000)
    return () => clearTimeout(timeoutId)
  }, [hierarchy])

  // Handle image loading state when modal opens
  useEffect(() => {
    if (isImageViewerOpen && viewerImages.length > 0) {
      setIsImageLoading(true)
      const currentImage = viewerImages[currentImageIndex]
      
      if (preloadedImages.has(currentImage)) {
        setIsImageLoading(false)
      } else {
        const img = new window.Image()
        img.onload = () => {
          setIsImageLoading(false)
          setPreloadedImages(prev => new Set(prev).add(currentImage))
        }
        img.onerror = () => {
          setIsImageLoading(false)
        }
        img.src = currentImage
      }
    }
  }, [isImageViewerOpen, currentImageIndex, viewerImages, preloadedImages])

  // Handle image changes in modal
  useEffect(() => {
    if (isImageViewerOpen && viewerImages.length > 0) {
      const currentImage = viewerImages[currentImageIndex]
      
      if (!preloadedImages.has(currentImage)) {
        setIsImageLoading(true)
        const img = new window.Image()
        img.onload = () => {
          setIsImageLoading(false)
          setPreloadedImages(prev => new Set(prev).add(currentImage))
        }
        img.onerror = () => {
          setIsImageLoading(false)
        }
        img.src = currentImage
      } else {
        setIsImageLoading(false)
      }
    }
  }, [currentImageIndex, viewerImages, preloadedImages, isImageViewerOpen])

  // Handle ESC key for closing modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isImageViewerOpen) {
          closeImageViewer()
        }
        if (isReceiptModalOpen) {
          setIsReceiptModalOpen(false)
        }
        if (isChatOpen) {
          setIsChatOpen(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isImageViewerOpen, isReceiptModalOpen, isChatOpen])

  // Preload images when they come into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const imgElement = entry.target as HTMLImageElement
            if (imgElement.src && !preloadedImages.has(imgElement.src)) {
              preloadImage(imgElement.src)
            }
          }
        })
      },
      { threshold: 0.1 }
    )

    // Observe all images in the document
    const images = document.querySelectorAll('img')
    images.forEach((img) => observer.observe(img))

    return () => observer.disconnect()
  }, [preloadedImages])

  // Handle wheel events for zooming in image viewer
  useEffect(() => {
    if (!isImageViewerOpen) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      
      if (event.ctrlKey || event.metaKey) {
        if (event.deltaY < 0) {
          zoomIn()
        } else {
          zoomOut()
        }
      }
    }

    document.addEventListener('wheel', handleWheel, { passive: false })
    return () => document.removeEventListener('wheel', handleWheel)
  }, [isImageViewerOpen])

  // Handle touch gestures for mobile zoom
  useEffect(() => {
    if (!isImageViewerOpen) return

    let initialDistance = 0
    let initialScale = 1

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        initialDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        )
        initialScale = imageScale
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        event.preventDefault()
        
        const currentDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        )
        
        const scale = (currentDistance / initialDistance) * initialScale
        const clampedScale = Math.max(0.5, Math.min(3, scale))
        setImageScale(clampedScale)
      }
    }

    const handleTouchEnd = () => {
      initialDistance = 0
      initialScale = 1
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isImageViewerOpen, imageScale])

  // Handle double-click for resetting zoom
  useEffect(() => {
    if (!isImageViewerOpen) return

    const handleDoubleClick = (event: Event) => {
      event.preventDefault()
      resetZoom()
    }

    const imageContainer = document.querySelector('[data-image-viewer]')
    if (imageContainer) {
      imageContainer.addEventListener('dblclick', handleDoubleClick)
      return () => imageContainer.removeEventListener('dblclick', handleDoubleClick)
    }
  }, [isImageViewerOpen])

  // Preload next and previous images for smooth navigation
  useEffect(() => {
    if (!isImageViewerOpen || viewerImages.length === 0) return

    const preloadAdjacentImages = () => {
      const nextIndex = (currentImageIndex + 1) % viewerImages.length
      const prevIndex = (currentImageIndex - 1 + viewerImages.length) % viewerImages.length
      
      preloadImage(viewerImages[nextIndex])
      preloadImage(viewerImages[prevIndex])
    }

    const timeoutId = setTimeout(preloadAdjacentImages, 500)
    return () => clearTimeout(timeoutId)
  }, [isImageViewerOpen, currentImageIndex, viewerImages])

  // Handle image loading errors
  useEffect(() => {
    if (!isImageViewerOpen || viewerImages.length === 0) return

    const handleImageError = (event: Event) => {
      const img = event.target as HTMLImageElement
      img.src = '/placeholder.svg'
      setIsImageLoading(false)
    }

    const images = document.querySelectorAll('[data-image-viewer] img')
    images.forEach(img => {
      img.addEventListener('error', handleImageError)
    })

    return () => {
      images.forEach(img => {
        img.removeEventListener('error', handleImageError)
      })
    }
  }, [isImageViewerOpen, viewerImages])

  // Filter facilities based on search term
  const filteredFacilityIds = Object.keys(hierarchy).filter(fid => 
    fid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (hierarchy[fid]?.name && hierarchy[fid].name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Fetch cleaning records for a facility
  const fetchRecordsForFacility = async (facilityId: string) => {
    const token = localStorage.getItem('auth-token')
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/facilities/${facilityId}/cleaning-records`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      return data.records || []
    }
    return []
  }

  // Fetch images for a cleaning record
  const fetchImagesForRecord = async (recordId: string) => {
    const token = localStorage.getItem('auth-token')
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/cleaning-records/${recordId}/images`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      return { before: data.before_images || [], after: data.after_images || [] }
    }
    return { before: [], after: [] }
  }



  // Only keep the first occurrence of these implementations:
  const handleDeleteImage = async (imageId: number) => {
    const token = localStorage.getItem('auth-token')
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/cleaning-images/${imageId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    // Refresh hierarchy data instead
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/uploads/hierarchy`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      setHierarchy(data.hierarchy || {})
    }
  }

  const handleReplaceImage = async (imageId: number, file: File) => {
    const token = localStorage.getItem('auth-token')
    const formData = new FormData()
    formData.append('image', file)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/cleaning-images/${imageId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    // Refresh hierarchy data instead
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/uploads/hierarchy`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      setHierarchy(data.hierarchy || {})
    }
  }

  // TODO: Implement edit/delete actions for images using backend endpoints



  // Note: image management is handled via cleaning-images endpoints (handleDeleteImage, handleReplaceImage) above

  const handleReceiptClick = async (facilityId: string, name: string) => {
    setSelectedReceiptMonth(null)
    setSelectedFacilityId(facilityId)
    setSelectedFacilityName(name)
    setIsReceiptModalOpen(true)
    // Fetch receipts and group by YYYY-MM
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/facilities/${facilityId}/receipts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('🔍 Receipt data received:', data)
        const grouped: Record<string, { id: number; url: string }[]> = {}
        ;(data.receipts || []).forEach((receipt: any) => {
          console.log('📄 Processing receipt:', receipt)
          // Use uploadedAt to determine the month, fallback to current date if not available
          let monthKey: string
          if (receipt.uploadedAt) {
            const uploadDate = new Date(receipt.uploadedAt)
            monthKey = `${uploadDate.getFullYear()}-${(uploadDate.getMonth() + 1).toString().padStart(2, '0')}`
            console.log('📅 Using uploadedAt:', receipt.uploadedAt, '→ Month key:', monthKey)
          } else if (receipt.year && receipt.month) {
            // Fallback to year/month fields if they exist
            monthKey = `${receipt.year}-${String(receipt.month).padStart(2, '0')}`
            console.log('📅 Using year/month fields:', receipt.year, receipt.month, '→ Month key:', monthKey)
          } else {
            // If neither exists, use current date (fallback)
            const now = new Date()
            monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
            console.log('📅 Using current date fallback → Month key:', monthKey)
          }
          
          if (!grouped[monthKey]) grouped[monthKey] = []
          grouped[monthKey].push({ id: receipt.id, url: receipt.gcsUrl })
        })
        console.log('📊 Final grouped receipts:', grouped)
        setReceiptsByMonth(grouped)
      } else {
        setReceiptsByMonth({})
      }
    } catch {
      setReceiptsByMonth({})
    }
  }



  const handleReceiptMonthClick = (month: string) => {
    setSelectedReceiptMonth(month)
  }

  const handleImageAlbumClick = (images: string[], startIndex: number = 0) => {
    setViewerImages(images)
    setCurrentImageIndex(startIndex)
    setIsImageViewerOpen(true)
  }

  const handleImageClick = (imageUrl: string) => {
    setViewerImages([imageUrl])
    setCurrentImageIndex(0)
    setIsImageViewerOpen(true)
    setImageScale(1)
    setImageOffset({ x: 0, y: 0 })
  }

  // New functions for enhanced image functionality
  const preloadImage = (imageUrl: string) => {
    if (preloadedImages.has(imageUrl)) return
    
    const img = new window.Image()
    img.onload = () => {
      setPreloadedImages(prev => new Set(prev).add(imageUrl))
    }
    img.src = imageUrl
  }

  const handleImageClickEnhanced = (imageUrl: string, allImages: string[] = []) => {
    const imagesToShow = allImages.length > 0 ? allImages : [imageUrl]
    setViewerImages(imagesToShow)
    setCurrentImageIndex(allImages.indexOf(imageUrl))
    setIsImageViewerOpen(true)
    setImageScale(1)
  }

  const closeImageViewer = () => {
    setIsImageViewerOpen(false)
    setImageScale(1)
    setImageOffset({ x: 0, y: 0 })
  }

  const zoomIn = () => setImageScale(prev => Math.min(prev * 1.2, 3))
  const zoomOut = () => setImageScale(prev => Math.max(prev / 1.2, 0.5))
  const resetZoom = () => {
    setImageScale(1)
    setImageOffset({ x: 0, y: 0 })
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % viewerImages.length)
    setImageScale(1)
    setImageOffset({ x: 0, y: 0 })
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + viewerImages.length) % viewerImages.length)
    setImageScale(1)
    setImageOffset({ x: 0, y: 0 })
  }

  // Selection + bulk delete
  const toggleImageSelection = (imageId: number) => {
    const newSelected = new Set(selectedImageIds)
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId)
    } else {
      newSelected.add(imageId)
    }
    setSelectedImageIds(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedImageIds.size === 0) return
    
    const confirmed = window.confirm(`選択した ${selectedImageIds.size} 枚の画像を削除します。よろしいですか？この操作は元に戻せません。`)
    
    if (!confirmed) return
    
    setIsDeleting(true)
    setDeleteProgress(0)
    
    try {
      const ids = Array.from(selectedImageIds)
      const token = localStorage.getItem('auth-token')
      // Prefer POST endpoint for better compatibility with bodies
              const batchUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/cleaning-images/batch-delete`
      const res = await fetch(batchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageIds: ids })
      })

      if (!res.ok) {
        // Fallback: try DELETE /batch (some environments support it)
        const resDelete = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/cleaning-images/batch`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageIds: ids })
        })

        if (!resDelete.ok) {
          // Final fallback: sequential delete with progress
          let success = 0
          for (let i = 0; i < ids.length; i++) {
            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/cleaning-images/${ids[i]}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (r.ok) success++
            setDeleteProgress(Math.round(((i + 1) / ids.length) * 100))
          }
          if (success !== ids.length) {
            alert(`一部削除に失敗しました（成功: ${success} / 失敗: ${ids.length - success}）`)
          }
        }
      }
    } finally {
      setIsDeleting(false)
      setSelectedImageIds(new Set())
      // Refresh hierarchy
      const token = localStorage.getItem('auth-token')
              const res2 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/uploads/hierarchy`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res2.ok) {
        const data = await res2.json()
        setHierarchy(data.hierarchy || {})
      }
    }
  }

  const clearSelection = () => {
    setSelectedImageIds(new Set())
  }

  const handleReceiptUpload = async (files: FileList | null) => {
    if (!selectedFacilityId || !files || files.length === 0) return
    
    setUploadingImages(Array.from(files))
    setIsUploading(true)
    setReceiptUploadProgress(0)
    setReceiptUploadStatus('画像をアップロード中...')
    
    try {
      const token = localStorage.getItem('auth-token')
      const startTime = Date.now()
      let totalBytesUploaded = 0
      let totalBytes = Array.from(files).reduce((sum, file) => sum + file.size, 0)
      let successCount = 0
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('image', file)
        
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/auth/facilities/${selectedFacilityId}/receipts`)
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              // Calculate progress based on actual bytes uploaded
              const fileProgress = e.loaded / e.total
              const overallProgress = ((totalBytesUploaded + (fileProgress * file.size)) / totalBytes) * 100
              const percent = Math.round(overallProgress)
              
              setReceiptUploadProgress(percent)
              
              // Calculate ETA
              const elapsed = (Date.now() - startTime) / 1000
              const uploadSpeed = (totalBytesUploaded + e.loaded) / elapsed // bytes per second
              const remainingBytes = totalBytes - (totalBytesUploaded + e.loaded)
              const eta = uploadSpeed > 0 ? Math.round(remainingBytes / uploadSpeed) : 0
              
              setReceiptUploadStatus(`画像をアップロード中... ${percent}% `)
            }
          }
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              totalBytesUploaded += file.size
              successCount++
              resolve()
            } else {
              console.warn('Receipt upload failed for file:', file.name, 'Status:', xhr.status)
              resolve() // Continue with other files
            }
          }
          
          xhr.onerror = () => {
            console.warn('Network error during upload for file:', file.name)
            resolve() // Continue with other files
          }
          
          xhr.send(formData)
        })
      }
      
      if (successCount > 0) {
        // Refresh receipts data while preserving the selected month
        const currentSelectedMonth = selectedReceiptMonth
        await handleReceiptClick(selectedFacilityId, selectedFacilityName || selectedFacilityId)
        
        // Restore the selected month after refresh
        if (currentSelectedMonth) {
          setSelectedReceiptMonth(currentSelectedMonth)
        }
        
        setReceiptUploadStatus(`${successCount}枚のレシートをアップロードしました`)
      } else {
        setReceiptUploadStatus('アップロードに失敗しました')
      }
    } catch (error) {
      console.error('Receipt upload error:', error)
      setReceiptUploadStatus('アップロードエラーが発生しました')
    } finally {
      setIsUploading(false)
      setUploadingImages([])
      setTimeout(() => {
        setReceiptUploadProgress(0)
        setReceiptUploadStatus('')
      }, 2000)
    }
  }

  const handleSendMessage = () => {
    if (chatMessage.trim() && selectedChatUser) {
      const newMessage = {
        id: messages.length + 1,
        sender: "支社社長",
        message: chatMessage,
        time: "今",
        unread: false
      }
      setMessages([...messages, newMessage])
      setChatMessage("")
    }
  }

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">認証を確認中...</p>
        </div>
      </div>
    )
  }

  // Show login redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-600 text-lg mb-4">認証が必要です</p>
          <p className="text-gray-500">ログインページにリダイレクトしています...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      <LoadingBar 
        isLoading={isUploading} 
        message="画像をアップロード中..." 
      />

      {/* Header - Removed Orange Button */}
      <header className="bg-white/95 backdrop-blur-sm border-b-2 border-green-600 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-green-600 hover:text-orange-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">戻る</span>
            </Link>
            <div className="flex items-center space-x-4">
              <h1 className="text-xl sm:text-2xl font-bold text-orange-600">{facilities.length > 0 ? facilities[0].branchName : "支店ダッシュボード"}</h1>
              <SecuritySettings />
              <LogoutButton />
            </div>
            
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Branch Info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 sm:mb-8">
            <div>
              <p className="text-gray-700">支店内のすべての清掃記録を管理</p>
            </div>
          </div>

          {/* Search */}
          <Card className="border-2 border-gray-300 mb-6 sm:mb-8 bg-white shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="施設IDで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-300 focus:border-orange-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Facilities Hierarchy with Accordion Structure */}
          <div className="space-y-4">
            {loadingHierarchy ? (
              <div className="text-center py-12 sm:py-16">
                <p className="text-gray-500">記録を読み込み中...</p>
              </div>
            ) : filteredFacilityIds.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <Search className="h-12 sm:h-16 w-12 sm:w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">データが見つかりません</h3>
                <p className="text-gray-500">施設IDを変更してお試しください</p>
              </div>
            ) : (
              filteredFacilityIds.map((fid) => {
                const node = hierarchy[fid]
                return (
                  <Card key={fid} className="border-2 border-gray-300 hover:shadow-lg transition-all duration-300 bg-white">
                    <CardContent className="p-0">
                      {/* Facility Level */}
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 p-4 rounded-lg transition-all duration-300 group"
                        onClick={() => toggleFacility(fid)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                              <Building2 className="w-5 h-5 text-white" />
                          </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">
                                施設ID: {node.facilityId}
                              </h3>
                              <div className="text-sm text-gray-600 mt-1">{node.name}</div>
                              {/* Staff names who uploaded images */}
                              <div className="text-xs text-gray-500 mt-1">
                                {(() => {
                                  const staffSet = new Set<string>()
                                  Object.values(node.years || {}).forEach((yearData: any) => {
                                    Object.values(yearData).forEach((monthData: any) => {
                                      Object.values(monthData).forEach((dayData: any) => {
                                        Object.values(dayData).forEach((roomData: any) => {
                                          Object.values(roomData).forEach((images: any) => {
                                            images.forEach((img: any) => {
                                              if (img.uploader) {
                                                const staffName = `${img.uploader.surname || ''}${img.uploader.mainName ? ` ${img.uploader.mainName}` : ''} (${img.uploader.userId || ''})`
                                                staffSet.add(staffName)
                                              }
                                            })
                                          })
                                        })
                                      })
                                    })
                                  })
                                  return Array.from(staffSet).join(', ')
                                })()}
                        </div>
                      </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReceiptClick(node.facilityId, node.name)
                            }}
                            className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 text-emerald-700 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex items-center space-x-2 px-3 py-2"
                          >
                            <Receipt className="h-4 w-4" />
                            <span className="font-medium">レシート管理</span>
                          </Button>
                          <ChevronRight 
                            className={`h-6 w-6 text-gray-400 transition-all duration-300 group-hover:text-blue-600 ${
                              expandedFacilities.has(fid) ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </div>
                      
                      {/* Date Level */}
                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        expandedFacilities.has(fid) ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="space-y-3 p-4 pt-0">
                          {Object.entries(node.years || {}).map(([year, yearData]: [string, any]) => (
                            <div key={year} className="border-l-2 border-blue-200 pl-6">
                              {Object.entries(yearData).map(([month, monthData]: [string, any]) => (
                                <div key={`${year}-${month}`} className="border-l-2 border-green-200 pl-6">
                                  {Object.entries(monthData).map(([day, dayData]: [string, any]) => (
                                    <div key={`${year}-${month}-${day}`} className="border-l border-gray-200 pl-6">
                                      <div 
                                        className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 p-3 rounded-lg transition-all duration-300 group"
                                        onClick={() => toggleDate(fid, `${year}年${month}月${day}日`)}
                                      >
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                                            <Calendar className="w-4 h-4 text-white" />
                                          </div>
                                          <h4 className="text-md font-semibold text-gray-700">
                                            {year}年{month}月{day}日
                                          </h4>
                                        </div>
                                        <ChevronRight 
                                          className={`h-5 w-5 text-gray-400 transition-all duration-300 group-hover:text-green-600 ${
                                            expandedDates.has(`${fid}-${year}年${month}月${day}日`) ? 'rotate-90' : ''
                                          }`}
                                        />
                                      </div>
                                      
                                      {/* Room Level */}
                                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                        expandedDates.has(`${fid}-${year}年${month}月${day}日`) ? 'max-h-screen opacity-100 mt-3' : 'max-h-0 opacity-0'
                                      }`}>
                                        <div className="space-y-3">
                                          {Object.entries(dayData).map(([roomType, roomData]: [string, any]) => (
                                            <div key={roomType} className="ml-6 border-l-2 border-green-200 pl-6">
                                              <div 
                                                className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 p-3 rounded-lg transition-all duration-300 group"
                                                onClick={() => toggleRoom(fid, `${year}年${month}月${day}日`, roomType)}
                                              >
                                                <div className="flex items-center space-x-3">
                                                  <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                                                    <Home className="w-3.5 h-3.5 text-white" />
                                                  </div>
                                                  <h5 className="text-sm font-medium text-gray-600">
                                                    {roomType}
                                                  </h5>
                                                </div>
                                                <ChevronRight 
                                                  className={`h-4 w-4 text-gray-400 transition-all duration-300 group-hover:text-purple-600 ${
                                                    expandedRooms.has(`${fid}-${year}年${month}月${day}日-${roomType}`) ? 'rotate-90' : ''
                                                  }`}
                                                />
                                              </div>
                                              
                                              {/* Before/After Level */}
                                              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                                expandedRooms.has(`${fid}-${year}年${month}月${day}日-${roomType}`) ? 'max-h-screen opacity-100 mt-3' : 'max-h-0 opacity-0'
                                              }`}>
                                                <div className="space-y-3">
                                                  {Object.entries(roomData).map(([beforeAfter, images]: [string, any]) => (
                                                    <div key={beforeAfter} className="ml-6 border-l-2 border-purple-200 pl-6">
                                                      <div 
                                                        className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 p-3 rounded-lg transition-all duration-300 group"
                                                        onClick={() => toggleBeforeAfter(fid, `${year}年${month}月${day}日`, roomType, beforeAfter)}
                                                      >
                                                        <div className="flex items-center space-x-3">
                                                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm ${
                                                            beforeAfter === 'before' 
                                                              ? 'bg-gradient-to-br from-red-500 to-pink-600' 
                                                              : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                                          }`}>
                                                            {beforeAfter === 'before' ? (
                                                              <Clock className="w-3 w-3" />
                                                            ) : (
                                                              <CheckCircle className="w-3 w-3" />
                                                            )}
                                                          </div>
                                                          <h6 className="text-xs font-bold text-gray-500">
                                                            {beforeAfter === 'before' ? '清掃前' : '清掃後'} ({images.length}枚)
                                                          </h6>
                                                        </div>
                                                        <ChevronRight 
                                                          className={`h-4 w-4 text-gray-400 transition-all duration-300 group-hover:text-orange-600 ${
                                                            expandedBeforeAfter.has(`${fid}-${year}年${month}月${day}日-${roomType}-${beforeAfter}`) ? 'rotate-90' : ''
                                                          }`}
                                                        />
                                                      </div>
                                                      
                                                      {/* Images Level */}
                                                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                                        expandedBeforeAfter.has(`${fid}-${year}年${month}月${day}日-${roomType}-${beforeAfter}`) ? 'max-h-screen opacity-100 mt-3' : 'max-h-0 opacity-0'
                                                      }`}>
                                                        <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm">
                                                          {/* Floating Delete Bar (only when selected) */}
                                                          {selectedImageIds.size > 0 && (
                                                            <div className="sticky top-0 z-10 mb-3 flex items-center justify-between bg-white/80 backdrop-blur rounded-md border border-red-300 px-3 py-2">
                                                              <span className="text-sm text-red-600">{selectedImageIds.size} 枚選択中</span>
                                                              <div className="space-x-2">
                                                                <Button variant="outline" size="sm" onClick={clearSelection} className="border-2 border-gray-300">選択解除</Button>
                                                                <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isDeleting} className="border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white">
                                                                  {isDeleting ? `削除中... ${Math.round(deleteProgress)}%` : '選択削除'}
                                                                </Button>
                                                              </div>
                                                            </div>
                                                          )}
                                                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                            {images.map((img: any, idx: number) => (
                                                                <div key={idx} className="relative group">
                                                                  {/* Selection Checkbox */}
                                                                  <div className="absolute top-2 left-2 z-10">
                                                                    <input
                                                                      type="checkbox"
                                                                      checked={selectedImageIds.has(Number(img.id))}
                                                                      onChange={() => toggleImageSelection(Number(img.id))}
                                                                      className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500"
                                                                    />
                                                                  </div>
                                                                  
                                                                  <img 
                                                                    src={img.url} 
                                                                    alt={`${roomType} - ${beforeAfter}`}
                                                                    className="w-full h-28 object-cover rounded-lg transition-all duration-300 shadow-sm hover:shadow-md hover:opacity-80 hover:scale-105 cursor-pointer"
                                                                    onClick={() => handleImageClickEnhanced(img.url, images.map((i: any) => i.url))}
                                                                  />
                                                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-1 truncate">
                                                                    {img.uploader?.surname || ''}{img.uploader?.mainName ? ` ${img.uploader.mainName}` : ''} ({img.uploader?.userId || ''})
                                                                  </div>
                                                                </div>
                                                              )
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                </Card>
                )
              })
            )}
          </div>
        </div>
      </main>

      {/* Delete Progress Bar */}
      {isDeleting && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-red-500 shadow-lg">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-red-600">
                  画像を削除中... {Math.round(deleteProgress)}%
                </span>
              </div>
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${deleteProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-2xl bg-white border-4 border-blue-600 mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-blue-600">
              <MessageCircle className="h-5 w-5" />
              <span>社内チャット</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-96">
            {/* Chat Users List */}
            <div className="border-r border-gray-200 pr-4">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">連絡先</h4>
              <div className="space-y-2">
                {["本社", "新宿支店", "原宿支店", "本社スタッフ"].map((user) => (
                  <div
                    key={user}
                    className={`p-2 sm:p-3 rounded cursor-pointer text-sm sm:text-base ${
                      selectedChatUser === user ? "bg-blue-100" : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedChatUser(user)}
                  >
                    {user}
                    {messages.some(m => m.sender === user && m.unread) && (
                      <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="md:col-span-2 flex flex-col">
              {selectedChatUser ? (
                <>
                  <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                    {messages
                      .filter(m => m.sender === selectedChatUser || m.sender === "支社社長")
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`p-2 sm:p-3 rounded-lg max-w-xs ${
                            message.sender === "支社社長"
                              ? "bg-blue-500 text-white ml-auto"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          <p className="text-xs sm:text-sm">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">{message.time}</p>
                        </div>
                      ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="メッセージを入力..."
                      className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} className="h-10 sm:h-12 px-3 sm:px-4">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-sm sm:text-base">連絡先を選択してください</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="w-[95vw] max-w-[1200px] sm:!max-w-[1200px] h-[90vh] bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 border-0 shadow-2xl mx-4 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 -mx-6 -mt-6 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">
                    {selectedFacilityName} - レシート管理
                  </DialogTitle>
                  <p className="text-blue-100 text-sm mt-1">Receipt Management System</p>
                </div>
              </div>
              
            </div>
          </DialogHeader>
          {/* Accessible description to satisfy Radix requirement */}
          <DialogDescription className="sr-only" id="receipt-modal-desc">施設のレシートを年・月ごとに管理できます</DialogDescription>
          
          <div className="flex-1 overflow-hidden px-2">
            {!selectedReceiptMonth && (
              <div className="h-full">
                <div className="flex justify-center">
                  {/* Calendar (expanded to match desired rectangle) */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-fit w-full max-w-[600px]">
                    <div className="flex items-center justify-between mb-6">
                      <button
                        className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                        onClick={() => setSelectedReceiptYear((y) => y + 1)}
                        title="翌年へ"
                      >
                        <ChevronUp className="w-6 h-6 text-gray-600" />
                      </button>
                      <div className="text-2xl font-bold text-gray-800">
                        {selectedReceiptYear}年
                      </div>
                      <button
                        className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                        onClick={() => setSelectedReceiptYear((y) => y - 1)}
                        title="前年へ"
                      >
                        <ChevronDown className="w-6 h-6 text-gray-600" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const key = `${selectedReceiptYear}-${String(m).padStart(2,'0')}`
                        const count = receiptsByMonth[key]?.length || 0
                        return (
                          <button
                            key={m}
                            onClick={() => handleReceiptMonthClick(key)}
                            className={`relative rounded-xl border-2 transition-all duration-200 text-center py-5 md:py-6 text-base md:text-lg hover:shadow-md bg-white ${selectedReceiptMonth === key ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-700 hover:border-blue-300'}`}
                          >
                            {count > 0 && (
                              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white text-xs md:text-sm shadow">
                                {count}
                              </span>
                            )}
                            {m}月
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedReceiptMonth && (
              <div className="h-full flex flex-col">
                {/* Month Header */}
                <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-xl border border-gray-200">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedReceiptMonth(null)}
                    className="text-blue-600 hover:bg-blue-100 rounded-xl px-4 py-2"
                  >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    月別表示に戻る
                  </Button>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedFacilityName} - {selectedReceiptMonth.split('-')[1]}月のレシート
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {receiptsByMonth[selectedReceiptMonth]?.length || 0}枚のレシート
                    </p>
                  </div>
                  
                  {/* Upload Button for This Month */}
                  <div>
                    <input
                      ref={monthUploadInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleReceiptUpload(e.target.files)}
                      className="hidden"
                    />
                    
                    {/* Upload Progress Display */}
                    {isUploading && (
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-200"
                            style={{ width: `${receiptUploadProgress}%` }}
                          />
                        </div>
                        <div className="mt-2 text-sm text-gray-600 text-right">{receiptUploadStatus}</div>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => monthUploadInputRef.current?.click()}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      この月に追加
                    </Button>
                  </div>
                </div>

                {/* Receipts Grid with selection and inline delete */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 p-2">
                    {(receiptsByMonth[selectedReceiptMonth] || []).map((receipt: { id: number; url: string }, index: number) => (
                      <div key={receipt.id} className="group relative">
                        {/* Selection checkbox */}
                        <div className="absolute top-2 left-2 z-10">
                          <input
                            type="checkbox"
                            checked={selectedReceiptIds.has(receipt.id)}
                            onChange={() => {
                              const next = new Set(selectedReceiptIds)
                              if (next.has(receipt.id)) next.delete(receipt.id); else next.add(receipt.id)
                              setSelectedReceiptIds(next)
                            }}
                            className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded"
                          />
                        </div>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
                          <div
                            className="relative cursor-pointer"
                            onClick={() => handleImageAlbumClick((receiptsByMonth[selectedReceiptMonth] || []).map(r => r.url), index)}
                          >
                            <img
                              src={receipt.url || "/placeholder.svg"}
                              alt={`レシート ${index + 1}`}
                              className="w-full h-48 object-cover group-hover:brightness-110 transition-all duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                              <div className="flex items-center space-x-2">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm font-medium">クリックして表示</span>
                              </div>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">レシート #{index + 1}</span>
                              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg border-red-200 text-red-600 hover:bg-red-50" onClick={async () => {
                                  const token = localStorage.getItem('auth-token')
                                  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/receipts/${receipt.id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  })
                                  await handleReceiptClick(selectedFacilityId!, selectedFacilityName || selectedFacilityId!)
                                }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Floating batch delete bar */}
                  {selectedReceiptIds.size > 0 && (
                    <div className="sticky bottom-0 z-10 bg-white/90 backdrop-blur border-t border-red-300 p-3 flex items-center justify-between">
                      <span className="text-sm text-red-600">{selectedReceiptIds.size} 枚選択中</span>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedReceiptIds(new Set())} className="border-2 border-gray-300">選択解除</Button>
                        <Button variant="destructive" size="sm" disabled={isReceiptDeleting} className="border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white" onClick={async () => {
                          if (!confirm('選択したレシートを削除します。よろしいですか？')) return
                          setIsReceiptDeleting(true)
                          setReceiptDeleteProgress(0)
                          const token = localStorage.getItem('auth-token')
                          const ids = Array.from(selectedReceiptIds)
                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/receipts/batch-delete`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ receiptIds: ids })
                          })
                          if (!res.ok) {
                            // Fallback: sequential delete with progress
                            let success = 0
                            for (let i = 0; i < ids.length; i++) {
                              const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/receipts/${ids[i]}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
                              if (r.ok) success++
                              setReceiptDeleteProgress(Math.round(((i + 1) / ids.length) * 100))
                            }
                            if (success !== ids.length) alert(`一部削除に失敗しました（成功: ${success} / 失敗: ${ids.length - success}）`)
                          }
                          setIsReceiptDeleting(false)
                          setSelectedReceiptIds(new Set())
                          await handleReceiptClick(selectedFacilityId!, selectedFacilityName || selectedFacilityId!)
                        }}>選択削除</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isImageViewerOpen && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black bg-opacity-95 p-4" onClick={closeImageViewer}>
          <div className="relative z-[10060] w-[90vw] h-[90vh] max-w-7xl max-h-full flex flex-col" onClick={(e)=>e.stopPropagation()}>
            <button
              type="button"
              aria-label="閉じる"
              onClick={closeImageViewer}
              className="absolute top-4 right-4 text-white text-2xl font-bold cursor-pointer hover:text-gray-300 transition-all duration-200 hover:scale-110 z-[10070] bg-black bg-opacity-60 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center shadow-lg pointer-events-auto"
            >
              ×
            </button>
            <div className="flex-1 flex items-center justify-center">
              <img className="max-w-full min-h-full scale-64 object-contain rounded-lg shadow-2xl" src={viewerImages[currentImageIndex] || ""} alt={`画像 ${currentImageIndex+1}`} />
            </div>
            <div className="text-center text-white mt-4 p-4 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg">
              <h3 className="text-lg font-bold font-['Noto_Sans_JP']">画像ビューア</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
