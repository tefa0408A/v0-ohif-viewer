"use client"

import { useState } from "react"
import { LoginForm } from "@/components/login-form"
import { StudyList } from "@/components/study-list"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />
  }

  return <StudyList />
}
