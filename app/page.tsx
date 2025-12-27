"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Globe,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Zap,
  Database,
  Lock,
  Code,
  ArrowRight,
} from "lucide-react"

export default function LandingPage() {
  const [activeView, setActiveView] = useState<"initial" | "loading" | "results">("initial")
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["section-0"]))

  const [url, setUrl] = useState("")
  const [jsRendering, setJsRendering] = useState(false)
  const [handleTabs, setHandleTabs] = useState(false)
  const [handleButtons, setHandleButtons] = useState(false)
  const [handleScroll, setHandleScroll] = useState(false)
  const [handlePagination, setHandlePagination] = useState(false)
  const [urlError, setUrlError] = useState("")

  const validateUrl = (urlString: string) => {
    if (!urlString) {
      setUrlError("Please enter a URL")
      return false
    }
    try {
      const urlObj = new URL(urlString)
      if (!urlObj.protocol.startsWith("http")) {
        setUrlError("URL must start with http:// or https://")
        return false
      }
      setUrlError("")
      return true
    } catch {
      setUrlError("Please enter a valid URL")
      return false
    }
  }

  const handleScrape = () => {
    if (!validateUrl(url)) return

    setActiveView("loading")

    // Simulate scraping process
    setTimeout(() => {
      setActiveView("results")
    }, 3000)
  }

  const handleReset = () => {
    setActiveView("initial")
    setUrl("")
    setJsRendering(false)
    setHandleTabs(false)
    setHandleButtons(false)
    setHandleScroll(false)
    setHandlePagination(false)
    setUrlError("")
  }

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSections(newExpanded)
  }

  const handleDownloadJSON = () => {
    const data = {
      url: url || "https://example-blog.com/articles",
      timestamp: new Date().toISOString(),
      sections: [
        {
          title: "Main Navigation",
          type: "nav",
          items: ["Home", "About", "Blog", "Contact"],
        },
        {
          title: "Hero Section",
          type: "section",
          content: "Welcome to Our Blog - Discover amazing articles about web development, design, and technology.",
        },
        {
          title: "Featured Articles",
          type: "article",
          items: ["Getting Started with React 19", "Modern CSS Techniques", "TypeScript Best Practices"],
        },
      ],
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url_download = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url_download
    a.download = "scraped-data.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url_download)
  }

  const handleCopyToClipboard = () => {
    const data = {
      url: url || "https://example-blog.com/articles",
      timestamp: new Date().toISOString(),
      sections: [
        {
          title: "Main Navigation",
          type: "nav",
          items: ["Home", "About", "Blog", "Contact"],
        },
        {
          title: "Hero Section",
          type: "section",
          content: "Welcome to Our Blog - Discover amazing articles about web development, design, and technology.",
        },
        {
          title: "Featured Articles",
          type: "article",
          items: ["Getting Started with React 19", "Modern CSS Techniques", "TypeScript Best Practices"],
        },
      ],
    }

    navigator.clipboard
      .writeText(JSON.stringify(data, null, 2))
      .then(() => alert("Copied to clipboard!"))
      .catch(() => alert("Failed to copy"))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <div className="mx-auto max-w-6xl p-6 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="flex items-center justify-center gap-3">
            <Globe className="h-16 w-16 text-amber-700" />
            <h1 className="text-5xl font-bold text-amber-900">Website Scraper</h1>
          </div>
          <p className="text-xl text-amber-700 max-w-2xl mx-auto leading-relaxed">
            Extract structured content from any website with advanced JavaScript rendering and interaction handling
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-amber-300 text-amber-900 bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-amber-200 shadow-lg bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Zap className="h-6 w-6 text-amber-700" />
                </div>
                <CardTitle className="text-amber-900">JavaScript Rendering</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-amber-700">
                Render dynamic content with full JavaScript support for modern single-page applications
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Database className="h-6 w-6 text-amber-700" />
                </div>
                <CardTitle className="text-amber-900">Structured Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-amber-700">
                Automatically organize content into semantic sections with links, images, and metadata
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Lock className="h-6 w-6 text-amber-700" />
                </div>
                <CardTitle className="text-amber-900">Secure & Private</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-amber-700">
                Your scraping history is protected with authentication and row-level security
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Code className="h-6 w-6 text-amber-700" />
                </div>
                <CardTitle className="text-amber-900">Smart Interactions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-amber-700">
                Handle tabs, load more buttons, infinite scroll, and pagination automatically
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Globe className="h-6 w-6 text-amber-700" />
                </div>
                <CardTitle className="text-amber-900">Universal Support</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-amber-700">
                Works with any website - from simple blogs to complex web applications
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ArrowRight className="h-6 w-6 text-amber-700" />
                </div>
                <CardTitle className="text-amber-900">Easy Export</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-amber-700">
                Download results as JSON or copy to clipboard for easy integration with your tools
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="border-amber-300 bg-gradient-to-r from-amber-100 to-orange-100 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-amber-900">Ready to start scraping?</CardTitle>
            <CardDescription className="text-amber-800 text-base">
              Create your free account and extract content from any website in seconds
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-amber-700 hover:bg-amber-800 text-white">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Initial State */}
        {activeView === "initial" && (
          <Card className="p-8 bg-white border-amber-200 shadow-lg">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-amber-900">Website URL</label>
                <Input
                  placeholder="https://example.com"
                  className="text-lg border-amber-300 focus:ring-amber-500"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    setUrlError("")
                  }}
                  onBlur={() => url && validateUrl(url)}
                />
                {urlError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{urlError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="js-rendering"
                    className="rounded border-amber-400 h-4 w-4 cursor-pointer"
                    checked={jsRendering}
                    onChange={(e) => {
                      setJsRendering(e.target.checked)
                      if (!e.target.checked) {
                        setHandleTabs(false)
                        setHandleButtons(false)
                        setHandleScroll(false)
                        setHandlePagination(false)
                      }
                    }}
                  />
                  <label htmlFor="js-rendering" className="text-sm font-medium text-amber-900 cursor-pointer">
                    Enable JavaScript Rendering
                  </label>
                </div>

                <div className="space-y-3 pl-6 border-l-2 border-amber-300">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tabs"
                      className="rounded border-amber-400 h-4 w-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!jsRendering}
                      checked={handleTabs}
                      onChange={(e) => setHandleTabs(e.target.checked)}
                    />
                    <label
                      htmlFor="tabs"
                      className={`text-sm ${jsRendering ? "text-amber-900 cursor-pointer" : "text-amber-500"}`}
                    >
                      Handle Tabs/Accordions
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="buttons"
                      className="rounded border-amber-400 h-4 w-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!jsRendering}
                      checked={handleButtons}
                      onChange={(e) => setHandleButtons(e.target.checked)}
                    />
                    <label
                      htmlFor="buttons"
                      className={`text-sm ${jsRendering ? "text-amber-900 cursor-pointer" : "text-amber-500"}`}
                    >
                      Click "Load More" Buttons
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="scroll"
                      className="rounded border-amber-400 h-4 w-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!jsRendering}
                      checked={handleScroll}
                      onChange={(e) => setHandleScroll(e.target.checked)}
                    />
                    <label
                      htmlFor="scroll"
                      className={`text-sm ${jsRendering ? "text-amber-900 cursor-pointer" : "text-amber-500"}`}
                    >
                      Infinite Scroll Detection
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="pagination"
                      className="rounded border-amber-400 h-4 w-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!jsRendering}
                      checked={handlePagination}
                      onChange={(e) => setHandlePagination(e.target.checked)}
                    />
                    <label
                      htmlFor="pagination"
                      className={`text-sm ${jsRendering ? "text-amber-900 cursor-pointer" : "text-amber-500"}`}
                    >
                      Follow Pagination Links
                    </label>
                  </div>
                </div>
              </div>

              <Button onClick={handleScrape} className="w-full bg-amber-700 hover:bg-amber-800 text-white text-lg py-6">
                Scrape Website
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {activeView === "loading" && (
          <Card className="p-8 bg-white border-amber-200 shadow-lg">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-amber-900">Website URL</label>
                <Input
                  value={url || "https://example-blog.com/articles"}
                  className="text-lg border-amber-300"
                  disabled
                />
              </div>

              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-16 w-16 text-amber-700 animate-spin" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold text-amber-900">Scraping in progress...</p>
                  <p className="text-sm text-amber-700">
                    {jsRendering ? "Rendering JavaScript and extracting content" : "Extracting content"}
                  </p>
                </div>

                <div className="w-full max-w-md space-y-2 pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-amber-800">Page loaded</span>
                  </div>
                  {jsRendering && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-amber-800">JavaScript rendered</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
                    <span className="text-amber-800">Extracting content...</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Results State */}
        {activeView === "results" && (
          <div className="space-y-6">
            <Card className="p-6 bg-white border-amber-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-amber-900">Scraping Complete</h2>
                  <p className="text-sm text-amber-700">{url || "https://example-blog.com/articles"}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-amber-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-900">12</p>
                  <p className="text-xs text-amber-700">Sections Found</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-900">2.4s</p>
                  <p className="text-xs text-amber-700">Processing Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-900">15.2KB</p>
                  <p className="text-xs text-amber-700">Data Extracted</p>
                </div>
              </div>

              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full mt-4 border-amber-300 text-amber-800 hover:bg-amber-50 bg-transparent"
              >
                Scrape Another Website
              </Button>
            </Card>

            {/* Sample Sections */}
            {[
              {
                id: "section-0",
                title: "Main Navigation",
                type: "nav",
                items: ["Home", "About", "Blog", "Contact"],
              },
              {
                id: "section-1",
                title: "Hero Section",
                type: "section",
                content:
                  "Welcome to Our Blog - Discover amazing articles about web development, design, and technology.",
              },
              {
                id: "section-2",
                title: "Featured Articles",
                type: "article",
                items: ["Getting Started with React 19", "Modern CSS Techniques", "TypeScript Best Practices"],
              },
            ].map((section) => (
              <Card key={section.id} className="bg-white border-amber-200 shadow overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="h-5 w-5 text-amber-700" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-amber-700" />
                    )}
                    <div className="text-left">
                      <h3 className="font-semibold text-amber-900">{section.title}</h3>
                      <p className="text-xs text-amber-600">Type: {section.type}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                    {section.items ? `${section.items.length} items` : "Content"}
                  </span>
                </button>

                {expandedSections.has(section.id) && (
                  <div className="px-4 pb-4 border-t border-amber-100">
                    {section.items ? (
                      <ul className="space-y-2 pt-3">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-amber-600 mt-1">•</span>
                            <span className="text-amber-800">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-amber-800 pt-3 leading-relaxed">{section.content}</p>
                    )}
                  </div>
                )}
              </Card>
            ))}

            <Card className="p-6 bg-amber-50 border-amber-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-amber-700">Export scraped data</p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadJSON}
                    variant="outline"
                    className="border-amber-300 text-amber-800 hover:bg-amber-100 bg-transparent"
                  >
                    Download JSON
                  </Button>
                  <Button
                    onClick={handleCopyToClipboard}
                    variant="outline"
                    className="border-amber-300 text-amber-800 hover:bg-amber-100 bg-transparent"
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
