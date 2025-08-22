"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Lock, AlertCircle, Building2 } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { authService, LoginData } from "@/lib/auth"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [loginType, setLoginType] = useState<'userId' | 'facilityId'>('userId')
  const [loginData, setLoginData] = useState<LoginData>({
    userId: "",
    password: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)

  // Prevent hydration mismatch by ensuring component is mounted on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle cooldown countdown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(prev => Math.max(0, prev - 1))
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      // Prepare login data based on login type
      const loginPayload = {
        password: loginData.password,
        ...(loginType === 'userId' ? { userId: loginData.userId } : { facilityId: loginData.userId })
      }
      
      console.log('🔐 Attempting login with payload:', loginPayload)
      
      const response = await authService.login(loginPayload)
      console.log('✅ Login successful:', response)
      console.log('🔍 Response details:', {
        token: response.token ? 'Token exists' : 'No token',
        user: response.user,
        effectiveRole: (response as any).effectiveRole,
        companyRole: (response as any).user?.companyRole
      })
      
      // Redirect based on user role
      console.log('🔄 Starting redirect process...')
      await authService.redirectBasedOnRole()
    } catch (error: any) {
      console.error('❌ Login failed:', error)
      
      // Check if it's a cooldown error
      if (error.message.includes('Please wait') && error.message.includes('seconds')) {
        const match = error.message.match(/(\d+)/)
        if (match) {
          setCooldown(parseInt(match[1]))
        }
      }
      
      setError(error.message || 'ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginTypeChange = (type: 'userId' | 'facilityId') => {
    setLoginType(type)
    setLoginData({ userId: "", password: "" })
    setError("")
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-orange-200 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src="/logo.png"
                alt="ピカピカ Logo"
                width={120}
                height={60}
                className="h-12 w-auto"
              />
              <div className="text-sm text-gray-600">
                <p className="font-medium">ピカピカ清掃システム</p>
                <p>Japanese Cleaning Company Management System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">ログイン</h1>
            <p className="text-gray-600">アカウントにログインしてください</p>
          </div>

          <div className="bg-white rounded-lg shadow-xl border-3 border-orange-500 p-8">
            {/* Login Type Toggle */}
            <div className="mb-6">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => handleLoginTypeChange('userId')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    loginType === 'userId'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>会社・スタッフ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoginTypeChange('facilityId')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    loginType === 'facilityId'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>クライアント</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* User ID or Facility ID */}
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-base font-medium text-black">
                  {loginType === 'userId' ? 'ユーザーID' : '施設ID'}
                </Label>
                <div className="relative">
                  {loginType === 'userId' ? (
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  ) : (
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  )}
                  <Input
                    id="userId"
                    type="text"
                    value={loginData.userId}
                    onChange={(e) => setLoginData(prev => ({ ...prev, userId: e.target.value }))}
                    placeholder={loginType === 'userId' ? 'ユーザーIDを入力' : '施設IDを入力'}
                    className="pl-10 h-12 text-base border-2 border-gray-300 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium text-black">パスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="パスワードを入力"
                    className="pl-10 h-12 text-base border-2 border-gray-300 focus:border-orange-500"
                    required
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

              {/* Cooldown Indicator */}
              {cooldown > 0 && (
                <div className="flex items-center justify-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-orange-700 text-sm">
                    ログイン試行が多すぎます。{cooldown}秒後に再試行してください。
                  </span>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading || cooldown > 0}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'ログイン中...' : cooldown > 0 ? `${cooldown}秒後に再試行可能` : 'ログイン'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm mb-4">アカウントをお持ちでない方は</p>
              <Link href="/role-selection">
                <Button
                  variant="outline"
                  className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  新規登録
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
