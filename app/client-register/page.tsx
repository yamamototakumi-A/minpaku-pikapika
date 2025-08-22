"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Building2, CheckCircle, Lock, AlertCircle, HelpCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { authService, ClientRegisterData } from "@/lib/auth"

export default function ClientRegister() {
  const PREFECTURES = [
    "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
    "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
    "新潟県","富山県","石川県","福井県","山梨県","長野県",
    "岐阜県","静岡県","愛知県","三重県",
    "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
    "鳥取県","島根県","岡山県","広島県","山口県",
    "徳島県","香川県","愛媛県","高知県",
    "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"
  ]
  const [formData, setFormData] = useState<ClientRegisterData>({
    surname: "",
    mainName: "",
    prefectureCity: "",
    addressDetail: "",
    facilityId: "",
    password: "",
    confirmPassword: "",
    lineUserId: ""
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    const newErrors: Record<string, string> = {}
    
    if (!formData.surname) newErrors.surname = "姓を入力してください"
    if (!formData.mainName) newErrors.mainName = "名を入力してください"
    if (!formData.prefectureCity) newErrors.prefectureCity = "都道府県・市区町村を入力してください"
    if (!formData.addressDetail) newErrors.addressDetail = "丁目・番地・建物名などの詳細を入力してください"
    if (!formData.facilityId) newErrors.facilityId = "施設IDを入力してください"
    if (!formData.password) newErrors.password = "パスワードを入力してください"
    if (!formData.confirmPassword) newErrors.confirmPassword = "パスワード確認を入力してください"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "パスワードが一致しません"
    if (formData.password.length < 8) newErrors.password = "パスワードは8文字以上で入力してください"

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      try {
        // Validate that facilityId is not undefined
        if (!formData.facilityId) {
          setError('施設IDは必須です')
          setIsLoading(false)
          return
        }
        
        const registrationData = {
          surname: formData.surname,
          mainName: formData.mainName,
          prefectureCity: formData.prefectureCity,
          addressDetail: formData.addressDetail,
          facilityId: formData.facilityId,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          lineUserId: formData.lineUserId
        }
        const response = await authService.registerClient(registrationData)
        console.log('Client registration successful:', response)
        setIsSubmitted(true)
      } catch (error: any) {
        console.error('Client registration failed:', error)
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
        <Card className="max-w-md mx-auto border-3 border-gray-400 bg-white shadow-2xl">
          <CardContent className="p-6 sm:p-8 text-center">
            <CheckCircle className="h-16 sm:h-20 w-16 sm:w-20 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-4">登録完了</h2>
            <p className="text-gray-700 mb-6 text-base sm:text-lg">
              クライアント登録が完了しました。<br />
              ログインしてサービスをご利用ください。
            </p>
            <div className="space-y-2 text-sm text-gray-600 mb-6 text-left border border-gray-200 p-4 rounded-lg bg-gray-50">
              <p><span className="font-medium">施設ID:</span> {formData.facilityId}</p>
            </div>
            <Link href="/">
              <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white h-12 sm:h-14 text-base sm:text-lg font-medium">
                ログインページに戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-orange-300/40 to-amber-300/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-gradient-to-br from-yellow-300/40 to-orange-300/40 blur-3xl" />
      <main className="relative container mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-700 via-amber-600 to-yellow-600 tracking-tight">クライアント登録</h1>
          </div>
          <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-br from-orange-400/50 via-amber-400/50 to-yellow-400/50 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_10px_30px_rgba(0,0,0,0.06)]">
          <Card className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl">
          <Link href="/role-selection" className="ml-6 flex items-center space-x-2 text-black hover:text-orange-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">戻る</span>
            </Link>
            <CardContent className="p-5 sm:p-7">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300/60 to-transparent mb-4" />
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="surname" className="text-base font-medium text-black">姓 *</Label>
                    <Input
                      id="surname"
                      value={formData.surname}
                      onChange={(e) => handleInputChange("surname", e.target.value)}
                      placeholder="山田"
                      className={`h-10 sm:h-12 text-base ${errors.surname ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"} bg-white/70 backdrop-blur-sm`}
                    />
                    {errors.surname && <p className="text-red-500 text-sm mt-1">{errors.surname}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mainName" className="text-base font-medium text-black">名 *</Label>
                    <Input
                      id="mainName"
                      value={formData.mainName}
                      onChange={(e) => handleInputChange("mainName", e.target.value)}
                      placeholder="太郎"
                      className={`h-10 sm:h-12 text-base ${errors.mainName ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"} bg-white/70 backdrop-blur-sm`}
                    />
                    {errors.mainName && <p className="text-red-500 text-sm mt-1">{errors.mainName}</p>}
                  </div>
                </div>

                {/* Address fields */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium text-black">住所 *</Label>
                  </div>

                  {/* Prefecture */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-black">都道府県</span>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-[11px] px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">必須</span>
                    </div>
                    <Select value={formData.prefectureCity} onValueChange={(v) => handleInputChange("prefectureCity", v)}>
                      <SelectTrigger className={`h-10 sm:h-12 text-base ${errors.prefectureCity ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"} bg-white/70 backdrop-blur-sm`}>
                        <SelectValue placeholder="都道府県を選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {PREFECTURES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.prefectureCity && <p className="text-red-500 text-sm mt-1">{errors.prefectureCity}</p>}
                  </div>

                  {/* Address detail */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-black">住所(番地まで?)</span>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-[11px] px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">必須</span>
                    </div>
                    <Input
                      id="addressDetail"
                      value={formData.addressDetail}
                      onChange={(e) => handleInputChange("addressDetail", e.target.value)}
                      placeholder="例: 八幡平市平舘"
                      className={`h-10 sm:h-12 text-base ${errors.addressDetail ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"} bg-white/70 backdrop-blur-sm`}
                    />
                    {errors.addressDetail && <p className="text-red-500 text-sm mt-1">{errors.addressDetail}</p>}
                  </div>
                </div>
                {/* Facility ID */}
                <div className="space-y-1">
                  <Label htmlFor="facilityId" className="text-base font-medium text-black">施設ID *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="facilityId"
                      value={formData.facilityId}
                      onChange={(e) => handleInputChange("facilityId", e.target.value)}
                      placeholder="例: FAC001"
                      className={`pl-10 h-10 sm:h-12 text-base ${errors.facilityId ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"} bg-white/70 backdrop-blur-sm`}
                    />
                  </div>
                  {errors.facilityId && <p className="text-red-500 text-sm mt-1">{errors.facilityId}</p>}
                </div>

                {/* LINE User ID */}
                <div className="space-y-1">
                  <Label htmlFor="lineUserId" className="text-base font-medium text-black">LINE User ID (任意)</Label>
                  <Input
                    id="lineUserId"
                    value={formData.lineUserId}
                    onChange={(e) => handleInputChange("lineUserId", e.target.value)}
                    placeholder="U1234567890abcdef... (LINE通知を受信する場合)"
                    className="h-10 sm:h-12 text-base border-2 border-gray-300 focus:border-orange-500 bg-white/70 backdrop-blur-sm"
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
                      className={`pl-10 h-10 sm:h-12 text-base ${errors.password ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"} bg-white/70 backdrop-blur-sm`}
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
                      className={`pl-10 h-10 sm:h-12 text-base ${errors.confirmPassword ? "border-red-500" : "border-2 border-gray-300 focus:border-orange-500"} bg-white/70 backdrop-blur-sm`}
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
                  className="w-full h-12 sm:h-14 text-lg sm:text-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r bg-orange-400 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600"
                >
                  {isLoading ? '登録中...' : 'クライアント登録する'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      </main>
    </div>
  )
}
