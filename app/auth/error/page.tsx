import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ErrorPage({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="w-full max-w-sm">
        <Card className="border-red-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-red-900">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {params?.error ? (
              <p className="text-sm text-red-700">Error code: {params.error}</p>
            ) : (
              <p className="text-sm text-red-700">An unspecified error occurred.</p>
            )}
            <Link href="/auth/login">
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
