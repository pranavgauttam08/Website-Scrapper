import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="w-full max-w-sm">
        <Card className="border-amber-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-900">Check Your Email</CardTitle>
            <CardDescription className="text-amber-700">We sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-amber-800">
              You&apos;ve successfully signed up! Please check your email to confirm your account before signing in.
            </p>
            <Link href="/auth/login">
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
