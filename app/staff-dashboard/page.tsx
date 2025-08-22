"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, ChevronLeft, ChevronRight, Camera, Building2, Trash2, Calendar, Home, Clock, CheckCircle, ImageIcon, X, Settings, LogOut, AlertCircle, Search } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { LoadingBar } from "@/components/loading-bar"
import LogoutButton from "@/components/logout-button"
import SecuritySettings from "@/components/security-settings"
import ImageUploadGallery from "@/components/image-upload-gallery"

const roomTypes = [
  "トイレ",
  "洗面台", 
  "洗濯機",
  "お風呂",
  "キッチン",
  "ベッド",
  "リビング",
  "その他",
  "特別清掃"
]

// Guideline image mapping based on room type
const guidelineImageMapping: { [key: string]: string[] } = {
  "トイレ": ["1-1", "1-2", "1-3"],
  "洗面台": ["2-1", "2-2"],
  "洗濯機": ["3-1"],
  "お風呂": ["4-1", "4-2", "4-3"],
  "キッチン": ["5-1", "5-2", "5-3", "5-4", "5-5", "5-6", "5-7"],
  "ベッド": ["6-1", "6-2"],
  "リビング": ["7-1", "7-2", "7-3", "7-4"],
  "その他": ["8-1", "8-2"]
}

// GCS bucket URL
const GCS_BUCKET_URL = "https://storage.googleapis.com/pikapika-cleaning-2025/guidelines"

