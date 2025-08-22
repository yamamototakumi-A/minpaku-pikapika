"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Building2, CheckCircle, Lock, MapPin, AlertCircle } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { authService, RegisterData } from "@/lib/auth"

const japanesePrefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
]

export default function CompanyRegister() {
  const [formData, setFormData] = useState<RegisterData>({
    companyId: "",
    role: "",
    password: "",
    confirmPassword: "",
    address: ""
  })
  const [selectedPrefecture, setSelectedPrefecture] = useState("")
  const [detailedAddress, setDetailedAddress] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    // Combine prefecture and detailed address
    const fullAddress = selectedPrefecture && detailedAddress ? `${selectedPrefecture} ${detailedAddress}` : ""
    
    const newErrors: Record<string, string> = {}
    
    if (!formData.companyId) newErrors.companyId = "会社IDを入力してください"
    if (!formData.role) newErrors.role = "役職を選択してください"
    if (!formData.password) newErrors.password = "パスワードを入力してください"
    if (!formData.confirmPassword) newErrors.confirmPassword = "パスワード確認を入力してください"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "パスワードが一致しません"
    if (!selectedPrefecture) newErrors.prefecture = "都道府県を選択してください"
    if (!detailedAddress) newErrors.detailedAddress = "住所を入力してください"

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      try {
        const registrationData = {
          ...formData,
          address: fullAddress
        }
        const response = await authService.registerCompanyInfo(registrationData)
        console.log('Company registration successful:', response)
        setIsSubmitted(true)
      } catch (error: any) {
        console.error('Company registration failed:', error)
        setError(error.message || '登録に失敗しました')
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto border-3 border-orange-500 bg-white shadow-2xl">
          <CardContent className="p-6 sm:p-8 text-center">
            <CheckCircle className="h-16 sm:h-20 w-16 sm:w-20 text-orange-500 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-4">登録完了</h2>
            <p className="text-gray-700 mb-6 text-base sm:text-lg">
              会社登録が完了しました。<br />
              ログインしてサービスをご利用ください。
            </p>
            <div className="space-y-2 text-sm text-gray-600 mb-6 text-left border border-gray-200 p-4 rounded-lg bg-gray-50">
              <p><span className="font-medium">会社ID:</span> {formData.companyId}</p>
              <p><span className="font-medium">役職:</span> {formData.role === "headquarter" ? "本社" : "支社"}</p>
              <p><span className="font-medium">住所:</span> {selectedPrefecture} {detailedAddress}</p>
            </div>
            <Link href="/">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 sm:h-14 text-base sm:text-lg font-medium">
                ログインページに戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <header className="bg-white/95 backdrop-blur-sm border-b border-orange-200 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/role-selection" className="flex items-center space-x-2 text-black hover:text-orange-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">戻る</span>
            </Link>
            <Image
              src="/logo.png"
              alt="ピカピカ Logo"
              width={120}
              height={60}
              className="h-10 sm:h-12 w-auto"
            />
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">会社登録</h1>
          </div>

          <Card className="border-3 border-orange-500 bg-white shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Company ID */}
                <div className="space-y-1">
                  <Label htmlFor="companyId" className="text-base font-medium text-black">会社ID *</Label>
                  <Input
                    id="companyId"
                    value={formData.companyId}
                    onChange={(e) => handleInputChange("companyId", e.target.value)}
                    placeholder="例: Tokyodo022"
                    className={`h-10 sm:h-12 text-base ${errors.companyId ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"}`}
                  />
                  {errors.companyId && <p className="text-red-500 text-sm mt-1">{errors.companyId}</p>}
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <Label htmlFor="role" className="text-base font-medium text-black">役職 *</Label>
                  <Select value={formData.role} onValueChange={(value: string) => handleInputChange("role", value)}>
                    <SelectTrigger className={`h-10 sm:h-12 text-base ${errors.role ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"}`}>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-60">
                      <SelectItem value="headquarter" className="text-base">本社</SelectItem>
                      <SelectItem value="branch" className="text-base">支社</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                  <p className="text-orange-600 text-sm mt-1">※ 本社は1つしか登録できません。既に本社が存在する場合は支社として登録してください。</p>
                </div>

                {/* Address Section - Split into Prefecture and Detailed Address */}
                <div className="space-y-3">
                  <Label className="text-base font-medium text-black">住所 *</Label>
                  
                  {/* Prefecture Selection */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="prefecture" className="text-sm text-gray-600">都道府県</Label>
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">?</span>
                      </div>
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">必須</span>
                    </div>
                    <Select value={selectedPrefecture} onValueChange={(value: string) => {
                      setSelectedPrefecture(value)
                      if (errors.prefecture) {
                        setErrors(prev => ({ ...prev, prefecture: "" }))
                      }
                    }}>
                      <SelectTrigger className={`h-10 sm:h-12 text-base ${errors.prefecture ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"}`}>
                        <SelectValue placeholder="都道府県を選択してください" />
                      </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto bg-white">
                          {japanesePrefectures.map((prefecture) => (
                            <SelectItem key={prefecture} value={prefecture} className="text-base">
                              {prefecture}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      
                    </Select>
                    {errors.prefecture && <p className="text-red-500 text-sm mt-1">{errors.prefecture}</p>}
                  </div>
                  
                  {/* Detailed Address */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="detailedAddress" className="text-sm text-gray-600">住所(番地まで)?</Label>
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">?</span>
                      </div>
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">必須</span>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="detailedAddress"
                        value={detailedAddress}
                        onChange={(e) => {
                          setDetailedAddress(e.target.value)
                          if (errors.detailedAddress) {
                            setErrors(prev => ({ ...prev, detailedAddress: "" }))
                          }
                        }}
                        placeholder="例: 八幡平市平舘"
                        className={`pl-10 h-10 sm:h-12 text-base ${errors.detailedAddress ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"}`}
                      />
                    </div>
                    {errors.detailedAddress && <p className="text-red-500 text-sm mt-1">{errors.detailedAddress}</p>}
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-base font-medium text-black">パスワード *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="8文字以上で入力"
                      className={`pl-10 h-10 sm:h-12 text-base ${errors.password ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"}`}
                    />
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-base font-medium text-black">パスワード確認 *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder="パスワードを再入力"
                      className={`pl-10 h-10 sm:h-12 text-base ${errors.confirmPassword ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"}`}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 sm:h-14 text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? '登録中...' : '登録する'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
