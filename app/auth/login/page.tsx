"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [userEmail, setUserEmail] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setSubmitting(true)
    setLoginError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: userPassword,
      })
      if (error) throw error
      // redirect on success
      router.push("/scraper")
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="w-full max-w-sm">
        <Card className="border-amber-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-900">Login</CardTitle>
            <CardDescription className="text-amber-700">Enter your credentials to access the scraper</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-amber-900">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-amber-900">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
                {loginError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                    {loginError}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={submitting}
                >
                  {submitting ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-amber-700">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-4 text-amber-800 hover:text-amber-900">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
