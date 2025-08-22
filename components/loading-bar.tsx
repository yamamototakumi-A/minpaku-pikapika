"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

interface LoadingBarProps {
  isLoading: boolean
  message?: string
  progress?: number
  showProgress?: boolean
  eta?: number
  uploadSpeed?: number
}

export function LoadingBar({ 
  isLoading, 
  message = "処理中...", 
  progress: realProgress, 
  showProgress = false,
  eta,
  uploadSpeed
}: LoadingBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isLoading) {
      if (realProgress !== undefined && showProgress) {
        // Use real progress when provided
        setProgress(realProgress)
      } else {
        // Fallback to animated progress for general loading
        setProgress(0)
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval)
              return 100
            }
            return prev + 10
          })
        }, 200)

        return () => clearInterval(interval)
      }
    } else {
      setProgress(0)
    }
  }, [isLoading, realProgress, showProgress])

  if (!isLoading) return null

  // Format upload speed for display
  const formatUploadSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond >= 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
    } else if (bytesPerSecond >= 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
    } else {
      return `${bytesPerSecond.toFixed(0)} B/s`
    }
  }

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[200000]">
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-blue-100">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg">
            {progress === 100 ? (
              <CheckCircle2 className="h-8 w-8 text-white drop-shadow-lg" />
            ) : (
              <Loader2 className="h-8 w-8 text-white animate-spin drop-shadow-lg" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{message}</h3>
          <p className="text-sm text-gray-600">お待ちください...</p>
        </div>
        
        {showProgress && (
          <div className="relative">
            <div className="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Progress dots */}
            <div className="flex justify-center space-x-2 mb-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i < Math.floor(progress / 10) 
                      ? 'bg-blue-500 shadow-lg scale-110' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            {/* Upload speed and ETA */}
            {(uploadSpeed || eta !== undefined) && (
              <div className="text-center space-y-2 mb-4">
                {uploadSpeed && (
                  <div className="text-sm text-blue-600">
                    アップロード速度: {formatUploadSpeed(uploadSpeed)}
                  </div>
                )}
                {eta !== undefined && eta > 0 && (
                  <div className="text-sm text-blue-600">
                    残り時間: 約{eta}秒
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 rounded-full">
            <span className="text-lg font-bold text-blue-700">{progress}%</span>
            <span className="text-sm text-blue-600 ml-2">完了</span>
          </div>
        </div>
      </div>
    </div>
  )
}