export default function StaffDashboard() {
  const [facilityId, setFacilityId] = useState("")
  const [step, setStep] = useState(1) // 1: Facility ID, 2: Room Selection & Cleaning
  const [facilities, setFacilities] = useState<Array<{
    facilityId: string;
    facilityName: string;
    clientName: string;
    clientAddress: string;
    hasClient: boolean;
  }>>([])
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  const [facilitySearchTerm, setFacilitySearchTerm] = useState("")
  const [isFacilitySelectOpen, setIsFacilitySelectOpen] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<{
    facilityId: string;
    clientName: string;
    clientAddress: string;
  } | null>(null)
  const [selectedRoomType, setSelectedRoomType] = useState("")
  const [currentSlide, setCurrentSlide] = useState(0)
  const [cleaningState, setCleaningState] = useState<"before" | "after">("before")
  const [beforeImages, setBeforeImages] = useState<File[]>([])
  const [afterImages, setAfterImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Guideline images state
  const [guidelineImages, setGuidelineImages] = useState<string[]>([])
  const [loadingGuidelines, setLoadingGuidelines] = useState(false)
  const [guidelineError, setGuidelineError] = useState("")

  // New state for uploaded images
  const [uploadedImages, setUploadedImages] = useState<any[]>([])
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadMessage, setUploadMessage] = useState("")
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalImageSrc, setModalImageSrc] = useState("")
  const [modalCaption, setModalCaption] = useState("")

  // Past records modal state
  const [showPastRecords, setShowPastRecords] = useState(false)
  const [pastRecords, setPastRecords] = useState<any[]>([])
  const [loadingPastRecords, setLoadingPastRecords] = useState(false)
  const [selectedPastRecord, setSelectedPastRecord] = useState<any>(null)

  // Enhanced past records state
  const [expandedFacilities, setExpandedFacilities] = useState<Set<string>>(new Set())
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [expandedBeforeAfter, setExpandedBeforeAfter] = useState<Set<string>>(new Set())
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [lazyLoadedImages, setLazyLoadedImages] = useState<{[key: string]: any[]}>({})
  const [deleteProgress, setDeleteProgress] = useState<{completed:number,total:number}>({completed:0,total:0})

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Long-press functionality state
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isLongPressMode, setIsLongPressMode] = useState(false)
  const [longPressedImageId, setLongPressedImageId] = useState<number | null>(null)

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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'}/api/auth/verify`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!res.ok) {
          // Token is invalid, redirect to login
          localStorage.removeItem('auth-token')
          window.location.href = '/'
          return
        }
        
        // Token is valid, set authenticated and fetch data
        setIsAuthenticated(true)
        await fetchUploadedImages()
        await fetchFacilities()
      } catch (error) {
        console.error('Authentication error:', error)
        localStorage.removeItem('auth-token')
        setIsAuthenticated(false)
        window.location.href = '/'
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuthAndFetchData()
  }, [])

  // Load guideline images when room type changes
  useEffect(() => {
    if (selectedRoomType && selectedRoomType !== "特別清掃") {
      loadGuidelineImages(selectedRoomType)
    } else {
      setGuidelineImages([])
      setGuidelineError("")
    }
  }, [selectedRoomType])

  // Click outside handler for facility dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('#facilityId') && !target.closest('.facility-dropdown')) {
        setIsFacilitySelectOpen(false)
      }
    }

    if (isFacilitySelectOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFacilitySelectOpen])



  // Load guideline images from GCS based on room type
  const loadGuidelineImages = async (roomType: string) => {
    setLoadingGuidelines(true)
    setGuidelineError("")
    
    try {
      const imageNames = guidelineImageMapping[roomType]
      if (!imageNames) {
        setGuidelineError(`${roomType}のガイドライン画像が見つかりません`)
        setGuidelineImages([])
        return
      }

      // Create full GCS URLs for each image
      const imageUrls = imageNames.map(name => `${GCS_BUCKET_URL}/${name}.png`)
      console.log('🔍 Loading guideline images for:', roomType)
      console.log('📁 Image names:', imageNames)
      console.log('🌐 Image URLs:', imageUrls)
      
      setGuidelineImages(imageUrls)
      setCurrentSlide(0)
      
    } catch (error) {
      console.error('Error loading guideline images:', error)
      setGuidelineError('ガイドライン画像の読み込みに失敗しました')
      setGuidelineImages([])
    } finally {
      setLoadingGuidelines(false)
    }
  }

  // Fetch staff's uploaded images (handle new grouped structure)
  const fetchUploadedImages = async () => {
    const token = localStorage.getItem('auth-token')
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'}/api/auth/cleaning-images`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      console.log('📊 Backend response data:', data)
      
      // Handle the new grouped structure from backend
      if (data.success && data.images) {
        // Flatten the grouped images structure
        const flatImages: any[] = []
        Object.values(data.images).forEach((facility: any) => {
          Object.values(facility).forEach((date: any) => {
            Object.values(date).forEach((room: any) => {
              Object.values(room).forEach((beforeAfter: any) => {
                beforeAfter.forEach((image: any) => {
                  flatImages.push({
                    id: image.id,
                    companyId: image.facility?.company?.companyId,
                    facilityId: image.facility?.facilityId,
                    recordId: image.recordId,
                    roomType: image.roomType,
                    beforeAfter: image.beforeAfter,
                    url: image.gcsUrl,
                    uploadedAt: image.uploadedAt,
                    updatedAt: image.updatedAt
                  })
                })
              })
            })
          })
        })
        
        // Sort by latest updated
        flatImages.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        setUploadedImages(flatImages)
      } else {
        // Fallback for old structure or empty data
        setUploadedImages([])
      }
    }
  }

  // Fetch facilities with client information
  const fetchFacilities = async () => {
    setLoadingFacilities(true)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'}/api/auth/facilities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.facilities) {
          setFacilities(data.facilities)
        } else {
          setFacilities([])
        }
      } else {
        console.error('Failed to fetch facilities:', res.statusText)
        setFacilities([])
      }
    } catch (error) {
      console.error('Error fetching facilities:', error)
      setFacilities([])
    } finally {
      setLoadingFacilities(false)
    }
  }

  // Fetch past records for the current staff member
  const fetchPastRecords = async () => {
    setLoadingPastRecords(true)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'}/api/auth/cleaning-images/staff-records`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.records) {
          setPastRecords(data.records)
        } else {
          setPastRecords([])
        }
      } else {
        setPastRecords([])
      }
    } catch (error) {
      console.error('Error fetching past records:', error)
      setPastRecords([])
    } finally {
      setLoadingPastRecords(false)
    }
  }

  // Accordion navigation helpers
  const toggleFacility = (facilityId: string) => {
    const newExpanded = new Set(expandedFacilities)
    if (newExpanded.has(facilityId)) {
      newExpanded.delete(facilityId)
      // Collapse all child items
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
      // Collapse child items
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

  // Multi-select helpers
  const toggleImageSelection = (imageId: number) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId)
    } else {
      newSelected.add(imageId)
    }
    setSelectedImages(newSelected)
  }

  const selectAllImages = (images: any[]) => {
    const imageIds = images.map(img => img.id)
    setSelectedImages(new Set(imageIds))
  }

  const clearImageSelection = () => {
    setSelectedImages(new Set())
  }

  // Long-press handlers
  const handleImageMouseDown = (imageId: number) => {
    const timer = setTimeout(() => {
      setIsLongPressMode(true)
      setLongPressedImageId(imageId)
      toggleImageSelection(imageId)
    }, 500) // 0.5 seconds
    setLongPressTimer(timer)
  }

  const handleImageMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleImageMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleImageClick = (imageId: number, imageUrl: string, title: string) => {
    if (!isLongPressMode) {
      openModal(imageUrl, title)
    }
    setIsLongPressMode(false)
    setLongPressedImageId(null)
  }

  // Touch handlers for mobile
  const handleImageTouchStart = (imageId: number) => {
    const timer = setTimeout(() => {
      setIsLongPressMode(true)
      setLongPressedImageId(imageId)
      toggleImageSelection(imageId)
    }, 500) // 0.5 seconds
    setLongPressTimer(timer)
  }

  const handleImageTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleImageTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // Batch delete functionality
  const handleBatchDelete = async () => {
    if (selectedImages.size === 0) return
    
    const confirmMessage = `選択された${selectedImages.size}枚の画像を削除しますか？この操作は取り消せません。`
    if (!confirm(confirmMessage)) return
    
    setIsDeleting(true)
    setDeleteProgress({completed:0,total:selectedImages.size})
    try {
      const token = localStorage.getItem('auth-token')

      // Use batch delete endpoint for better performance
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'}/api/auth/cleaning-images/batch`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageIds: Array.from(selectedImages)
        })
      })

      if (!response.ok) {
        // Fallback to sequential delete with progress
        const ids = Array.from(selectedImages)
        for (let i = 0; i < ids.length; i++) {
          const id = ids[i]
          const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'}/api/auth/cleaning-images/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
          // advance progress even if a single delete fails; UI shows completion
          setDeleteProgress({completed:i+1,total:ids.length})
        }
      } else {
        const result = await response.json()
        console.log(`✅ Successfully deleted ${result.deletedCount} images`)
      }
      
      // Refresh the data and clear selection
      await fetchPastRecords()
      clearImageSelection()
    } catch (error) {
      console.error('Batch delete error:', error)
      alert(`画像の削除中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
      setDeleteProgress({completed:0,total:0})
    }
  }

  useEffect(() => { fetchUploadedImages() }, [])

  // Fetch uploaded images for the current cleaning record
  const fetchUploadedImagesForRecord = useCallback(async (recId: string) => {
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'}/api/auth/cleaning-records/${recId}/images`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        // This state is no longer needed as images are managed by uploadedImages
        // setUploadedBeforeImages(data.before_images || [])
        // setUploadedAfterImages(data.after_images || [])
      }
    } catch (e) { /* ignore */ }
  }, [])

  // When recordId changes, fetch images
  useEffect(() => {
    // This useEffect is no longer needed as images are managed by uploadedImages
    // if (recordId) fetchUploadedImages(recordId)
  }, [])

  const handleFacilitySubmit = () => {
    if (facilityId.trim()) {
      setStep(2)
    }
  }

  // Upload handlers for the new ImageUploadGallery component
  const handleBeforeImagesUpload = async (files: File[]) => {
    setBeforeImages(files)
    await uploadImages('before', files)
  }

  const handleAfterImagesUpload = async (files: File[]) => {
    setAfterImages(files)
    await uploadImages('after', files)
  }

  const nextSlide = () => {
    if (currentSlide < guidelineImages.length - 1) {
      const newIndex = currentSlide + 1
      setCurrentSlide(newIndex)
      // Scroll to the new image
      setTimeout(() => {
        const targetImage = document.querySelector(`[data-image-index="${newIndex}"]`)
        if (targetImage) {
          targetImage.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          })
        }
      }, 100)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      const newIndex = currentSlide - 1
      setCurrentSlide(newIndex)
      // Scroll to the new image
      setTimeout(() => {
        const targetImage = document.querySelector(`[data-image-index="${newIndex}"]`)
        if (targetImage) {
          targetImage.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          })
        }
      }, 100)
    }
  }

  const handleRoomTypeChange = (value: string) => {
    setSelectedRoomType(value)
    setCurrentSlide(0)
  }

  // Modal functions
  const openModal = (imageSrc: string, caption: string) => {
    console.log('Opening modal with:', { imageSrc, caption })
    setModalImageSrc(imageSrc)
    setModalCaption(caption)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    console.log('Closing modal')
    setIsModalOpen(false)
  }

  // Remove canSubmit logic - Report button appears immediately when images are selected
  // const canSubmit = !!selectedRoomType && !!facilityId.trim() && (
  //   (cleaningState === "before" && beforeImages.length > 0) || 
  //   (cleaningState === "after" && afterImages.length > 0) ||
  //   (beforeImages.length > 0 && afterImages.length > 0)
  // )

  // Callback for handling image selection changes
  const handleImagesChange = useCallback((files: File[]) => {
    if (cleaningState === "before") {
      setBeforeImages(files)
    } else {
      setAfterImages(files)
    }
  }, [cleaningState])

  // Helper to get real record and facility DB ids
  const getCleaningRecord = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const token = localStorage.getItem('auth-token')
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'}/api/auth/cleaning-records/find-or-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ facilityId, roomType: selectedRoomType, cleaningDate: today })
    })
    if (!res.ok) throw new Error('Failed to find or create record')
    const data = await res.json()
    return { recordId: String(data.recordId), facilityDbId: String(data.facilityDbId) }
  }

  // Upload images to backend (simplified direct upload)
  const uploadImages = async (type: 'before' | 'after', files: File[]) => {
    setUploadProgress(0)
    setUploadMessage('画像をアップロード中...')
    try {
      // Basic client-side size validation (<10MB)
      const tenMB = 10 * 1024 * 1024
      const validFiles = files.filter(f => f.size <= tenMB)
      if (validFiles.length !== files.length) {
        console.warn('Some files exceeded 10MB and were skipped')
      }
      
      const { recordId, facilityDbId } = await getCleaningRecord()
      const token = localStorage.getItem('auth-token')
      const startTime = Date.now()
      let totalBytesUploaded = 0
      let totalBytes = validFiles.reduce((sum, file) => sum + file.size, 0)
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        
        // Check file type (JPG, PNG only)
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
          console.warn(`Skipping ${file.name} - only JPG and PNG files are allowed`)
          continue
        }
        
        // Create FormData for direct upload
        const formData = new FormData()
        formData.append('image', file)
        formData.append('facilityId', facilityDbId)
        formData.append('recordId', recordId)
        formData.append('roomType', selectedRoomType)
        formData.append('beforeAfter', type)
        
        // Upload with progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'}/api/auth/cleaning-images/upload`)
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              // Calculate progress based on actual bytes uploaded
              const fileProgress = e.loaded / e.total
              const overallProgress = ((totalBytesUploaded + (fileProgress * file.size)) / totalBytes) * 100
              const percent = Math.round(overallProgress)
              
              setUploadProgress(percent)
              
              // Calculate ETA
              const elapsed = (Date.now() - startTime) / 1000
              const uploadSpeed = (totalBytesUploaded + e.loaded) / elapsed // bytes per second
              const remainingBytes = totalBytes - (totalBytesUploaded + e.loaded)
              const eta = uploadSpeed > 0 ? Math.round(remainingBytes / uploadSpeed) : 0
              
              setUploadMessage(`画像をアップロード中... ${percent}% `)
            }
          }
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              totalBytesUploaded += file.size
              resolve()
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
          
          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.send(formData)
        })
        
        console.log(`✅ Image uploaded successfully: ${file.name}`)
      }
      
      setUploadMessage('アップロード完了')
      fetchUploadedImages()
      fetchPastRecords() // Refresh previous images
      
    } catch (e: any) {
      console.error('Upload error:', e)
      setUploadMessage(`アップロード失敗: ${e.message || 'Unknown error'}`)
    } finally {
      setUploadProgress(null)
      setTimeout(() => setUploadMessage(''), 2000)
    }
  }

  // Delete image
  const handleDeleteImage = async (imageId: number) => {
    const token = localStorage.getItem('auth-token')
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'}/api/auth/cleaning-images/${imageId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchUploadedImages()
  }

  // Replace image
  const handleReplaceImage = async (imageId: number, file: File) => {
    const token = localStorage.getItem('auth-token')
    const formData = new FormData()
    formData.append('image', file)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'}/api/auth/cleaning-images/${imageId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    fetchUploadedImages()
  }

  // Handle submit - Uploads images and triggers LINE notifications
  const handleSubmit = async () => {
    if (!selectedRoomType) {
      alert('部屋タイプを選択してください')
      return
    }
    if (!facilityId.trim()) {
      alert('施設IDを入力してください')
      return
    }
    if (beforeImages.length === 0 && afterImages.length === 0) {
      alert('写真を選択してください')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Upload all selected images
      if (cleaningState === 'before' && beforeImages.length > 0) {
        await uploadImages('before', beforeImages)
      } else if (cleaningState === 'after' && afterImages.length > 0) {
        await uploadImages('after', afterImages)
      } else if (beforeImages.length > 0 && afterImages.length > 0) {
        await uploadImages('before', beforeImages)
        await uploadImages('after', afterImages)
      }
      
      // Clear images after successful upload
      setBeforeImages([])
      setAfterImages([])
      
      // Show success message
      alert('レポートが正常に送信されました！')
      
    } catch (error) {
      console.error('Submit failed:', error)
      alert('レポートの送信に失敗しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slideInFromRight 0.3s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out;
        }
        
        .accordion-content {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .image-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .image-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
      `}</style>
      <LoadingBar 
        isLoading={isSubmitting || uploadProgress !== null} 
        message={uploadProgress !== null ? uploadMessage : isSubmitting ? 'アップロード中...' : ''} 
      />

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b-2 border-green-600">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 transition-colors text-green-600 font-medium">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-japanese">戻る</span>
            </Link>
            <div className="flex items-center space-x-4">
              <h1 className="text-xl sm:text-2xl font-bold text-orange-600 font-japanese">スタッフダッシュボード</h1>
              {/* Removed LINE Settings button */}
              <SecuritySettings />
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-gray-700 font-japanese text-base sm:text-lg px-4">
              {step === 1 ? "施設IDを入力してください" : "部屋タイプを選択して清掃ガイドを確認し、写真を選択してからReportボタンで一括送信してください"}
            </p>
          </div>

          {step === 1 && (
            <Card className="bg-white shadow-xl max-w-2xl mx-4 sm:mx-auto border-2 border-green-600">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-600 font-japanese font-bold">
                  <Building2 className="h-5 w-5" />
                  <span>施設ID入力</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="facilityId" className="text-base font-medium text-green-600 font-japanese">施設ID *</Label>
                  <div className="relative">
                    <Input
                      id="facilityId"
                      type="text"
                      value={facilitySearchTerm}
                      onChange={(e) => setFacilitySearchTerm(e.target.value)}
                      onFocus={() => setIsFacilitySelectOpen(true)}
                      placeholder="施設IDを検索してください"
                      className="h-12 text-base border-2 border-gray-300 focus:border-green-500 font-japanese pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  </div>
                  
                  {/* Searchable Facility Dropdown */}
                  {isFacilitySelectOpen && (
                    <div className="facility-dropdown absolute z-50 w-max mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {loadingFacilities ? (
                        <div className="p-4 text-center text-gray-500">読み込み中...</div>
                      ) : facilities.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">施設が見つかりません</div>
                      ) : (
                        facilities
                          .filter(facility => 
                            facility.facilityId.toLowerCase().includes(facilitySearchTerm.toLowerCase()) ||
                            facility.clientName.toLowerCase().includes(facilitySearchTerm.toLowerCase())
                          )
                          .map((facility) => (
                            <div
                              key={facility.facilityId}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setFacilityId(facility.facilityId)
                                setFacilitySearchTerm(facility.facilityId)
                                setSelectedFacility({
                                  facilityId: facility.facilityId,
                                  clientName: facility.clientName,
                                  clientAddress: facility.clientAddress
                                })
                                setIsFacilitySelectOpen(false)
                              }}
                            >
                              <div className="font-medium text-gray-900">{facility.facilityId}</div>
                              {facility.hasClient && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <div>{facility.clientName}</div>
                                  <div>{facility.clientAddress}</div>
                                </div>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  )}
                  
                  {/* Selected Facility Client Information */}
                  {selectedFacility && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-1">選択された施設の情報</div>
                      <div className="text-sm text-gray-600">
                        <div className="mb-1">
                          <span className="font-medium">クライアント名:</span> {selectedFacility.clientName}
                        </div>
                        <div>
                          <span className="font-medium">住所:</span> {selectedFacility.clientAddress}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500 mt-2 font-japanese">
                    施設IDを検索して選択してください
                  </p>
                </div>
                <Button
                  onClick={handleFacilitySubmit}
                  disabled={!facilityId.trim() || loadingFacilities}
                  className="w-full h-16 text-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-green-600 font-japanese"
                >
                  {loadingFacilities ? '読み込み中...' : '次へ進む'}
                </Button>
                <Button
                  onClick={() => {
                    fetchPastRecords()
                    setShowPastRecords(true)
                  }}
                  className="w-full h-12 text-lg font-medium text-green-600 border-2 border-green-600 hover:bg-green-50 transition-all duration-300 font-japanese group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <ImageIcon className="w-3 h-3 text-white" />
                    </div>
                    <span>過去の記録を表示</span>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <>
              {/* Facility Info */}
              <Card className="bg-white shadow-xl mb-6 sm:mb-8 border-2 border-green-600 mx-4 sm:mx-0">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-orange-600 font-japanese font-bold text-lg sm:text-xl">
                      施設ID: {facilityId}
                    </CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="border-2 border-gray-300 font-japanese w-full sm:w-auto"
                    >
                      施設変更
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Room Type Selection */}
              <Card className="bg-white shadow-xl mb-6 sm:mb-8 border-2 border-green-600 mx-4 sm:mx-0">
                <CardHeader>
                  <CardTitle className="text-orange-600 font-['Noto_Sans_JP'] font-bold text-lg sm:text-xl">部屋タイプ選択</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedRoomType} onValueChange={handleRoomTypeChange}>
                    <SelectTrigger className="h-12 text-base border-2 border-gray-300 font-['Noto_Sans_JP']">
                      <SelectValue placeholder="清掃する部屋タイプを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((roomType) => (
                        <SelectItem key={roomType} value={roomType} className="text-base font-['Noto_Sans_JP']">
                          {roomType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {selectedRoomType && (
                <>
                  {/* Cleaning Guide Horizontal Gallery */}
                  <Card className="bg-white shadow-lg mb-6 sm:mb-8 border-2 border-green-600 mx-4 sm:mx-0">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <CardTitle className="text-orange-600 font-['Noto_Sans_JP'] font-bold text-lg sm:text-xl">
                        清掃ガイド - {selectedRoomType}
                      </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingGuidelines ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                          <p className="text-gray-500 font-['Noto_Sans_JP']">ガイドラインを読み込み中...</p>
                        </div>
                      ) : guidelineError ? (
                        <div className="text-center py-8">
                          <p className="text-red-500 font-['Noto_Sans_JP']">{guidelineError}</p>
                          {selectedRoomType === "特別清掃" && (
                            <p className="text-gray-600 font-['Noto_Sans_JP'] mt-2">特別清掃にはガイドライン画像がありません</p>
                          )}
                        </div>
                      ) : guidelineImages.length > 0 ? (
                        <div>
                          {/* Navigation Controls */}
                          <div className="flex items-center justify-between mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={prevSlide}
                              disabled={currentSlide === 0}
                              className="border-2 border-gray-300 font-['Noto_Sans_JP'] text-xs sm:text-sm"
                            >
                              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden sm:inline">前へ</span>
                            </Button>
                            <span className="text-xs sm:text-sm text-gray-600 font-['Noto_Sans_JP']">
                              {currentSlide + 1} / {guidelineImages.length}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={nextSlide}
                              disabled={currentSlide === guidelineImages.length - 1}
                              className="border-2 border-gray-300 font-['Noto_Sans_JP'] text-xs sm:text-sm"
                            >
                              <span className="hidden sm:inline">次へ</span>
                              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                            </Button>
                          </div>

                          {/* Current Step Info */}
                          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-green-600 font-['Noto_Sans_JP']">
                              ステップ {currentSlide + 1}
                            </h3>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-['Noto_Sans_JP']">
                              {selectedRoomType}の清掃ガイドライン - ステップ {currentSlide + 1}
                            </p>
                          </div>

                          {/* Horizontal Image Gallery */}
                          <div className="relative">
                            <div className="flex overflow-x-scroll gap-4 pb-4 guidelines-gallery">
                              {guidelineImages.map((imageUrl, index) => {
                                const imageName = guidelineImageMapping[selectedRoomType]?.[index] || `step-${index + 1}`
                                console.log(`🖼️ Rendering image ${index + 1}:`, imageUrl)
                                return (
                                  <div
                                    key={index}
                                   data-image-index={index}
                                   className={`flex-shrink-0 w-80 sm:w-96 lg:w-[500px] transition-all duration-300 ${
                                     index === currentSlide ? 'ring-4 ring-green-500' : 'ring-2 ring-gray-200'
                                   }`}
                                 >
                                   <div className="relative">
                                     <img
                                        src={imageUrl}
                                        alt={`${selectedRoomType} - ステップ ${index + 1}`}
                                       className="w-full h-80 object-cover rounded-lg cursor-pointer hover:opacity-70 transition-opacity duration-300"
                                        onClick={() => openModal(imageUrl, `${selectedRoomType} - ステップ ${index + 1}`)}
                                       onError={(e) => {
                                         const target = e.target as HTMLImageElement
                                         target.src = '/placeholder.svg?height=320&width=400&text=画像を読み込めません'
                                          console.error('Failed to load image:', imageUrl)
                                       }}
                                       onLoad={() => {
                                          console.log('Image loaded successfully:', imageUrl)
                                       }}
                                     />
                                     <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-sm font-bold">
                                        ステップ {index + 1}
                                     </div>
                                   </div>
                                   <div className="mt-2 p-2 bg-gray-50 rounded">
                                     <p className="text-sm font-medium text-gray-800 font-['Noto_Sans_JP'] truncate">
                                        {selectedRoomType} - ステップ {index + 1}
                                     </p>
                                   </div>
                                 </div>
                                )
                              })}
                            </div>
                            
                            {/* Scroll Indicators */}
                            {guidelineImages.length > 3 && (
                              <div className="flex justify-center mt-3 sm:mt-4 space-x-1 sm:space-x-2">
                                {guidelineImages.map((_, index) => (
                               <button
                                 key={index}
                                 onClick={() => {
                                   setCurrentSlide(index)
                                   // Scroll to the selected image
                                   const imageContainer = document.querySelector('.guidelines-gallery')
                                   const targetImage = document.querySelector(`[data-image-index="${index}"]`)
                                   if (imageContainer && targetImage) {
                                     targetImage.scrollIntoView({
                                       behavior: 'smooth',
                                       block: 'nearest',
                                       inline: 'center'
                                     })
                                   }
                                 }}
                                 className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
                                   index === currentSlide ? 'bg-green-600' : 'bg-gray-300'
                                 }`}
                               />
                             ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 font-['Noto_Sans_JP']">ガイドラインが見つかりません</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Cleaning State Toggle */}
                  <Card className="bg-white shadow-lg mb-6 sm:mb-8 border-4 border-blue-300 mx-4 sm:mx-0">
                    <CardHeader>
                      <CardTitle className="text-orange-600 font-['Noto_Sans_JP'] font-bold text-lg sm:text-xl">清掃状態選択</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <Button
                          variant={cleaningState === "before" ? "default" : "outline"}
                          onClick={() => setCleaningState("before")}
                          className={`flex-1 h-12 text-base sm:text-lg font-medium border-2 font-['Noto_Sans_JP'] ${
                            cleaningState === "before" 
                              ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                              : "border-red-500 text-red-500 hover:bg-red-50"
                          }`}
                        >
                          清掃前
                        </Button>
                        <Button
                          variant={cleaningState === "after" ? "default" : "outline"}
                          onClick={() => setCleaningState("after")}
                          className={`flex-1 h-12 text-base sm:text-lg font-medium border-2 font-['Noto_Sans_JP'] ${
                            cleaningState === "after" 
                              ? "bg-green-500 hover:bg-green-600 text-white border-green-500" 
                              : "border-green-500 text-green-500 hover:bg-green-50"
                          }`}
                        >
                          清掃後
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Image Upload Section */}
                  <ImageUploadGallery
                    onImagesChange={handleImagesChange}
                    title={`${cleaningState === "before" ? "清掃前" : "清掃後"}写真選択`}
                    description="複数の写真を選択できます（Reportボタンで一括アップロード）"
                    maxFiles={10}
                    className="mx-4 sm:mx-0"
                  />

                  {/* Status Summary */}
                  <Card className="bg-white shadow-lg mb-8 border-2 border-green-500">
                    <CardHeader>
                      <CardTitle className="text-orange-600 font-['Noto_Sans_JP'] font-bold">写真選択状況</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: beforeImages.length > 0 ? '#f0fff4' : '#fef8e6' }}>
                          <h4 className="font-semibold mb-2 text-green-600 font-['Noto_Sans_JP']">清掃前</h4>
                          <p className="text-2xl font-bold font-['Noto_Sans_JP']" style={{ color: beforeImages.length > 0 ? '#04c755' : '#ea5420' }}>
                            {beforeImages.length}枚
                          </p>
                        </div>
                        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: afterImages.length > 0 ? '#f0fff4' : '#fef8e6' }}>
                          <h4 className="font-semibold mb-2 text-green-500 font-['Noto_Sans_JP']">清掃後</h4>
                          <p className="text-2xl font-bold font-['Noto_Sans_JP']" style={{ color: afterImages.length > 0 ? '#04c755' : '#ea5420' }}>
                            {afterImages.length}枚
                          </p>
                        </div>
                      </div>
                      
                    </CardContent>
                  </Card>

                  {/* Removed: Uploaded Images Management Section (now accessible from first page) */}

                  {/* Submit Button with Loading - Handles both image upload and LINE notifications */}
                  <div className="text-center mx-4 sm:mx-0">
                    {/* Show Report button immediately when images are selected */}
                    {(beforeImages.length > 0 || afterImages.length > 0) && (
                      <Button
                        size="lg"
                        className="h-12 sm:h-14 px-8 sm:px-12 text-base sm:text-lg font-medium text-white font-['Noto_Sans_JP'] w-full sm:w-auto bg-green-500 hover:bg-green-600"
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>送信中...</span>
                          </div>
                        ) : (
                          <>
                            {beforeImages.length > 0 && afterImages.length > 0 
                              ? "完全レポート送信（画像アップロード）" 
                              : cleaningState === "before" 
                                ? "清掃開始レポート送信（画像アップロード）" 
                                : "清掃完了レポート送信（画像アップロード）"
                            }
                          </>
                        )}
                      </Button>
                    )}
                    
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Image Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[10050] flex items-center justify-center bg-black bg-opacity-95 p-4 animate-in fade-in duration-300"
          onClick={closeModal}
        >
          <div 
            className="relative z-[10060] w-[90vw] h-[90vh] max-w-7xl max-h-full flex flex-col animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 right-4 text-white text-2xl font-bold cursor-pointer hover:text-gray-300 transition-all duration-200 hover:scale-110 z-10 bg-black bg-opacity-60 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
              onClick={closeModal}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex-1 flex items-center justify-center">
              <img 
                className="max-w-full min-h-full scale-72 object-contain rounded-lg shadow-2xl"
                src={modalImageSrc}
                alt={modalCaption}
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder.svg?height=400&width=600&text=画像を読み込めません'
                }}
              />
            </div>
            <div className="text-center text-white mt-4 p-4 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg">
              <h3 className="text-lg font-bold font-['Noto_Sans_JP']">{modalCaption}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Past Records Modal */}
      {showPastRecords && (
        <div 
          className="fixed inset-0 z-[9990] flex items-center justify-center bg-black bg-opacity-90 p-4 animate-in fade-in duration-300"
          onClick={() => setShowPastRecords(false)}
        >
          <div 
            className="relative z-[10000] w-[95vw] h-[95vh] max-w-7xl max-h-full flex flex-col bg-white rounded-lg shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-xl font-bold text-gray-800 font-['Noto_Sans_JP']">
                過去の記録 - 自分のアップロード画像
              </h2>
              <div className="flex items-center space-x-4">
                {selectedImages.size > 0 && (
                  <div className="flex items-center space-x-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 animate-in slide-in-from-right duration-200">
                    <span className="text-sm text-red-700 font-['Noto_Sans_JP'] font-medium">
                      {selectedImages.size}枚選択中
                    </span>
                    {isDeleting && (
                      <span className="text-xs text-red-600">{deleteProgress.completed}/{deleteProgress.total}</span>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBatchDelete}
                      disabled={isDeleting}
                      className="font-['Noto_Sans_JP'] bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-sm"
                    >
                      {isDeleting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>削除中... {deleteProgress.total ? Math.round((deleteProgress.completed/deleteProgress.total)*100) : 0}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Trash2 className="w-4 h-4" />
                          <span>選択削除</span>
                        </div>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearImageSelection}
                      className="font-['Noto_Sans_JP'] border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200"
                    >
                      選択解除
                    </Button>
                  </div>
                )}
                {isLongPressMode && (
                  <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-700 font-['Noto_Sans_JP']">長押しモード</span>
                  </div>
                )}
                <button 
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer transition-all duration-200 hover:scale-110 p-2 rounded-full hover:bg-gray-100"
                  onClick={() => setShowPastRecords(false)}
                >
                  &times;
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white">
              {loadingPastRecords ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-6"></div>
                  <p className="text-gray-500 font-['Noto_Sans_JP'] text-lg">記録を読み込み中...</p>
                </div>
              ) : pastRecords.length > 0 ? (
                <div className="space-y-6">
                  {pastRecords.map((facility) => (
                    <div key={facility.facilityId} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-all duration-300">
                      {/* Facility Level */}
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 p-4 rounded-lg transition-all duration-300 group"
                        onClick={() => toggleFacility(facility.facilityId)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 font-['Noto_Sans_JP']">
                            施設: {facility.facilityId}
                          </h3>
                        </div>
                        <ChevronRight 
                          className={`h-6 w-6 text-gray-400 transition-all duration-300 group-hover:text-blue-600 ${
                            expandedFacilities.has(facility.facilityId) ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                      
                      {/* Date Level */}
                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        expandedFacilities.has(facility.facilityId) ? 'max-h-screen opacity-100 mt-4' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="space-y-3">
                          {Object.entries(facility.dates).map(([date, dateData]: [string, any]) => (
                            <div key={date} className="ml-6 border-l-2 border-blue-200 pl-6">
                              <div 
                                className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 p-3 rounded-lg transition-all duration-300 group"
                                onClick={() => toggleDate(facility.facilityId, date)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <Calendar className="w-4 h-4 text-white" />
                                  </div>
                                  <h4 className="text-md font-semibold text-gray-700 font-['Noto_Sans_JP']">
                                    {date}
                                  </h4>
                                </div>
                                <ChevronRight 
                                  className={`h-5 w-5 text-gray-400 transition-all duration-300 group-hover:text-green-600 ${
                                    expandedDates.has(`${facility.facilityId}-${date}`) ? 'rotate-90' : ''
                                  }`}
                                />
                              </div>
                              
                              {/* Room Level */}
                              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                expandedDates.has(`${facility.facilityId}-${date}`) ? 'max-h-screen opacity-100 mt-3' : 'max-h-0 opacity-0'
                              }`}>
                                <div className="space-y-3">
                                  {Object.entries(dateData.rooms).map(([roomType, roomData]: [string, any]) => (
                                    <div key={roomType} className="ml-6 border-l-2 border-green-200 pl-6">
                                      <div 
                                        className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 p-3 rounded-lg transition-all duration-300 group"
                                        onClick={() => toggleRoom(facility.facilityId, date, roomType)}
                                      >
                                        <div className="flex items-center space-x-3">
                                          <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                                            <Home className="w-3.5 h-3.5 text-white" />
                                          </div>
                                          <h5 className="text-sm font-medium text-gray-600 font-['Noto_Sans_JP']">
                                            {roomType}
                                          </h5>
                                        </div>
                                        <ChevronRight 
                                          className={`h-4 w-4 text-gray-400 transition-all duration-300 group-hover:text-purple-600 ${
                                            expandedRooms.has(`${facility.facilityId}-${date}-${roomType}`) ? 'rotate-90' : ''
                                          }`}
                                        />
                                      </div>
                                      
                                      {/* Before/After Level */}
                                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                        expandedRooms.has(`${facility.facilityId}-${date}-${roomType}`) ? 'max-h-screen opacity-100 mt-3' : 'max-h-0 opacity-0'
                                      }`}>
                                        <div className="space-y-3">
                                          {Object.entries(roomData).map(([beforeAfter, images]: [string, any]) => (
                                            <div key={beforeAfter} className="ml-6 border-l-2 border-purple-200 pl-6">
                                              <div 
                                                className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 p-3 rounded-lg transition-all duration-300 group"
                                                onClick={() => toggleBeforeAfter(facility.facilityId, date, roomType, beforeAfter)}
                                              >
                                                <div className="flex items-center space-x-3">
                                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm ${
                                                    beforeAfter === 'before' 
                                                      ? 'bg-gradient-to-br from-red-500 to-pink-600' 
                                                      : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                                  }`}>
                                                    {beforeAfter === 'before' ? (
                                                      <Clock className="w-3 h-3 text-white" />
                                                    ) : (
                                                      <CheckCircle className="w-3 h-3 text-white" />
                                                    )}
                                                  </div>
                                                  <h6 className="text-xs font-bold text-gray-500 font-['Noto_Sans_JP']">
                                                    {beforeAfter === 'before' ? '清掃前' : '清掃後'} ({images.length}枚)
                                                  </h6>
                                                </div>
                                                <ChevronRight 
                                                  className={`h-4 w-4 text-gray-400 transition-all duration-300 group-hover:text-orange-600 ${
                                                    expandedBeforeAfter.has(`${facility.facilityId}-${date}-${roomType}-${beforeAfter}`) ? 'rotate-90' : ''
                                                  }`}
                                                />
                                              </div>
                                              
                                              {/* Images Level */}
                                              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                                expandedBeforeAfter.has(`${facility.facilityId}-${date}-${roomType}-${beforeAfter}`) ? 'max-h-screen opacity-100 mt-3' : 'max-h-0 opacity-0'
                                              }`}>
                                                <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm">
                                                  <div className="flex items-center justify-between mb-4">
                                                    <span className="text-xs text-gray-500 font-['Noto_Sans_JP'] font-medium">
                                                      {images.length}枚の画像
                                                    </span>
                                                    <div className="flex items-center space-x-2">
                                                      <span className="text-xs text-gray-400 font-['Noto_Sans_JP']">
                                                        長押しで選択
                                                      </span>
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => selectAllImages(images)}
                                                        className="text-xs font-['Noto_Sans_JP'] border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200"
                                                      >
                                                        全選択
                                                      </Button>
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {images.map((image: any) => (
                                                      <div key={image.id} className="relative group">
                                                        {/* Checkbox for multi-select */}
                                                        <div className="absolute top-2 left-2 z-10">
                                                          <input
                                                            type="checkbox"
                                                            checked={selectedImages.has(image.id)}
                                                            onChange={() => toggleImageSelection(image.id)}
                                                            className="w-4 h-4 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                                                            onClick={(e) => e.stopPropagation()}
                                                          />
                                                        </div>
                                                        
                                                        <img 
                                                          src={image.gcsUrl} 
                                                          alt={`${roomType} - ${beforeAfter}`}
                                                          className={`w-full h-28 object-cover rounded-lg cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md image-hover ${
                                                            selectedImages.has(image.id) 
                                                              ? 'ring-2 ring-green-500 ring-offset-2 opacity-75 scale-95' 
                                                              : 'hover:opacity-80 hover:scale-105'
                                                          }`}
                                                          onClick={() => handleImageClick(image.id, image.gcsUrl, `${roomType} - ${beforeAfter}`)}
                                                          onMouseDown={() => handleImageMouseDown(image.id)}
                                                          onMouseUp={handleImageMouseUp}
                                                          onMouseLeave={handleImageMouseLeave}
                                                          onTouchStart={() => handleImageTouchStart(image.id)}
                                                          onTouchEnd={handleImageTouchEnd}
                                                          onTouchMove={handleImageTouchMove}
                                                          onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            target.src = '/placeholder.svg?height=112&width=150&text=画像を読み込めません'
                                                          }}
                                                        />
                                                        
                                                        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                                                          {new Date(image.uploadedAt).toLocaleDateString('ja-JP')}
                                                        </div>
                                                        
                                                        {/* Selection indicator */}
                                                        {selectedImages.has(image.id) && (
                                                          <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                                            ✓
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))}
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
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-['Noto_Sans_JP'] text-lg">
                    過去の記録はありません
                  </p>
                  <p className="text-gray-400 font-['Noto_Sans_JP'] text-sm mt-2">
                    画像をアップロードすると、ここに表示されます
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Removed LINE Settings Modal */}

    </div>
  )
}
