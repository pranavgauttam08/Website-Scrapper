"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download, Copy, LogOut, Globe, Zap, MousePointer, ArrowDown, List } from "lucide-react"
import type { ScrapedSection } from "@/lib/scraper/types"

interface ScrapeResult {
  id: string
  url: string
  title: string
  sections: ScrapedSection[]
}

export default function ScraperPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [err, setErr] = useState("")
  const [enableJs, setEnableJs] = useState(false)
  const [enableClick, setEnableClick] = useState(false)
  const [enableScroll, setEnableScroll] = useState(false)
  const [enablePagination, setEnablePagination] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scrapeData, setScrapeData] = useState<ScrapeResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [openSections, setOpenSections] = useState<Set<number>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  // check if user is logged in
  useEffect(() => {
    async function checkUserAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setCurrentUser(user)
    }
    checkUserAuth()
  }, [router, supabase])

  const checkUrl = (val: string): boolean => {
    if (!val.trim()) {
      setErr("Please enter a URL")
      return false
    }
    try {
      const urlObj = new URL(val)
      if (!urlObj.protocol.startsWith("http")) {
        setErr("URL needs to start with http:// or https://")
        return false
      }
      setErr("")
      return true
    } catch {
      setErr("That doesn't look like a valid URL")
      return false
    }
  }

  const startScraping = async () => {
    if (!checkUrl(websiteUrl)) return

    setLoading(true)
    setErrorMsg("")
    setScrapeData(null)

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: websiteUrl,
          jsRendering: enableJs,
          interactions: {
            clickSelectors: enableClick ? ["button", "a.load-more"] : undefined,
            infiniteScroll: enableScroll,
            pagination: enablePagination
              ? {
                  enabled: true,
                  selector: ".next-page, .pagination a",
                }
              : undefined,
          },
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Something went wrong while scraping")
      }

      const resultData = await res.json()
      setScrapeData(resultData)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const downloadAsJson = () => {
    if (!scrapeData) return

    const jsonData = JSON.stringify(scrapeData, null, 2)
    const blob = new Blob([jsonData], { type: "application/json" })
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = downloadUrl
    a.download = `scrape-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(downloadUrl)
  }

  const copyJson = async () => {
    if (!scrapeData) return

    try {
      await navigator.clipboard.writeText(JSON.stringify(scrapeData, null, 2))
      alert("Copied!")
    } catch {
      alert("Couldn't copy to clipboard")
    }
  }

  // toggle section visibility
  const toggleSectionView = (idx: number) => {
    const updated = new Set(openSections)
    if (updated.has(idx)) {
      updated.delete(idx)
    } else {
      updated.add(idx)
    }
    setOpenSections(updated)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Website Scraper</h1>
            <p className="text-amber-700">Extract structured content from any website</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="border-amber-300 text-amber-900 bg-transparent">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Main scraping form */}
        {!scrapeData && (
          <Card className="border-amber-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Globe className="h-5 w-5" />
                Configure Scraping Options
              </CardTitle>
              <CardDescription className="text-amber-700">
                Enter a URL and customize how the content should be extracted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL field */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-amber-900">
                  Website URL
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => {
                    setWebsiteUrl(e.target.value)
                    setErr("")
                  }}
                  onBlur={() => websiteUrl && checkUrl(websiteUrl)}
                  className={`border-amber-200 focus:border-amber-500 ${err ? "border-red-500" : ""}`}
                />
                {err && <p className="text-sm text-red-600">{err}</p>}
              </div>

              {/* JS options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="js-rendering"
                    checked={enableJs}
                    onCheckedChange={(checked) => {
                      setEnableJs(checked === true)
                      // turn off other options if JS is disabled
                      if (!checked) {
                        setEnableClick(false)
                        setEnableScroll(false)
                        setEnablePagination(false)
                      }
                    }}
                    className="border-amber-400"
                  />
                  <Label htmlFor="js-rendering" className="flex items-center gap-2 text-amber-900 cursor-pointer">
                    <Zap className="h-4 w-4" />
                    Enable JavaScript Rendering
                  </Label>
                </div>

                {/* JS interaction sub-options */}
                {enableJs && (
                  <div className="ml-6 space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                    <p className="text-sm font-medium text-amber-900">Interaction Options</p>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="click-buttons"
                        checked={enableClick}
                        onCheckedChange={(checked) => setEnableClick(checked === true)}
                        disabled={!enableJs}
                        className="border-amber-400"
                      />
                      <Label htmlFor="click-buttons" className="flex items-center gap-2 text-amber-800 cursor-pointer">
                        <MousePointer className="h-4 w-4" />
                        Click on tabs and buttons
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="infinite-scroll"
                        checked={enableScroll}
                        onCheckedChange={(checked) => setEnableScroll(checked === true)}
                        disabled={!enableJs}
                        className="border-amber-400"
                      />
                      <Label
                        htmlFor="infinite-scroll"
                        className="flex items-center gap-2 text-amber-800 cursor-pointer"
                      >
                        <ArrowDown className="h-4 w-4" />
                        Infinite scroll
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pagination"
                        checked={enablePagination}
                        onCheckedChange={(checked) => setEnablePagination(checked === true)}
                        disabled={!enableJs}
                        className="border-amber-400"
                      />
                      <Label htmlFor="pagination" className="flex items-center gap-2 text-amber-800 cursor-pointer">
                        <List className="h-4 w-4" />
                        Follow pagination links
                      </Label>
                    </div>
                  </div>
                )}
              </div>

              {/* Show error if any */}
              {errorMsg && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4">
                  <p className="text-sm text-red-800">{errorMsg}</p>
                </div>
              )}

              {/* Start button */}
              <Button
                onClick={startScraping}
                disabled={loading || !websiteUrl || !!err}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  "Scrape Website"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results display */}
        {scrapeData && (
          <div className="space-y-4">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-amber-900">{scrapeData.title}</CardTitle>
                    <CardDescription className="text-amber-700">{scrapeData.url}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadAsJson}
                      className="border-amber-300 text-amber-900 bg-transparent"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyJson}
                      className="border-amber-300 text-amber-900 bg-transparent"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-amber-800">
                    Found <span className="font-semibold">{scrapeData.sections.length}</span> sections
                  </div>

                  {/* Section list */}
                  <div className="space-y-3">
                    {scrapeData.sections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-amber-200 bg-white overflow-hidden transition-all"
                      >
                        <button
                          onClick={() => toggleSectionView(idx)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 uppercase">
                              {sec.type}
                            </span>
                            {sec.title && <span className="font-medium text-amber-900">{sec.title}</span>}
                          </div>
                          <span className="text-amber-600">{openSections.has(idx) ? "−" : "+"}</span>
                        </button>

                        {openSections.has(idx) && (
                          <div className="border-t border-amber-100 p-4 space-y-4">
                            <div>
                              <p className="text-sm font-medium text-amber-900 mb-2">Content:</p>
                              <p className="text-sm text-amber-800 leading-relaxed">
                                {sec.content.substring(0, 500)}
                                {sec.content.length > 500 && "..."}
                              </p>
                            </div>

                            {sec.links && sec.links.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-amber-900 mb-2">Links ({sec.links.length}):</p>
                                <ul className="space-y-1 text-sm">
                                  {sec.links.slice(0, 5).map((link, i) => (
                                    <li key={i} className="text-amber-700 truncate">
                                      • {link.text} → {link.url}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {sec.images && sec.images.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-amber-900 mb-2">Images ({sec.images.length}):</p>
                                <ul className="space-y-1 text-sm">
                                  {sec.images.slice(0, 3).map((img, i) => (
                                    <li key={i} className="text-amber-700 truncate">
                                      • {img.alt || "No alt text"}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reset button */}
            <Button
              variant="outline"
              onClick={() => {
                setScrapeData(null)
                setWebsiteUrl("")
                setErrorMsg("")
              }}
              className="w-full border-amber-300 text-amber-900"
            >
              Scrape Another Website
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
