import type { ScrapedSection } from "./types"

export function parseHTML(html: string, url: string): { title: string; sections: ScrapedSection[] } {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const pageTitle = titleMatch ? titleMatch[1].trim() : "Untitled"

  const sections: ScrapedSection[] = []

  // look for semantic html sections
  const patterns = [
    { type: "header" as const, regex: /<header[^>]*>([\s\S]*?)<\/header>/gi },
    { type: "nav" as const, regex: /<nav[^>]*>([\s\S]*?)<\/nav>/gi },
    { type: "main" as const, regex: /<main[^>]*>([\s\S]*?)<\/main>/gi },
    { type: "article" as const, regex: /<article[^>]*>([\s\S]*?)<\/article>/gi },
    { type: "section" as const, regex: /<section[^>]*>([\s\S]*?)<\/section>/gi },
    { type: "aside" as const, regex: /<aside[^>]*>([\s\S]*?)<\/aside>/gi },
    { type: "footer" as const, regex: /<footer[^>]*>([\s\S]*?)<\/footer>/gi },
  ]

  // scan through all patterns
  for (const p of patterns) {
    let match
    while ((match = p.regex.exec(html)) !== null) {
      const sectionHtml = match[1]
      const textContent = getTextFromHtml(sectionHtml)
      const linksList = getLinksFromHtml(sectionHtml, url)
      const imagesList = getImagesFromHtml(sectionHtml, url)
      const heading = getSectionHeading(sectionHtml)

      if (textContent.trim()) {
        sections.push({
          type: p.type,
          title: heading,
          content: textContent.trim(),
          links: linksList.length > 0 ? linksList : undefined,
          images: imagesList.length > 0 ? imagesList : undefined,
        })
      }
    }
  }

  // fallback: if no semantic tags, just grab body content
  if (sections.length === 0) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
      const bodyText = getTextFromHtml(bodyMatch[1])
      const bodyLinks = getLinksFromHtml(bodyMatch[1], url)
      const bodyImages = getImagesFromHtml(bodyMatch[1], url)

      sections.push({
        type: "main",
        content: bodyText.trim(),
        links: bodyLinks.length > 0 ? bodyLinks : undefined,
        images: bodyImages.length > 0 ? bodyImages : undefined,
      })
    }
  }

  return { title: pageTitle, sections }
}

// strip html tags and get plain text
function getTextFromHtml(html: string): string {
  // remove scripts and styles first
  let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")

  // strip tags
  cleaned = cleaned.replace(/<[^>]+>/g, " ")

  // decode common entities
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // clean whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim()

  return cleaned
}

// extract anchor tags
function getLinksFromHtml(html: string, baseUrl: string): Array<{ text: string; url: string }> {
  const links: Array<{ text: string; url: string }> = []
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi

  let m
  while ((m = linkRegex.exec(html)) !== null) {
    const href = m[1]
    const linkText = getTextFromHtml(m[2]).substring(0, 100)

    if (href && linkText) {
      try {
        const fullUrl = new URL(href, baseUrl).href
        links.push({ text: linkText.trim(), url: fullUrl })
      } catch {
        // skip bad urls
      }
    }
  }

  return links.slice(0, 20) // limit
}

// extract image tags
function getImagesFromHtml(html: string, baseUrl: string): Array<{ alt: string; src: string }> {
  const imgs: Array<{ alt: string; src: string }> = []
  const imgRegex1 = /<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi
  const imgRegex2 = /<img[^>]+alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/gi

  let m
  // pattern 1: src then alt
  while ((m = imgRegex1.exec(html)) !== null) {
    const src = m[1]
    const alt = m[2] || "Image"

    try {
      const fullSrc = new URL(src, baseUrl).href
      imgs.push({ alt, src: fullSrc })
    } catch {
      // skip
    }
  }

  // pattern 2: alt then src
  while ((m = imgRegex2.exec(html)) !== null) {
    const alt = m[1] || "Image"
    const src = m[2]

    try {
      const fullSrc = new URL(src, baseUrl).href
      imgs.push({ alt, src: fullSrc })
    } catch {
      // skip
    }
  }

  return imgs.slice(0, 10) // cap at 10
}

// try to find section heading
function getSectionHeading(html: string): string | undefined {
  const headingMatch = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i)
  if (headingMatch) {
    return getTextFromHtml(headingMatch[1]).substring(0, 100)
  }
  return undefined
}
