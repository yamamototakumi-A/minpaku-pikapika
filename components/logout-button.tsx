"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { authService } from "@/lib/auth"

export default function LogoutButton() {
  const handleLogout = () => {
    authService.logout()
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="border-2 border-red-300 text-red-600 hover:bg-red-50"
    >
      <LogOut className="h-4 w-4 mr-2" />
      ログアウト
    </Button>
  )
}
