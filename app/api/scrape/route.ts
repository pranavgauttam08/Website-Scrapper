import { createClient } from "@/lib/supabase/server"
import { parseHTML } from "@/lib/scraper/parser"
import type { ScrapeOptions } from "@/lib/scraper/types"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // get request data
    const body: ScrapeOptions = await request.json()
    const { url, jsRendering, interactions } = body

    // basic url check
    let validUrl: URL
    try {
      validUrl = new URL(url)
      if (!validUrl.protocol.startsWith("http")) {
        throw new Error("Invalid protocol")
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // fetch webpage with timeout
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30000) // 30s max

    let htmlContent: string
    try {
      const resp = await fetch(validUrl.href, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      })

      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`)
      }

      htmlContent = await resp.text()
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json({ error: "Request timeout" }, { status: 408 })
      }
      return NextResponse.json({ error: "Failed to fetch webpage" }, { status: 500 })
    } finally {
      clearTimeout(timer)
    }

    // parse the html content
    const { title, sections } = parseHTML(htmlContent, validUrl.href)

    // save to db
    const { data: savedRecord, error: dbErr } = await supabase
      .from("scrape_history")
      .insert({
        user_id: user.id,
        url: validUrl.href,
        title,
        sections,
        js_rendering: jsRendering,
        interactions: interactions || null,
      })
      .select()
      .single()

    if (dbErr) {
      console.error("Database error:", dbErr)
      return NextResponse.json({ error: "Failed to save scrape result" }, { status: 500 })
    }

    return NextResponse.json({
      id: savedRecord.id,
      url: validUrl.href,
      title,
      sections,
    })
  } catch (error) {
    console.error("Scrape error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
