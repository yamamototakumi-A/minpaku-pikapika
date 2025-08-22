"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Building2, CheckCircle, Lock, AlertCircle, User } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { authService, RegisterData } from "@/lib/auth"

interface Company {
  id: string;
  companyId: string;
  type: string;
}

export default function IndividualRegister() {
  const [formData, setFormData] = useState<RegisterData>({
    surname: "",
    mainName: "",
    companyId: "",
    role: "",
    userId: "",
    password: "",
    confirmPassword: "",
    address: "",
    lineUserId: ""
  })
  const [companies, setCompanies] = useState<Company[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch registered companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('http://localhost:8888/api/auth/companies')
        if (response.ok) {
          const data = await response.json()
          setCompanies(data.companies || [])
        }
      } catch (error) {
        console.error('Failed to fetch companies:', error)
      }
    }
    fetchCompanies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    const newErrors: Record<string, string> = {}
    
    if (!formData.surname) newErrors.surname = "姓を入力してください"
    if (!formData.mainName) newErrors.mainName = "名を入力してください"
    if (!formData.companyId) newErrors.companyId = "会社IDを選択してください"
    if (!formData.role) newErrors.role = "役職を選択してください"
    if (!formData.userId) newErrors.userId = "ユーザーIDを入力してください"
    if (!formData.password) newErrors.password = "パスワードを入力してください"
    if (!formData.confirmPassword) newErrors.confirmPassword = "パスワード確認を入力してください"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "パスワードが一致しません"

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await authService.registerCompany(formData)
        console.log('Individual registration successful:', response)
        setIsSubmitted(true)
      } catch (error: any) {
        console.error('Individual registration failed:', error)
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
    
    // Auto-set role based on selected company (no longer needed since we removed HQ/Branch selection)
    // Role will be manually selected as President or Staff
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto border-3 border-orange-500 bg-white shadow-2xl">
          <CardContent className="p-6 sm:p-8 text-center">
            <CheckCircle className="h-16 sm:h-20 w-16 sm:w-20 text-orange-500 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-4">登録完了</h2>
            <p className="text-gray-700 mb-6 text-base sm:text-lg">
              個人登録が完了しました。<br />
              ログインしてサービスをご利用ください。
            </p>
            <div className="space-y-2 text-sm text-gray-600 mb-6 text-left border border-gray-200 p-4 rounded-lg bg-gray-50">
              <p><span className="font-medium">姓:</span> {formData.surname}</p>
              <p><span className="font-medium">名:</span> {formData.mainName}</p>
              <p><span className="font-medium">会社ID:</span> {formData.companyId}</p>
              <p><span className="font-medium">役職:</span> {formData.role === "president" ? "社長" : "スタッフ"}</p>
              <p><span className="font-medium">ユーザーID:</span> {formData.userId}</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">個人登録</h1>
          </div>

          <Card className="border-3 border-orange-500 bg-white shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Surname */}
                <div className="space-y-1">
                  <Label htmlFor="surname" className="text-base font-medium text-black">姓 *</Label>
                  <Input
                    id="surname"
                    value={formData.surname}
                    onChange={(e) => handleInputChange("surname", e.target.value)}
                    placeholder="例: 田中"
                    className={`h-10 sm:h-12 text-base ${errors.surname ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"}`}
                  />
                  {errors.surname && <p className="text-red-500 text-sm mt-1">{errors.surname}</p>}
                </div>

                {/* Main Name */}
                <div className="space-y-1">
                  <Label htmlFor="mainName" className="text-base font-medium text-black">名 *</Label>
                  <Input
                    id="mainName"
                    value={formData.mainName}
                    onChange={(e) => handleInputChange("mainName", e.target.value)}
                    placeholder="例: 太郎"
                    className={`h-10 sm:h-12 text-base ${errors.mainName ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"}`}
                  />
                  {errors.mainName && <p className="text-red-500 text-sm mt-1">{errors.mainName}</p>}
                </div>

                {/* Company ID Selection */}
                <div className="space-y-1">
                  <Label htmlFor="companyId" className="text-base font-medium text-black">会社ID *</Label>
                  <Select value={formData.companyId} onValueChange={(value: string) => handleInputChange("companyId", value)}>
                    <SelectTrigger className={`h-10 sm:h-12 text-base ${errors.companyId ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"}`}>
                      <SelectValue placeholder="登録済みの会社IDを選択してください" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-60 overflow-y-auto">
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.companyId} className="text-base">
                          {company.companyId} - {company.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.companyId && <p className="text-red-500 text-sm mt-1">{errors.companyId}</p>}
                  {companies.length === 0 && (
                    <p className="text-orange-600 text-sm mt-1">※ 先に会社登録を行ってください</p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <Label htmlFor="role" className="text-base font-medium text-black">役職 *</Label>
                  <Select value={formData.role} onValueChange={(value: string) => handleInputChange("role", value)}>
                    <SelectTrigger className={`h-10 sm:h-12 text-base ${errors.role ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"}`}>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-60 overflow-y-auto">
                      <SelectItem value="president" className="text-base">社長</SelectItem>
                      <SelectItem value="staff" className="text-base">スタッフ</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                  <p className="text-orange-600 text-sm mt-1">※ 各会社には1人の社長しか登録できません。既に社長が存在する場合はスタッフとして登録してください。</p>
                </div>

                {/* User ID */}
                <div className="space-y-1">
                  <Label htmlFor="userId" className="text-base font-medium text-black">ユーザーID *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="userId"
                      value={formData.userId}
                      onChange={(e) => handleInputChange("userId", e.target.value)}
                      placeholder="例: tanaka_taro"
                      className={`pl-10 h-10 sm:h-12 text-base ${errors.userId ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"}`}
                    />
                  </div>
                  {errors.userId && <p className="text-red-500 text-sm mt-1">{errors.userId}</p>}
                </div>

                {/* LINE User ID */}
                <div className="space-y-1">
                  <Label htmlFor="lineUserId" className="text-base font-medium text-black">LINE User ID (任意)</Label>
                  <Input
                    id="lineUserId"
                    value={formData.lineUserId}
                    onChange={(e) => handleInputChange("lineUserId", e.target.value)}
                    placeholder="U1234567890abcdef... (LINE通知を受信する場合)"
                    className="h-10 sm:h-12 text-base border-2 border-gray-300 focus:border-orange-500"
                  />
                  <p className="text-orange-600 text-sm mt-1">※ LINE通知を受信したい場合のみ入力してください。後から設定することも可能です。</p>
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
                  disabled={isLoading || companies.length === 0}
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
