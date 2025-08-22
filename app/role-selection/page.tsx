"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Building2, Users } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"

export default function RoleSelection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-orange-200 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-black hover:text-orange-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">戻る</span>
            </Link>
            <Image
              src="/logo.png"
              alt="ピカピカ Logo"
              width={120}
              height={60}
              className="h-12 w-auto"
            />
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-black mb-2">登録タイプを選択</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Company Side */}
            <Card className="border-3 border-orange-500 hover:shadow-2xl transition-all duration-300 group bg-white">
              <CardHeader className="text-center pb-6">
                <Users className="h-20 w-20 text-orange-600 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                <CardTitle className="text-3xl font-bold text-orange-500">法人・個人</CardTitle>
                <p className="text-orange-500 text-lg">清掃サービス提供側</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-8">
                  <Link href="/company-register">
                    <Button
                      size="lg"
                      className="w-full h-16 text-lg font-bold border-3 bg-white border-orange-500 text-orange-600 hover:bg-orange-50 shadow-lg hover:shadow-xl transition-all duration-300 mb-4"
                    >
                      会社登録
                    </Button>
                  </Link>
                  <Link href="/individual-register">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full h-16 text-lg font-bold border-3 border-orange-500 text-orange-600 hover:bg-orange-50 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      個人登録
                    </Button>
                  </Link>
                </div>
                <div className="text-sm text-orange-500 pt-6 border-t border-gray-200 space-y-2">
                  <p>• 本社社長・支社社長・スタッフ</p>
                </div>
              </CardContent>
            </Card>

            {/* Client Side */}
            <Card className="border-3 border-gray-300 hover:shadow-2xl transition-all duration-300 group bg-white">
              <CardHeader className="text-center pb-6">
                <Building2 className="h-20 w-20 text-gray-500 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                <CardTitle className="text-3xl font-bold text-black">クライアント</CardTitle>
                <p className="text-gray-600 text-lg">清掃サービス利用側</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <Link href="/client-register">
                  <Button
                    size="lg"
                    className="w-full h-16 text-lg font-bold bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    クライアント登録
                  </Button>
                </Link>
                <div className="text-sm text-gray-600 pt-6 border-t border-gray-200 space-y-2">
                  <p>• 施設管理者</p>
                  <p>• オーナー</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
