export interface ScrapedSection {
  type: "header" | "nav" | "main" | "footer" | "aside" | "article" | "section"
  title?: string
  content: string
  links?: Array<{ text: string; url: string }>
  images?: Array<{ alt: string; src: string }>
}

export interface ScrapeResult {
  url: string
  title: string
  sections: ScrapedSection[]
}

export interface ScrapeOptions {
  url: string
  jsRendering: boolean
  interactions?: {
    clickSelectors?: string[]
    infiniteScroll?: boolean
    pagination?: {
      enabled: boolean
      selector?: string
    }
  }
}
