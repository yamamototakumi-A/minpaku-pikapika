"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ArrowLeft, Search, Calendar, MapPin, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Building2, Eye, MessageCircle, Send, Receipt, Upload, Trash2, Edit, X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { LoadingBar } from "@/components/loading-bar"
import LogoutButton from "@/components/logout-button"
import SecuritySettings from "@/components/security-settings"

// Custom Alert Component
const CustomAlert = ({ 
  isOpen, 
  onClose, 
  type = 'info', 
  title, 
  message, 
  onConfirm 
}: {
  isOpen: boolean
  onClose: () => void
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  onConfirm?: () => void
}) => {
  if (!isOpen) return null

  const alertStyles = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700'
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700'
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700'
    }
  }

  const style = alertStyles[type]
  const IconComponent = style.icon

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4 animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md ${style.bgColor} border-2 ${style.borderColor} rounded-xl shadow-2xl animate-in zoom-in-95 duration-200`}>
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 ${style.iconColor}`}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-semibold ${style.titleColor} mb-2`}>
                {title}
              </h3>
              <p className={`text-sm ${style.messageColor}`}>
                {message}
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            {onConfirm ? (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-2 border-gray-300 hover:bg-gray-50"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={() => {
                    onConfirm()
                    onClose()
                  }}
                  className={`${
                    type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                    type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                    type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  確認
                </Button>
              </>
            ) : (
              <Button
                onClick={onClose}
                className={`${
                  type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                  type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                  type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                OK
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const hqData = {
  facilities: [
    {
      id: "FAC001",
      name: "山田ホテル",
      address: "東京都渋谷区神南1-1-1",
      records: [
        {
          date: "2025-03-28",
          rooms: [
            { type: "トイレ", beforeImages: ["/placeholder.svg?height=200&width=300&text=3月28日トイレ清掃前1", "/placeholder.svg?height=200&width=300&text=3月28日トイレ清掃前2"], afterImages: ["/placeholder.svg?height=200&width=300&text=3月28日トイレ清掃後1", "/placeholder.svg?height=200&width=300&text=3月28日トイレ清掃後2"] },
            { type: "キッチン", beforeImages: ["/placeholder.svg?height=200&width=300&text=3月28日キッチン清掃前"], afterImages: ["/placeholder.svg?height=200&width=300&text=3月28日キッチン清掃後"] }
          ]
        },
        {
          date: "2025-03-25",
          rooms: [
            { type: "お風呂", beforeImages: ["/placeholder.svg?height=200&width=300&text=3月25日お風呂清掃前1", "/placeholder.svg?height=200&width=300&text=3月25日お風呂清掃前2"], afterImages: ["/placeholder.svg?height=200&width=300&text=3月25日お風呂清掃後1", "/placeholder.svg?height=200&width=300&text=3月25日お風呂清掃後2"] },
            { type: "リビング", beforeImages: ["/placeholder.svg?height=200&width=300&text=3月25日リビング清掃前"], afterImages: ["/placeholder.svg?height=200&width=300&text=3月25日リビング清掃後"] }
          ]
        }
      ],
      receipts: {
        "2025-01": ["/placeholder.svg?height=300&width=400&text=1月レシート1", "/placeholder.svg?height=300&width=400&text=1月レシート2"],
        "2025-02": ["/placeholder.svg?height=300&width=400&text=2月レシート1"],
        "2025-03": ["/placeholder.svg?height=300&width=400&text=3月レシート1", "/placeholder.svg?height=300&width=400&text=3月レシート2", "/placeholder.svg?height=300&width=400&text=3月レシート3"]
      }
    },
    {
      id: "FAC002", 
      name: "鈴木マンション",
      address: "東京都渋谷区道玄坂2-2-2",
      records: [
        {
          date: "2025-01-14",
          rooms: [
            { type: "リビング", beforeImages: ["/placeholder.svg?height=200&width=300&text=マンションリビング清掃前"], afterImages: ["/placeholder.svg?height=200&width=300&text=マンションリビング清掃後"] }
          ]
        }
      ],
      receipts: {
        "2025-01": ["/placeholder.svg?height=300&width=400&text=マンション1月レシート"],
        "2025-02": ["/placeholder.svg?height=300&width=400&text=マンション2月レシート1", "/placeholder.svg?height=300&width=400&text=マンション2月レシート2"]
      }
    }
  ]
}

const months = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
]

const companies = [
  { id: "HQ001", name: "ピカピカ清掃本社", type: "本社", status: "active", facilities: 15 },
  { id: "Shibuya001", name: "ピカピカ清掃渋谷支店", type: "支社", status: "active", facilities: 8 },
  { id: "Shinjuku002", name: "ピカピカ清掃新宿支店", type: "支社", status: "active", facilities: 12 },
  { id: "Harajuku003", name: "ピカピカ清掃原宿支店", type: "支社", status: "pending", facilities: 5 }
]

const mockMessages = [
  { id: 1, sender: "渋谷支店", message: "本日の清掃が完了しました", time: "10分前", unread: true },
  { id: 2, sender: "新宿支店", message: "明日の予定について確認したいことがあります", time: "30分前", unread: true },
  { id: 3, sender: "本社スタッフ", message: "月次レポートを送信しました", time: "1時間前", unread: false }
]

export default function HQDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [selectedFacility, setSelectedFacility] = useState<any>(null)
  const [selectedYear, setSelectedYear] = useState(2025)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [selectedAlbumType, setSelectedAlbumType] = useState<"before" | "after" | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [selectedReceiptMonth, setSelectedReceiptMonth] = useState<string | null>(null)
  const [loadingReceipts, setLoadingReceipts] = useState(false)
  const monthUploadRef = useRef<HTMLInputElement>(null)
  const [receiptUploadProgress, setReceiptUploadProgress] = useState(0)
  const [receiptUploadStatus, setReceiptUploadStatus] = useState<string>("")
  const [isReceiptUploading, setIsReceiptUploading] = useState(false)
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<Set<number>>(new Set())
  const [isReceiptDeleting, setIsReceiptDeleting] = useState(false)
  const [receiptDeleteProgress, setReceiptDeleteProgress] = useState(0)
  const [receiptsByMonth, setReceiptsByMonth] = useState<Record<string, { id: number; url: string }[]>>({})
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [chatMessage, setChatMessage] = useState("")
  const [messages, setMessages] = useState(mockMessages)
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<File[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [facilityRecords, setFacilityRecords] = useState<any[]>([])
  const [roomImages, setRoomImages] = useState<{ before: string[]; after: string[] }>({ before: [], after: [] })
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Branch dashboard states
  const [hierarchy, setHierarchy] = useState<any>({})
  const [loadingHierarchy, setLoadingHierarchy] = useState(false)
  const [expandedFacilities, setExpandedFacilities] = useState<Set<string>>(new Set())
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set())
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [expandedBeforeAfter, setExpandedBeforeAfter] = useState<Set<string>>(new Set())
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)

  // Image viewer states
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [offsetStart, setOffsetStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [imageTranslate, setImageTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [selectedImageViewerImage, setSelectedImageViewerImage] = useState<string | null>(null)
  const [isImageViewerModalOpen, setIsImageViewerModalOpen] = useState(false)

  // Custom Alert states
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  // Alert helper functions
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, onConfirm?: () => void) => {
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm
    })
  }

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }))
  }

  // Toggle accordion sections
  const toggleFacility = (facilityId: string) => {
    const newExpanded = new Set(expandedFacilities)
    if (newExpanded.has(facilityId)) {
      newExpanded.delete(facilityId)
    } else {
      newExpanded.add(facilityId)
    }
    setExpandedFacilities(newExpanded)
  }

  const toggleYear = (facilityId: string, year: string) => {
    const key = `${facilityId}-${year}`
    const newExpanded = new Set(expandedYears)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedYears(newExpanded)
  }

  const toggleMonth = (facilityId: string, year: string, month: string) => {
    const key = `${facilityId}-${year}-${month}`
    const newExpanded = new Set(expandedMonths)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedMonths(newExpanded)
  }

  const toggleDay = (facilityId: string, year: string, month: string, day: string) => {
    const key = `${facilityId}-${year}-${month}-${day}`
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedDays(newExpanded)
  }

  const toggleRoom = (facilityId: string, year: string, month: string, day: string, room: string) => {
    const key = `${facilityId}-${year}-${month}-${day}-${room}`
    const newExpanded = new Set(expandedRooms)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedRooms(newExpanded)
  }

  const toggleBeforeAfter = (facilityId: string, year: string, month: string, day: string, room: string, beforeAfter: string) => {
    const key = `${facilityId}-${year}-${month}-${day}-${room}-${beforeAfter}`
    const newExpanded = new Set(expandedBeforeAfter)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedBeforeAfter(newExpanded)
  }

  // Image selection and deletion
  const toggleImageSelection = (imageId: number) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId)
    } else {
      newSelected.add(imageId)
    }
    setSelectedImages(newSelected)
  }

  const clearSelection = () => {
    setSelectedImages(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return
    
    showAlert('warning', '画像削除の確認', `${selectedImages.size}枚の画像を削除しますか？この操作は元に戻せません。`, async () => {
    setIsDeleting(true)
    setDeleteProgress(0)
    
    try {
      const token = localStorage.getItem('auth-token')
      
        // selectedImages is already Set<number>, just convert to array
        const imageIds = Array.from(selectedImages)
        console.log('=== BATCH DELETE FRONTEND DEBUG ===')
        console.log('Selected images:', selectedImages)
        console.log('Image IDs array:', imageIds)
        console.log('Image IDs type:', typeof imageIds[0])
        console.log('Request body:', { imageIds })
        console.log('====================================')
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/cleaning-images/batch-delete`, {
          method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageIds })
      })
        
        console.log('Response status:', res.status)
        console.log('Response ok:', res.ok)
      
      if (res.ok) {
        // Refresh hierarchy after deletion
        if (selectedCompany) {
          await fetchCompanyHierarchy(selectedCompany.id, searchTerm)
        }
        setSelectedImages(new Set())
          showAlert('success', '削除完了', `${selectedImages.size}枚の画像が削除されました`)
      } else {
        const errorData = await res.json()
          console.error('Error response:', errorData)
          showAlert('error', '削除に失敗しました', `削除に失敗しました: ${errorData.error || '不明なエラー'}`)
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
        const errorMessage = error instanceof Error ? error.message : '不明なエラー'
        showAlert('error', '削除中にエラーが発生しました', `削除中にエラーが発生しました: ${errorMessage}`)
    } finally {
      setIsDeleting(false)
      setDeleteProgress(0)
    }
    })
  }

  // Image viewer functions
  const handleImageClick = (imageUrl: string) => {
    setSelectedImageViewerImage(imageUrl)
    setIsImageViewerModalOpen(true)
    setImageTranslate({ x: 0, y: 0 })
  }

  const closeImageViewer = () => {
    setIsImageViewerOpen(false)
    setViewerImages([])
    setCurrentImageIndex(0)
  }

  // Add function to close the enhanced image viewer modal
  const closeEnhancedImageViewer = () => {
    console.log('🔴 Closing enhanced image viewer modal')
    setIsImageViewerModalOpen(false)
    setSelectedImageViewerImage(null)
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setOffsetStart({ ...imageTranslate })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    setImageTranslate({
      x: offsetStart.x + deltaX,
      y: offsetStart.y + deltaY
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Keyboard event handler for image viewer (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImageViewerModalOpen) return
      
      if (e.key === 'Escape') {
        closeImageViewer()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isImageViewerModalOpen])

  // Fetch records for selected facility
  const handleFacilityClick = async (facility: any) => {
    setSelectedFacility(facility)
    setSelectedMonth(null)
    setSelectedDate(null)
    setSelectedRoom(null)
    setIsModalOpen(true)
    setLoadingRecords(true)
    const token = localStorage.getItem('auth-token')
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/facilities/${facility.id}/cleaning-records`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      setFacilityRecords(data.records || [])
    }
    setLoadingRecords(false)
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

  // When a room is selected, fetch its images
  const handleRoomClick = async (room: any) => {
    setSelectedRoom(room)
    setLoadingImages(true)
    const record = facilityRecords.find((r: any) => r.rooms.some((rm: any) => rm.type === room.type))
    if (record) {
      const recId = record.id || record.recordId || record._id
      const images = await fetchImagesForRecord(recId)
      setRoomImages(images)
    }
    setLoadingImages(false)
  }

  // Delete image handler
  const handleDeleteImage = async (type: 'before' | 'after', imageUrl: string, recordId: string) => {
    const token = localStorage.getItem('auth-token')
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/cleaning-records/${recordId}/image`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageUrl, type })
    })
    // Refresh images
    const images = await fetchImagesForRecord(recordId)
    setRoomImages(images)
  }

  // Replace image handler
  const handleReplaceImage = async (type: 'before' | 'after', oldImageUrl: string, file: File, recordId: string) => {
    const token = localStorage.getItem('auth-token')
    const formData = new FormData()
    formData.append('image', file)
    formData.append('oldImageUrl', oldImageUrl)
    formData.append('type', type)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/cleaning-records/${recordId}/image`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    // Refresh images
    const images = await fetchImagesForRecord(recordId)
    setRoomImages(images)
  }

  const handleAlbumTypeClick = (albumType: "before" | "after") => {
    if (selectedRoom) {
      setSelectedAlbumType(albumType)
      const images = albumType === "before" ? selectedRoom.beforeImages : selectedRoom.afterImages
      handleImageAlbumClick(images, 0)
    }
  }

  const handleImageAlbumClick = (images: string[], startIndex: number = 0) => {
    setViewerImages(images)
    setCurrentImageIndex(startIndex)
    setIsImageViewerOpen(true)
  }

  // Add new function for receipt images to use the enhanced image viewer
  const handleReceiptImageClick = (receipts: { id: number; url: string }[], startIndex: number = 0) => {
    const urls = receipts.map(r => r.url)
    setSelectedImageViewerImage(urls[startIndex])
    setIsImageViewerModalOpen(true)
  }

  const handleReceiptMonthClick = (month: string) => {
    setSelectedReceiptMonth(month)
  }

  const handleReceiptUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedFacility) return
    
    setUploadingImages(Array.from(files))
    setIsUploading(true)
    setReceiptUploadProgress(0)
    setReceiptUploadStatus('画像をアップロード中...')
    
    try {
      const token = localStorage.getItem('auth-token')
      let successCount = 0
      const startTime = Date.now()
      let totalBytesUploaded = 0
      let totalBytes = Array.from(files).reduce((sum, file) => sum + file.size, 0)
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('image', file)
        
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/auth/facilities/${selectedFacility.facilityId}/receipts`)
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              // Calculate progress based on actual bytes uploaded
              const fileProgress = e.loaded / e.total
              const overallProgress = ((totalBytesUploaded + (fileProgress * file.size)) / totalBytes) * 100
              const percent = Math.round(overallProgress)
              
              setReceiptUploadProgress(percent)
              
              // Calculate ETA based on actual upload speed
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
        await handleReceiptClick(selectedFacility)
        
        // Restore the selected month after refresh
        if (currentSelectedMonth) {
          setSelectedReceiptMonth(currentSelectedMonth)
        }
        
        showAlert('success', 'アップロード完了', `${successCount}枚のレシート画像をアップロードしました`)
      } else {
        showAlert('error', 'アップロード失敗', 'レシートのアップロードに失敗しました')
      }
    } catch (error) {
      console.error('Receipt upload error:', error)
      showAlert('error', 'アップロードエラー', 'レシートのアップロード中にエラーが発生しました')
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
        sender: "本社社長",
        message: chatMessage,
        time: "今",
        unread: false
      }
      setMessages([...messages, newMessage])
      setChatMessage("")
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % viewerImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + viewerImages.length) % viewerImages.length)
  }

  const getRecordsForMonth = (month: string) => {
    if (!selectedFacility || !selectedFacility.records) return []
    return selectedFacility.records.filter((record: any) => {
      const recordDate = new Date(record.date)
      const recordMonth = recordDate.getMonth() + 1
      const recordYear = recordDate.getFullYear()
      const monthNumber = months.indexOf(month) + 1
      return recordMonth === monthNumber && recordYear === selectedYear
    })
  }

  const getDatesForMonth = (month: string) => {
    if (!selectedFacility || !selectedFacility.records) return []
    return selectedFacility.records.filter((record: any) => {
      const recordDate = new Date(record.date)
      const recordMonth = recordDate.getMonth() + 1
      const recordYear = recordDate.getFullYear()
      const monthNumber = months.indexOf(month) + 1
      return recordMonth === monthNumber && recordYear === selectedYear
    }).map((record: any) => record.date)
  }

  const getRoomsForDate = (date: string) => {
    if (!selectedFacility || !selectedFacility.records) return []
    const record = selectedFacility.records.find((r: any) => r.date === date)
    return record ? record.rooms : []
  }

  const nextYear = () => setSelectedYear(prev => prev + 1)
  const prevYear = () => setSelectedYear(prev => prev - 1)

  // Add missing functions to fix TypeScript errors
  const handleMonthClick = (month: string) => {
    setSelectedMonth(month)
    setSelectedDate(null)
    setSelectedRoom(null)
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    setSelectedRoom(null)
  }

  const handleReceiptClick = async (facility: any) => {
    // Create a proper facility object with the data from hierarchy
    const facilityData = {
      id: facility.facilityId,
      facilityId: facility.facilityId,
      name: facility.name || facility.facilityId,
      receipts: {}
    }
    setSelectedFacility(facilityData)
    setIsReceiptModalOpen(true)
    setSelectedReceiptMonth(null)
    setLoadingReceipts(true)
    
    // Fetch receipts for this facility
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/facilities/${facility.facilityId}/receipts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('🔍 HQ Dashboard - Receipt data received:', data)
        const receiptsByMonthData: Record<string, { id: number; url: string }[]> = {}
        ;(data.receipts || []).forEach((receipt: any) => {
          console.log('📄 HQ Dashboard - Processing receipt:', receipt)
          const uploadDate = new Date(receipt.uploadedAt)
          const monthKey = `${uploadDate.getFullYear()}-${(uploadDate.getMonth() + 1).toString().padStart(2, '0')}`
          console.log('📅 HQ Dashboard - Month key generated:', monthKey, 'from uploadedAt:', receipt.uploadedAt)
          if (!receiptsByMonthData[monthKey]) receiptsByMonthData[monthKey] = []
          receiptsByMonthData[monthKey].push({ id: receipt.id, url: receipt.gcsUrl })
        })

        console.log('📊 HQ Dashboard - Final grouped receipts:', receiptsByMonthData)
        setReceiptsByMonth(receiptsByMonthData)
        setSelectedFacility((prev: any) => ({
          ...prev,
          receipts: receiptsByMonthData
        }))
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error)
    } finally {
      setLoadingReceipts(false)
    }
  }

  // Add missing receipt deletion functions
  const handleSingleReceiptDelete = async (receiptId: number) => {
    if (!confirm('このレシートを削除します。よろしいですか？')) return
    
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/receipts/${receiptId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        // Refresh receipts data
        if (selectedFacility) {
          await handleReceiptClick(selectedFacility)
        }
        showAlert('success', '削除完了', 'レシートを削除しました')
      } else {
        showAlert('error', '削除失敗', 'レシートの削除に失敗しました')
      }
    } catch (error) {
      console.error('Receipt delete error:', error)
      showAlert('error', '削除エラー', 'レシートの削除中にエラーが発生しました')
    }
  }

  const handleBatchReceiptDelete = async () => {
    if (!confirm('選択したレシートを削除します。よろしいですか？')) return
    
    try {
      const token = localStorage.getItem('auth-token')
      const ids = Array.from(selectedReceiptIds)
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/receipts/batch-delete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptIds: ids })
      })
      
      if (res.ok) {
        // Refresh receipts data
        if (selectedFacility) {
          await handleReceiptClick(selectedFacility)
        }
        setSelectedReceiptIds(new Set())
        showAlert('success', '削除完了', `${ids.length}枚のレシートを削除しました`)
      } else {
        // Fallback: sequential delete
        let success = 0
        for (let i = 0; i < ids.length; i++) {
          const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/receipts/${ids[i]}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}` } 
          })
          if (r.ok) success++
        }
        if (success !== ids.length) {
          showAlert('warning', '部分削除完了', `一部削除に失敗しました（成功: ${success} / 失敗: ${ids.length - success}）`)
        } else {
          showAlert('success', '削除完了', `${ids.length}枚のレシートを削除しました`)
        }
        // Refresh receipts data
        if (selectedFacility) {
          await handleReceiptClick(selectedFacility)
        }
        setSelectedReceiptIds(new Set())
      }
    } catch (error) {
      console.error('Batch receipt delete error:', error)
      showAlert('error', '削除エラー', 'レシートの削除中にエラーが発生しました')
    }
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
        
        // Token is valid, fetch companies data
        setIsAuthenticated(true)
        await fetchCompanies()
      } catch (error) {
        console.error('Authentication error:', error)
        localStorage.removeItem('auth-token')
        setIsAuthenticated(false)
        window.location.href = '/'
      } finally {
        setIsCheckingAuth(false)
      }
    }

    const fetchCompanies = async () => {
      setLoadingCompanies(true)
      try {
        const token = localStorage.getItem('auth-token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/companies`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          console.log('=== COMPANIES DATA DEBUG ===')
          console.log('Raw companies data:', data)
          console.log('Companies array:', data.companies)
          console.log('First company:', data.companies?.[0])
          console.log('============================')
          
          // Sort companies: headquarter first, then others by companyId
          const sortedCompanies = (data.companies || []).sort((a: any, b: any) => {
            if (a.type === '本社') return -1
            if (b.type === '本社') return 1
            return a.companyId.localeCompare(b.companyId)
          })
          setCompanies(sortedCompanies)
        }
      } catch (e) { 
        console.error('Error fetching companies:', e)
      }
      setLoadingCompanies(false)
    }

    checkAuthAndFetchData()
  }, [])

  // Fetch hierarchy when company is selected
  useEffect(() => {
    if (selectedCompany) {
      // Use companyId for the hierarchy fetch
      const companyId = selectedCompany.companyId || selectedCompany.id
      fetchCompanyHierarchy(companyId, searchTerm)
    }
  }, [selectedCompany, searchTerm])

  // Fetch facilities for selected company
  const handleCompanyClick = async (company: any) => {
    console.log('Company clicked:', company)
    setSelectedCompany(company)
    setLoadingFacilities(true)
    setSelectedFacility(null)
    setFacilities([])
    setFacilityRecords([])
    setHierarchy({})
    setExpandedFacilities(new Set())
    setExpandedYears(new Set())
    setExpandedMonths(new Set())
    setExpandedDays(new Set())
    setExpandedRooms(new Set())
    setExpandedBeforeAfter(new Set())
    setSelectedImages(new Set())
    
    try {
      const token = localStorage.getItem('auth-token')
      // Use companyId for the API call
      const companyId = company.companyId
      console.log('Fetching facilities for company:', companyId)
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/companies/${companyId}/facilities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setFacilities(data.facilities || [])
      } else {
        console.error('Failed to fetch facilities:', res.status, res.statusText)
      }
    } catch (e) { 
      console.error('Error fetching facilities:', e)
    }
    setLoadingFacilities(false)
  }

  // Fetch hierarchy for selected company
  const fetchCompanyHierarchy = async (companyId: any, facilityFilter?: string) => {
    setLoadingHierarchy(true)
    try {
      const token = localStorage.getItem('auth-token')
      // Use companyId directly (it should already be the correct format)
      console.log('Fetching hierarchy for company:', companyId)
      
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/uploads/hierarchy`)
      url.searchParams.append('companyId', companyId.toString())
      if (facilityFilter) {
        url.searchParams.append('facilityId', facilityFilter)
      }
      
      console.log('Hierarchy URL:', url.toString())
      
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setHierarchy(data.hierarchy || {})
      } else {
        console.error('Failed to fetch hierarchy:', res.status, res.statusText)
      }
    } catch (e) {
      console.error('Failed to fetch hierarchy:', e)
    }
    setLoadingHierarchy(false)
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

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b-2 border-green-600">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 transition-colors text-green-600">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">戻る</span>
            </Link>
            <div className="flex items-center space-x-3">
              <SecuritySettings />
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-orange-800">本社</h1>
            <p className="text-gray-700 mt-2 sm:mt-4">全社の清掃記録を一元管理</p>
          </div>

          <div className="flex gap-6 sm:gap-8">
            {/* Left Sidebar - Company Selection (30%) */}
            <div className="w-[30%] min-w-[300px]">
              <Card className="bg-white shadow-lg border-4 border-blue-300 h-full">
                
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl font-bold text-orange-600 flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>加盟会社一覧</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {loadingCompanies ? (
                      <div className="text-center py-6 sm:py-8">
                        <p className="text-gray-500 text-sm sm:text-base">会社を読み込み中...</p>
                      </div>
                    ) : companies.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <p className="text-gray-500 text-sm sm:text-base">加盟会社が見つかりません</p>
                      </div>
                    ) : (
                      companies.map((company) => (
                        <div 
                          key={company.id} 
                          className={`border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-colors ${
                            selectedCompany?.id === company.id 
                              ? "border-orange-500 bg-orange-50" 
                              : company.type === '本社'
                              ? "border-purple-400 bg-purple-50"
                              : "border-blue-300 hover:bg-blue-50"
                          }`}
                          onClick={() => handleCompanyClick(company)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-blue-600 text-sm sm:text-base">{company.companyId}</h3>
                                {company.type === '本社' && (
                                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                    本社
                                  </span>
                                )}
                            </div>
                              <p className="text-xs sm:text-sm text-gray-600">{company.type}</p>
                              {company.address && (
                                <p className="text-xs text-gray-500 mt-1">{company.address}</p>
                              )}
                            </div>
                            <div className="text-blue-500">
                              {selectedCompany?.id === company.id ? '✓' : '▶'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Content Area - Branch Dashboard (70%) */}
            <div className="flex-1">
              {selectedCompany ? (
                  <Card className="bg-white shadow-lg border-4 border-blue-300 h-full">
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl font-bold text-orange-600">
                      {selectedCompany.companyId} - 清掃記録管理
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 sm:h-5 w-4 sm:w-5" />
                          <Input
                          placeholder="施設IDで検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 sm:pl-12 h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-300"
                          />
                        </div>
                      </div>

                    {/* Delete Progress Bar */}
                    {isDeleting && (
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-red-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${deleteProgress}%` }}
                          ></div>
                                </div>
                        <p className="text-sm text-gray-600 mt-1">削除中... {deleteProgress}%</p>
                              </div>
                    )}

                    {/* Floating Delete Toolbar */}
                    {selectedImages.size > 0 && (
                      <div className="fixed bottom-6 right-6 z-50 flex space-x-2">
                              <Button
                                variant="outline"
                          onClick={clearSelection}
                          className="bg-white border-2 border-gray-300"
                        >
                          選択解除
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleBulkDelete}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          選択削除 ({selectedImages.size})
                              </Button>
                            </div>
                    )}

                    {/* Hierarchy Display */}
                    {loadingHierarchy ? (
                      <div className="text-center py-8">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-gray-500">データを読み込み中...</p>
                          <p className="text-sm text-gray-400">画像の事前読み込みも実行中...</p>
                        </div>
                      </div>
                    ) : Object.keys(hierarchy).length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">清掃記録が見つかりません</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(hierarchy).map(([facilityId, facilityData]: [string, any]) => (
                          <div key={facilityId} className="border-2 border-slate-300 rounded-lg p-4">
                            {/* Facility Header */}
                            <div 
                              className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded"
                              onClick={() => toggleFacility(facilityId)}
                            >
                              <div>
                                <h3 className="font-semibold text-slate-800 text-lg">施設ID: {facilityId}</h3>
                                {facilityData.name && facilityData.name !== facilityId && (
                                  <p className="text-sm text-slate-600">{facilityData.name}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                {/* Receipt Management Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleReceiptClick({ facilityId, name: facilityData.name || facilityId })
                                  }}
                                  className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 text-emerald-700 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex items-center space-x-2 px-3 py-1"
                                >
                                  <Receipt className="h-4 w-4" />
                                  <span className="text-sm font-medium">レシート管理</span>
                                </Button>
                              <div className="text-slate-600">{expandedFacilities.has(facilityId) ? '▼' : '▶'}</div>
                              </div>
                            </div>

                            {/* Facility Content */}
                            {expandedFacilities.has(facilityId) && facilityData.years && (
                              <div className="mt-4 space-y-3">
                                {Object.entries(facilityData.years).map(([year, yearData]: [string, any]) => (
                                  <div key={year} className="ml-4 border-l-2 border-green-200 pl-4">
                                    {/* Year Header */}
                                    <div 
                                      className="flex items-center justify-between cursor-pointer hover:bg-blue-50 p-2 rounded"
                                      onClick={() => toggleYear(facilityId, year)}
                                    >
                                      <h4 className="font-medium text-blue-700">{year}年</h4>
                                      <div className="text-blue-600">{expandedYears.has(`${facilityId}-${year}`) ? '▼' : '▶'}</div>
                                    </div>

                                    {/* Year Content */}
                                    {expandedYears.has(`${facilityId}-${year}`) && yearData && (
                                      <div className="mt-2 space-y-2">
                                        {Object.entries(yearData).map(([month, monthData]: [string, any]) => (
                                          <div key={month} className="ml-4 border-l-2 border-blue-200 pl-4">
                                            {/* Month Header */}
                                            <div 
                                              className="flex items-center justify-between cursor-pointer hover:bg-blue-50 p-2 rounded"
                                              onClick={() => toggleMonth(facilityId, year, month)}
                                            >
                                              <h5 className="font-medium text-blue-600">{month}月</h5>
                                              <div className="text-blue-500">{expandedMonths.has(`${facilityId}-${year}-${month}`) ? '▼' : '▶'}</div>
                                            </div>

                                            {/* Month Content */}
                                            {expandedMonths.has(`${facilityId}-${year}-${month}`) && monthData && (
                                              <div className="mt-2 space-y-2">
                                                {Object.entries(monthData).map(([day, dayData]: [string, any]) => (
                                                  <div key={day} className="ml-4 border-l-2 border-blue-200 pl-4">
                                                    {/* Day Header */}
                                                    <div 
                                                      className="flex items-center justify-between cursor-pointer hover:bg-blue-50 p-2 rounded"
                                                      onClick={() => toggleDay(facilityId, year, month, day)}
                                                    >
                                                      <h6 className="font-medium text-blue-500">{day}日</h6>
                                                      <div className="text-blue-400">{expandedDays.has(`${facilityId}-${year}-${month}-${day}`) ? '▼' : '▶'}</div>
                                                    </div>

                                                    {/* Day Content */}
                                                    {expandedDays.has(`${facilityId}-${year}-${month}-${day}`) && dayData && (
                                                      <div className="mt-2 space-y-2">
                                                        {Object.entries(dayData).map(([room, roomData]: [string, any]) => (
                                                          <div key={room} className="ml-4 border-l-2 border-green-200 pl-4">
                                                            {/* Room Header */}
                                                            <div 
                                                              className="flex items-center justify-between cursor-pointer hover:bg-indigo-50 p-2 rounded"
                                                              onClick={() => toggleRoom(facilityId, year, month, day, room)}
                                                            >
                                                              <span className="font-medium text-indigo-700">{room}</span>
                                                              <div className="text-indigo-600">{expandedRooms.has(`${facilityId}-${year}-${month}-${day}-${room}`) ? '▼' : '▶'}</div>
                                                            </div>

                                                            {/* Room Content */}
                                                            {expandedRooms.has(`${facilityId}-${year}-${month}-${day}-${room}`) && roomData && (
                                                              <div className="mt-2 space-y-2">
                                                                {Object.entries(roomData).map(([beforeAfter, images]: [string, any]) => (
                                                                  <div key={beforeAfter} className="ml-4 border-l-2 border-indigo-200 pl-4">
                                                                    {/* Before/After Header */}
                                                                    <div 
                                                                      className="flex items-center justify-between cursor-pointer hover:bg-indigo-50 p-2 rounded"
                                                                      onClick={() => toggleBeforeAfter(facilityId, year, month, day, room, beforeAfter)}
                                                                    >
                                                                      <span className="font-medium text-indigo-600">{beforeAfter === 'before' ? '清掃前' : '清掃後'}</span>
                                                                      <div className="text-indigo-500">{expandedBeforeAfter.has(`${facilityId}-${year}-${month}-${day}-${room}-${beforeAfter}`) ? '▼' : '▶'}</div>
                                                                    </div>

                                                                    {/* Images Grid */}
                                                                    {expandedBeforeAfter.has(`${facilityId}-${year}-${month}-${day}-${room}-${beforeAfter}`) && images && images.length > 0 && (
                                                                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                                        {images.map((image: any, index: number) => (
                                                                          <div key={index} className="relative group">
                                                                            <div className="relative">
                                                                              <input
                                                                                type="checkbox"
                                                                                checked={selectedImages.has(image.id)}
                                                                                onChange={() => toggleImageSelection(image.id)}
                                                                                className="absolute top-2 left-2 z-10 w-4 h-4 text-indigo-600 bg-white border-2 border-gray-300 rounded focus:ring-indigo-500"
                                                                              />
                                                                              <div className="cursor-pointer" onClick={() => handleImageClick(image.url)}>
                                                                                <Image
                                                                                  src={image.url || "/placeholder.svg"}
                                                                                  alt={`画像 ${index + 1}`}
                                                                                  width={120}
                                                                                  height={120}
                                                                                  className="w-full h-24 sm:h-28 object-cover rounded border-2 border-indigo-300 hover:border-indigo-500 transition-colors"
                                                                                  priority={index < 4}
                                                                                  onError={(e) => {
                                                                                    const target = e.target as HTMLImageElement
                                                                                    target.src = '/placeholder.svg?height=120&width=120&text=画像を読み込めません'
                                                                                  }}
                                                                                />
                                                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded flex items-center justify-center">
                                                                                  <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                                                                </div>
                                                                              </div>
                                                                            </div>
                                                                          </div>
                                                                        ))}
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                ))}
                                                              </div>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white shadow-lg border-4 border-blue-300 h-full">
                  <CardContent className="flex items-center justify-center h-full p-6 sm:p-8">
                    <div className="text-center">
                      <Building2 className="h-12 sm:h-16 w-12 sm:w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">会社を選択してください</h3>
                      <p className="text-sm sm:text-base text-gray-500">左側から会社を選択すると、その会社の清掃記録が表示されます</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Chat Modal */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-2xl bg-white border-4 border-blue-600 mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-blue-600">
              <MessageCircle className="h-5 w-5" />
              <span>社内チャット</span>
            </DialogTitle>
            <DialogDescription className="sr-only">社内連絡のためのチャットモーダル</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-96">
            {/* Chat Users List */}
            <div className="border-r border-gray-200 pr-4">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">連絡先</h4>
              <div className="space-y-2">
                {["渋谷支店", "新宿支店", "原宿支店", "本社スタッフ"].map((user) => (
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
                      .filter(m => m.sender === selectedChatUser || m.sender === "本社社長")
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`p-2 sm:p-3 rounded-lg max-w-xs ${
                            message.sender === "本社社長"
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

      {/* Receipt Modal - Branch-style Calendar View */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="w-[95vw] max-w-[1200px] h-[90vh] bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 border-0 shadow-2xl mx-4 overflow-hidden z-[100000]">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 -mx-6 -mt-6 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">
                    {selectedFacility?.name} - レシート管理
                  </DialogTitle>
                  <p className="text-blue-100 text-sm mt-1">Receipt Management System</p>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden px-2">
            {!selectedReceiptMonth && (
              <div className="h-full">
                <div className="flex justify-center mb-6">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-fit w-full max-w-[900px]">
                    <div className="flex items-center justify-between mb-6">
                      <button className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50" onClick={() => setSelectedYear((y) => y + 1)} title="翌年へ">
                        <ChevronUp className="w-6 h-6 text-gray-600" />
                      </button>
                      <div className="text-2xl font-bold text-gray-800">{selectedYear}年</div>
                      <button className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50" onClick={() => setSelectedYear((y) => y - 1)} title="前年へ">
                        <ChevronDown className="w-6 h-6 text-gray-600" />
                      </button>
                    </div>

                    {/* 4x3 month grid with counts */}
                    <div className="grid grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const key = `${selectedYear}-${String(m).padStart(2,'0')}`
                        const count = (receiptsByMonth[key] || []).length
                        return (
                          <button
                            key={m}
                            onClick={() => handleReceiptMonthClick(key)}
                            className={`relative rounded-xl border-2 transition-all duration-200 text-center py-5 md:py-6 text-base md:text-lg hover:shadow-md bg-white border-gray-200 text-gray-700 hover:border-blue-300`}
                          >
                            {count > 0 && (
                              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white text-xs md:text-sm shadow">{count}</span>
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
                <div className="flex items-center justify-between mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
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
                      {selectedFacility?.name} - {selectedReceiptMonth?.split('-')[1] || ''}月のレシート
                  </h3>
                    <p className="text-gray-600 mt-1">
                      {receiptsByMonth[selectedReceiptMonth || '']?.length || 0}枚のレシート
                    </p>
                  </div>
                  
                  {/* Upload Button for This Month */}
                  <div>
                    <input
                      ref={monthUploadRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleReceiptUpload(e.target.files)}
                      className="hidden"
                    />
                    <Button
                      onClick={() => monthUploadRef.current?.click()}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      この月に追加
                    </Button>
                  </div>
                </div>

                {/* Receipts Grid */}
                {isReceiptUploading && (
                  <div className="mx-4 mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-200"
                        style={{ width: `${receiptUploadProgress}%` }}
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600 text-right">{receiptUploadStatus}</div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-2">
                    {(receiptsByMonth[selectedReceiptMonth || ''] || []).map((receipt: { id: number; url: string }, index: number) => (
                      <div key={receipt.id} className="group">
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
                          <div
                            className="relative cursor-pointer"
                            onClick={() => {
                              if (selectedReceiptMonth && receiptsByMonth[selectedReceiptMonth]) {
                                handleReceiptImageClick(receiptsByMonth[selectedReceiptMonth], index)
                              }
                            }}
                          >
                            <img
                              src={receipt.url || "/placeholder.svg"}
                              alt={`レシート ${index + 1}`}
                              className="w-full h-48 object-cover group-hover:brightness-110 transition-all duration-300"
                              style={{ aspectRatio: '1 / 1' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                              <div className="flex items-center space-x-2">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm font-medium">クリックして表示</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons + Selection */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center space-x-2 text-sm text-gray-600">
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
                                <span>レシート #{index + 1}</span>
                              </label>
                              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleSingleReceiptDelete(receipt.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedReceiptIds.size > 0 && (
                    <div className="sticky bottom-0 z-10 bg-white/90 backdrop-blur border-t border-red-300 p-3 flex items-center justify-between">
                      <span className="text-sm text-red-600">{selectedReceiptIds.size} 枚選択中</span>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedReceiptIds(new Set())} className="border-2 border-gray-300">選択解除</Button>
                        <Button variant="destructive" size="sm" disabled={isReceiptDeleting} className="border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white" onClick={handleBatchReceiptDelete}>選択削除</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Image Viewer Modal - Exact format from staff-dashboard */}
      {isImageViewerModalOpen && (
        <div 
          className="fixed inset-0 z-[200000] flex items-center justify-center bg-black bg-opacity-95 p-4 animate-in fade-in duration-300"
          onClick={closeEnhancedImageViewer}
        >
          <div 
            className="relative z-[200010] w-[90vw] h-[90vh] max-w-7xl max-h-full flex flex-col animate-in zoom-in-95 duration-300"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
          >
            <button 
              className="absolute top-4 right-4 text-white text-2xl font-bold cursor-pointer hover:text-gray-300 transition-all duration-200 hover:scale-110 z-[200020] bg-black bg-opacity-60 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                closeEnhancedImageViewer()
              }}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex-1 flex items-center justify-center">
              <img 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                src={selectedImageViewerImage || ""}
                alt="拡大画像"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder.svg?height=400&width=600&text=画像を読み込めません'
                }}
              />
            </div>
            <div className="text-center text-white mt-4 p-4 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg">
              <h3 className="text-lg font-bold font-['Noto_Sans_JP']">画像ビューア</h3>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal - Single Close Button */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="max-w-4xl bg-white border-4 border-blue-300 mx-4">
          <DialogHeader>
            <DialogTitle className="text-orange-600">
              {selectedRoom?.type} - {selectedAlbumType === "before" ? "清掃前" : "清掃後"}アルバム ({currentImageIndex + 1} / {viewerImages.length})
            </DialogTitle>
            <DialogDescription className="sr-only">画像アルバムのプレビュー</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <div className="flex items-center justify-center">
              <Image
                src={viewerImages[currentImageIndex] || "/placeholder.svg"}
                alt={`画像 ${currentImageIndex + 1}`}
                width={600}
                height={400}
                className="max-w-full max-h-80 sm:max-h-96 object-contain rounded border-2 border-blue-300"
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={prevImage}
                disabled={viewerImages.length <= 1}
                className="border-2 border-blue-300"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                前へ
              </Button>
              <div className="flex space-x-2">
                {viewerImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 sm:w-3 h-2 sm:h-3 rounded-full ${
                      index === currentImageIndex ? "bg-orange-600" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                onClick={nextImage}
                disabled={viewerImages.length <= 1}
                className="border-2 border-blue-300"
              >
                次へ
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Facility Records Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl h-[90vh] bg-white border-4 border-green-600 mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-orange-600">
              {selectedFacility?.name} - 年間記録
            </DialogTitle>
            <DialogDescription className="sr-only">施設の清掃記録の年間ビュー</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {!selectedMonth && (
              <div className="p-4 sm:p-6 h-full">
                {/* Year Navigation */}
                <div className="flex items-center justify-center mb-6 sm:mb-8 space-x-4">
                  <Button
                    variant="outline"
                    onClick={prevYear}
                    className="border-2 border-green-600 text-green-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-2xl sm:text-3xl font-bold text-orange-600">{selectedYear}年</h2>
                  <Button
                    variant="outline"
                    onClick={nextYear}
                    className="border-2 border-green-600 text-green-600"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Receipt Months Grid - Show months that have receipts */}
                <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
                  {months.map((month) => {
                    const monthKey = `${selectedYear}-${(months.indexOf(month) + 1).toString().padStart(2, '0')}`
                    const hasReceipts = selectedFacility?.receipts?.[monthKey]?.length > 0
                    return (
                      <Button
                        key={month}
                        variant="outline"
                        className={`h-16 sm:h-20 text-sm sm:text-lg font-bold border-3 transition-all duration-300 relative ${
                          hasReceipts ? 'shadow-lg' : 'opacity-50'
                        }`}
                        style={{ 
                          borderColor: hasReceipts ? '#04c755' : '#70ad47',
                          color: hasReceipts ? '#04c755' : '#70ad47',
                          backgroundColor: hasReceipts ? '#f0fff4' : 'white'
                        }}
                        onClick={() => handleMonthClick(month)}
                        disabled={!hasReceipts}
                      >
                        {month}
                        {hasReceipts && (
                          <div className="absolute top-2 right-2 w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-green-500"></div>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedMonth && !selectedDate && (
              <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMonth(null)}
                    className="border-2 border-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    戻る
                  </Button>
                  <h3 className="text-lg sm:text-2xl font-bold text-orange-600">{selectedYear}年 {selectedMonth}の記録</h3>
                </div>
                
                {/* Show receipt upload dates for the selected month */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold text-green-600 mb-3">レシートアップロード日</h4>
                  <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-2xl">
                    {(() => {
                      const monthKey = selectedMonth ? `${selectedYear}-${(months.indexOf(selectedMonth) + 1).toString().padStart(2, '0')}` : ''
                      const monthReceipts = selectedFacility?.receipts?.[monthKey] || []
                      // Create unique dates from receipts - use current date for now
                      const uniqueDates = [1, 15, 30] // Placeholder dates
                      return uniqueDates.map((day) => (
                      <Button
                          key={day}
                        variant="outline"
                        className="h-12 sm:h-16 text-xs sm:text-sm border-2 border-green-500 text-green-500 hover:bg-green-100"
                          onClick={() => {
                            if (selectedMonth) {
                              handleDateClick(`${selectedYear}-${(months.indexOf(selectedMonth) + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`)
                            }
                          }}
                        >
                          {day}日
                      </Button>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            )}

            {selectedDate && (
              <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDate(null)}
                    className="border-2 border-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    戻る
                  </Button>
                  <h3 className="text-lg sm:text-2xl font-bold text-orange-600">{selectedDate} - 部屋選択</h3>
                </div>
                
                {!selectedRoom ? (
                  /* Receipt Display for Selected Date */
                  <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {(() => {
                        const monthKey = selectedMonth ? `${selectedYear}-${(months.indexOf(selectedMonth) + 1).toString().padStart(2, '0')}` : ''
                        const monthReceipts = selectedFacility?.receipts?.[monthKey] || []
                        return monthReceipts.map((receipt: string, index: number) => (
                          <div key={index} className="relative group">
                            <div
                              className="cursor-pointer"
                              onClick={() => handleImageAlbumClick([receipt], index)}
                            >
                              <img
                                src={receipt || "/placeholder.svg"}
                                alt={`レシート ${index + 1}`}
                                className="w-full h-32 sm:h-40 object-cover rounded border-2 border-blue-300"
                                style={{ aspectRatio: '1 / 1' }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded flex items-center justify-center">
                                <Eye className="h-5 sm:h-6 w-5 sm:w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              </div>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                              <Button size="sm" variant="outline" className="h-6 w-6 p-0 bg-white">
                                <Edit className="h-3 w-3" />
                      </Button>
                              <Button size="sm" variant="outline" className="h-6 w-6 p-0 bg-white text-red-600">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                ) : (
                  /* Album Type Selection */
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-6">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedRoom(null)}
                        className="border-2 border-gray-300"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        戻る
                      </Button>
                      <h3 className="text-lg sm:text-2xl font-bold text-orange-600">
                        {selectedDate} - {selectedRoom.type}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
                      {/* Before Clean Album */}
                      <Button
                        variant="outline"
                        className="h-32 sm:h-40 text-lg sm:text-xl border-4 border-red-500 hover:bg-red-50 flex flex-col items-center justify-center space-y-2"
                        onClick={() => handleAlbumTypeClick("before")}
                        disabled={selectedRoom.beforeImages.length === 0}
                      >
                        <div className="text-red-600 font-bold">清掃前アルバム</div>
                        <div className="text-sm text-gray-600">
                          {selectedRoom.beforeImages.length}枚の写真
                        </div>
                      </Button>
                      
                      {/* After Clean Album */}
                      <Button
                        variant="outline"
                        className="h-32 sm:h-40 text-lg sm:text-xl border-4 border-green-500 hover:bg-green-50 flex flex-col items-center justify-center space-y-2"
                        onClick={() => handleAlbumTypeClick("after")}
                        disabled={selectedRoom.afterImages.length === 0}
                      >
                        <div className="text-green-600 font-bold">清掃後アルバム</div>
                        <div className="text-sm text-gray-600">
                          {selectedRoom.afterImages.length}枚の写真
                        </div>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertConfig.isOpen}
        onClose={hideAlert}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
      />
    </div>
  )
}