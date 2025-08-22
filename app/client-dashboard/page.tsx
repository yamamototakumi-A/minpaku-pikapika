"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ArrowLeft, Search, Calendar, MapPin, ChevronLeft, ChevronRight, MessageCircle, Send, Receipt, Edit, Trash2, Eye, Upload, Building2, Home, Clock, CheckCircle, X, AlertCircle } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { LoadingBar } from "@/components/loading-bar"
import LogoutButton from "@/components/logout-button"
import SecuritySettings from "@/components/security-settings"

export default function ClientDashboard() {
  const [hierarchy, setHierarchy] = useState<any>({})
  const [loadingHierarchy, setLoadingHierarchy] = useState(false)
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)
  const [selectedFacilityName, setSelectedFacilityName] = useState<string | null>(null)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<File[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Add accordion state for hierarchical view
  const [expandedFacilities, setExpandedFacilities] = useState<Set<string>>(new Set())
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [expandedBeforeAfter, setExpandedBeforeAfter] = useState<Set<string>>(new Set())

  // Image viewer states --glo
  const [selectedImageViewerImage, setSelectedImageViewerImage] = useState<string | null>(null)
  const [isImageViewerModalOpen, setIsImageViewerModalOpen] = useState(false)

  // Toggle functions for accordion
  const toggleFacility = (facilityId: string) => {
    const newExpanded = new Set(expandedFacilities)
    if (newExpanded.has(facilityId)) {
      newExpanded.delete(facilityId)
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
      setExpandedRooms(new Set())
      setExpandedBeforeAfter(new Set())
    } else {
      newExpanded.add(key)
    }
    setExpandedDates(newExpanded)
  }

  const toggleRoom = (facilityId: string, date: string, room: string) => {
    const key = `${facilityId}-${date}-${room}`
    const newExpanded = new Set(expandedRooms)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
      setExpandedBeforeAfter(new Set())
    } else {
      newExpanded.add(key)
    }
    setExpandedRooms(newExpanded)
  }

  const toggleBeforeAfter = (facilityId: string, date: string, room: string, beforeAfter: string) => {
    const key = `${facilityId}-${date}-${room}-${beforeAfter}`
    const newExpanded = new Set(expandedBeforeAfter)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedBeforeAfter(newExpanded)
  }

  // Image viewer functions
  const handleImageClick = (imageUrl: string) => {
    setSelectedImageViewerImage(imageUrl)
    setIsImageViewerModalOpen(true)
  }

  const closeImageViewer = () => {
    setIsImageViewerModalOpen(false)
    setSelectedImageViewerImage(null)
  }

  // Fetch client hierarchy (only for their facility)
  const fetchClientHierarchy = async () => {
    setLoadingHierarchy(true)
    try {
      const token = localStorage.getItem('auth-token')
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/client/hierarchy`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setHierarchy(data.hierarchy || {})
        if (data.facilityId) {
          setSelectedFacilityId(data.facilityId)
        }
        if (data.facilityName) {
          setSelectedFacilityName(data.facilityName)
        }
      }
    } catch (e) {
      console.error('Failed to fetch client hierarchy:', e)
    }
    setLoadingHierarchy(false)
  }




  // Handle image album click
  const handleImageAlbumClick = (images: string[], startIndex: number = 0) => {
    setViewerImages(images)
    setCurrentImageIndex(startIndex)
    setIsImageViewerOpen(true)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % viewerImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + viewerImages.length) % viewerImages.length)
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
        
        // Token is valid, set authenticated and fetch data
        setIsAuthenticated(true)
        await fetchClientHierarchy()
        
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
            <h1 className="text-2xl sm:text-3xl font-bold text-orange-800">クライアントダッシュボード</h1>
            <p className="text-gray-700 mt-2 sm:mt-4">施設の清掃記録を確認</p>
          </div>

          {/* Facility Info */}
          {selectedFacilityId && (
            <Card className="bg-white shadow-lg border-4 border-blue-300 mb-6">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-bold text-orange-600 flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>施設情報</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-600 text-lg">{selectedFacilityId}</h3>
                    {selectedFacilityName && (
                      <p className="text-sm text-gray-600 mt-1">{selectedFacilityName}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hierarchy Display */}
          {loadingHierarchy ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500">データを読み込み中...</p>
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
                    <div className="text-slate-600">{expandedFacilities.has(facilityId) ? '▼' : '▶'}</div>
                  </div>

                  {/* Facility Content */}
                  {expandedFacilities.has(facilityId) && facilityData.years && (
                    <div className="mt-4 space-y-3">
                      {Object.entries(facilityData.years).map(([year, yearData]: [string, any]) => (
                        <div key={year} className="ml-4 border-l-2 border-green-200 pl-4">
                          {/* Year Header */}
                          <div 
                            className="flex items-center justify-between cursor-pointer hover:bg-blue-50 p-2 rounded"
                            onClick={() => toggleDate(facilityId, year)}
                          >
                            <h4 className="font-medium text-blue-700">{year}年</h4>
                            <div className="text-blue-600">{expandedDates.has(`${facilityId}-${year}`) ? '▼' : '▶'}</div>
                          </div>

                          {/* Year Content */}
                          {expandedDates.has(`${facilityId}-${year}`) && yearData && (
                            <div className="mt-2 space-y-2">
                              {Object.entries(yearData).map(([month, monthData]: [string, any]) => (
                                <div key={month} className="ml-4 border-l-2 border-blue-200 pl-4">
                                  {/* Month Header */}
                                  <div 
                                    className="flex items-center justify-between cursor-pointer hover:bg-blue-50 p-2 rounded"
                                    onClick={() => toggleDate(facilityId, `${year}-${month}`)}
                                  >
                                    <h5 className="font-medium text-blue-600">{month}月</h5>
                                    <div className="text-blue-500">{expandedDates.has(`${facilityId}-${year}-${month}`) ? '▼' : '▶'}</div>
                                  </div>

                                  {/* Month Content */}
                                  {expandedDates.has(`${facilityId}-${year}-${month}`) && monthData && (
                                    <div className="mt-2 space-y-2">
                                      {Object.entries(monthData).map(([day, dayData]: [string, any]) => (
                                        <div key={day} className="ml-4 border-l-2 border-blue-200 pl-4">
                                          {/* Day Header */}
                                          <div 
                                            className="flex items-center justify-between cursor-pointer hover:bg-blue-50 p-2 rounded"
                                            onClick={() => toggleDate(facilityId, `${year}-${month}-${day}`)}
                                          >
                                            <h6 className="font-medium text-blue-500">{day}日</h6>
                                            <div className="text-blue-400">{expandedDates.has(`${facilityId}-${year}-${month}-${day}`) ? '▼' : '▶'}</div>
                                          </div>

                                          {/* Day Content */}
                                          {expandedDates.has(`${facilityId}-${year}-${month}-${day}`) && dayData && (
                                            <div className="mt-2 space-y-2">
                                              {Object.entries(dayData).map(([room, roomData]: [string, any]) => (
                                                <div key={room} className="ml-4 border-l-2 border-green-200 pl-4">
                                                  {/* Room Header */}
                                                  <div 
                                                    className="flex items-center justify-between cursor-pointer hover:bg-indigo-50 p-2 rounded"
                                                    onClick={() => toggleRoom(facilityId, `${year}-${month}-${day}`, room)}
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
                                                            onClick={() => toggleBeforeAfter(facilityId, `${year}-${month}-${day}`, room, beforeAfter)}
                                                          >
                                                            <span className="font-medium text-indigo-600">{beforeAfter === 'before' ? '清掃前' : '清掃後'}</span>
                                                            <div className="text-indigo-500">{expandedBeforeAfter.has(`${facilityId}-${year}-${month}-${day}-${room}-${beforeAfter}`) ? '▼' : '▶'}</div>
                                                          </div>

                                                          {/* Images Grid */}
                                                          {expandedBeforeAfter.has(`${facilityId}-${year}-${month}-${day}-${room}-${beforeAfter}`) && images && images.length > 0 && (
                                                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                              {images.map((image: any, index: number) => (
                                                                <div key={index} className="relative group">
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
        </div>
      </main>

      {/* Enhanced Image Viewer Modal - Exact format from staff-dashboard */}
      {isImageViewerModalOpen && (
        <div 
          className="fixed inset-0 z-[10050] flex items-center justify-center bg-black bg-opacity-95 p-4 animate-in fade-in duration-300"
          onClick={closeImageViewer}
        >
          <div 
            className="relative z-[10060] w-[90vw] h-[90vh] max-w-7xl max-h-full flex flex-col animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 right-4 text-white text-2xl font-bold cursor-pointer hover:text-gray-300 transition-all duration-200 hover:scale-110 z-10 bg-black bg-opacity-60 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
              onClick={closeImageViewer}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex-1 flex items-center justify-center">
              <img 
                className="min-w-full min-h-full object-contain rounded-lg shadow-2xl"
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
              画像アルバム ({currentImageIndex + 1} / {viewerImages.length})
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
    </div>
  )
}
