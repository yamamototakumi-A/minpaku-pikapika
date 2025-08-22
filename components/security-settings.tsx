"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Settings, Lock, User, AlertCircle, CheckCircle, Shield } from 'lucide-react'
import { authService } from "@/lib/auth"

interface SecuritySettingsProps {
  className?: string
}

export default function SecuritySettings({ className }: SecuritySettingsProps) {
  const [isVerificationOpen, setIsVerificationOpen] = useState(false)
  const [isManagementOpen, setIsManagementOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Verification form data
  const [verificationData, setVerificationData] = useState({
    currentUserId: "",
    currentPassword: ""
  })
  
  // Management form data
  const [managementData, setManagementData] = useState({
    newUserId: "",
    newPassword: "",
    confirmPassword: ""
  })

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      // Verify current credentials
      await authService.verifyCredentials({
        currentUserId: verificationData.currentUserId,
        currentPassword: verificationData.currentPassword
      })
      
      // If verification successful, close verification modal and open management modal
      setIsVerificationOpen(false)
      setIsManagementOpen(true)
      // Keep the verification data for the management form
      
    } catch (error: any) {
      setError(error.message || '認証に失敗しました。ユーザーIDとパスワードを確認してください。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManagementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    
    // Validate that at least one field is being updated
    if (!managementData.newUserId && !managementData.newPassword) {
      setError('新しいユーザーIDまたはパスワードを入力してください')
      setIsLoading(false)
      return
    }
    
    // Validate password confirmation if new password is provided
    if (managementData.newPassword && managementData.newPassword !== managementData.confirmPassword) {
      setError('新しいパスワードが一致しません')
      setIsLoading(false)
      return
    }
    
    try {
      // Call the backend API to update security settings
      const securityData: any = {
        currentUserId: verificationData.currentUserId,
        currentPassword: verificationData.currentPassword
      }
      
      if (managementData.newUserId) {
        securityData.newUserId = managementData.newUserId
      }
      
      if (managementData.newPassword) {
        securityData.newPassword = managementData.newPassword
        securityData.confirmPassword = managementData.confirmPassword
      }
      
      await authService.updateSecurity(securityData)
      
      setSuccess('セキュリティ設定が更新されました')
      setManagementData({
        newUserId: "",
        newPassword: "",
        confirmPassword: ""
      })
      setVerificationData({ currentUserId: "", currentPassword: "" })
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setIsManagementOpen(false)
        setSuccess("")
      }, 2000)
      
    } catch (error: any) {
      setError(error.message || 'セキュリティ設定の更新に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string, formType: 'verification' | 'management') => {
    if (formType === 'verification') {
      setVerificationData(prev => ({ ...prev, [field]: value }))
    } else {
      setManagementData(prev => ({ ...prev, [field]: value }))
    }
    if (error) setError("")
    if (success) setSuccess("")
  }

  const openSecuritySettings = () => {
    setIsVerificationOpen(true)
    setError("")
    setSuccess("")
    // Reset forms
    setVerificationData({ currentUserId: "", currentPassword: "" })
    setManagementData({ newUserId: "", newPassword: "", confirmPassword: "" })
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openSecuritySettings}
        className={`border-orange-300 text-orange-600 hover:bg-orange-50 ${className}`}
      >
        <Settings className="h-4 w-4 mr-2" />
        セキュリティ設定
      </Button>

      {/* Verification Modal */}
      <Dialog open={isVerificationOpen} onOpenChange={setIsVerificationOpen}>
        <DialogContent className="max-w-sm bg-white border-2 border-gray-300 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-gray-800">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>認証確認</span>
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              セキュリティ設定を変更するには、現在の認証情報を入力してください。
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="currentUserId" className="text-sm font-medium">現在のユーザーID</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="currentUserId"
                  value={verificationData.currentUserId}
                  onChange={(e) => handleInputChange("currentUserId", e.target.value, 'verification')}
                  placeholder="現在のユーザーID"
                  className="pl-10 h-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">現在のパスワード</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="currentPassword"
                  type="password"
                  value={verificationData.currentPassword}
                  onChange={(e) => handleInputChange("currentPassword", e.target.value, 'verification')}
                  placeholder="現在のパスワード"
                  className="pl-10 h-10"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}
            
            <div className="flex space-x-2 pt-2">
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? '確認中...' : '認証確認'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsVerificationOpen(false)}
                disabled={isLoading}
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Management Modal */}
      <Dialog open={isManagementOpen} onOpenChange={setIsManagementOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-gray-300 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-gray-800">
              <Settings className="h-5 w-5 text-green-600" />
              <span>セキュリティ設定</span>
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleManagementSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              変更したい項目のみ入力してください。
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="newUserId" className="text-sm font-medium">新しいユーザーID</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="newUserId"
                  value={managementData.newUserId}
                  onChange={(e) => handleInputChange("newUserId", e.target.value, 'management')}
                  placeholder="新しいユーザーID（変更する場合）"
                  className="pl-10 h-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">新しいパスワード</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="newPassword"
                  type="password"
                  value={managementData.newPassword}
                  onChange={(e) => handleInputChange("newPassword", e.target.value, 'management')}
                  placeholder="新しいパスワード（変更する場合）"
                  className="pl-10 h-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">新しいパスワード確認</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={managementData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value, 'management')}
                  placeholder="新しいパスワードを再入力"
                  className="pl-10 h-10"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            )}
            
            <div className="flex space-x-2 pt-2">
              <Button 
                type="submit" 
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? '更新中...' : '更新'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsManagementOpen(false)}
                disabled={isLoading}
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
