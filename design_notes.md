# Design Notes

This document explains the key design decisions and implementation strategies used in the Universal Website Scraper.

## Architecture Overview

The scraper uses a two-tier approach:
1. **Fast Static Scraping**: Attempts static HTML scraping first
2. **JS Rendering Fallback**: Falls back to Playwright if static content is insufficient

This design optimizes for speed while ensuring comprehensive data extraction.

## Static vs JS Fallback Strategy

### Static Scraping

**When Used:**
- First attempt for all URLs
- Fast execution (1-3 seconds typically)

**Sufficiency Heuristic:**
The static scraper is considered sufficient when:
- At least 1 section is found
- Total text content ≥ 200 characters
- At least some meaningful content exists (text, links, or images)

**Implementation:**
- Uses `httpx` for HTTP requests with a 30-second timeout
- BeautifulSoup with lxml parser for fast HTML parsing
- Follows redirects automatically
- Custom User-Agent to avoid bot detection

### JS Rendering

**When Used:**
- Static scraping produces insufficient content
- Explicitly requested by user (future feature)

**Why Playwright:**
- Full browser environment with JavaScript execution
- Headless Chromium for speed
- Rich interaction capabilities (clicks, scrolls, waits)

**Performance Trade-off:**
- 10-30 seconds for complete scraping
- Higher resource usage (~200MB for browser)
- Better coverage of modern web applications

## JS Wait Strategy

Multiple wait strategies ensure content loads properly:

### 1. Network Idle Wait
```python
await page.wait_for_load_state('networkidle', timeout=10000)
```
- Waits until network has been idle for 500ms
- Best for sites with async data loading
- 10-second timeout to prevent hanging

### 2. Selector Presence Wait
```python
await page.wait_for_selector(selector, timeout=3000)
```
- Waits for specific content selectors: `main`, `article`, `[role="main"]`
- Ensures core content is rendered
- Falls back if selector not found

### 3. Fixed Timeout
```python
await page.wait_for_timeout(2000)
```
- Additional 2-second wait for JavaScript execution
- Allows time for dynamic content to render
- Final safety net

**Strategy Combination:**
All three strategies are used in sequence, with graceful fallbacks if any fail. This ensures we capture content even from difficult sites.

## Click & Scroll Logic

### Tab Clicking

**Goal:** Reveal content hidden behind tabs

**Implementation:**
```python
tab_selectors = [
    '[role="tab"]',        # Semantic ARIA tabs
    '.tab',                 # Common class names
    '[class*="tab-"]',      # Partial class match
    'button[data-tab]',     # Data attributes
]
```

**Strategy:**
1. Try each selector in order
2. Click up to 5 tabs to avoid excessive requests
3. Wait 500ms after each click for content to render
4. Record each click with type, selector, and text
5. Stop after finding working tab pattern

### Load More Buttons

**Goal:** Expand content hidden behind "Load more" buttons

**Implementation:**
- Searches for buttons with text like "Load more", "Show more", "View more"
- Clicks up to 3 times per page
- Waits 1 second between clicks
- Stops when button disappears or becomes inactive

**Selectors:**
```python
[
    'button:has-text("Load more")',  # Text-based matching
    '[class*="load-more"]',           # Class-based matching
    'button[class*="more"]'           # Partial match
]
```

### Infinite Scroll

**Goal:** Trigger lazy-loaded content

**Implementation:**
1. Record initial page height
2. Scroll to bottom: `window.scrollTo(0, document.body.scrollHeight)`
3. Wait 1.5 seconds for content to load
4. Check if page height increased
5. Repeat up to 3 times
6. Stop when no new content loads

**Why This Works:**
Most infinite scroll implementations detect scroll position and load content when near bottom.

### Pagination

**Goal:** Follow "Next" links to scrape multiple pages

**Implementation:**
- Looks for "Next" buttons/links using multiple selectors
- Navigates up to depth 3 (configurable)
- Waits for network idle after each navigation
- Tracks visited URLs to avoid loops
- Records each page number and URL

**URL Tracking:**
```python
visited_urls = set([initial_url])
# Only click next if new_url not in visited_urls
```

This prevents infinite loops on sites with circular navigation.

## Section Grouping Strategy

Content is organized into logical sections using a hierarchical approach:

### 1. Semantic HTML5 Landmarks (Preferred)

```python
landmarks = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer']
```

**Why:**
- Modern semantic HTML provides clear content boundaries
- Landmarks have defined purposes (navigation, main content, etc.)
- Natural grouping for screen readers and accessibility

**Section Types:**
- `header` → header section
- `nav` → navigation section
- `main`, `article` → content section
- `aside` → sidebar section
- `footer` → footer section

### 2. Heading-Based Grouping (Fallback)

If fewer than 2 landmark sections found:

```python
headings = soup.find_all(['h1', 'h2', 'h3'])
```

**Strategy:**
- Each h1-h3 heading starts a new section
- Section includes all content until next heading
- Groups related content under its heading

### 3. Body Fallback (Last Resort)

If no headings or landmarks:
- Create single section with all body content
- Labeled "Main Content"
- Ensures something is always returned

### Content Extraction Per Section

For each section, we extract:

1. **Text**: Clean text content, limited to 2000 chars
2. **Links**: Up to 20 links with text and absolute URLs
3. **Images**: Up to 10 images with src and alt text
4. **Lists**: Up to 5 lists with up to 10 items each
5. **Tables**: Up to 3 tables with headers and rows
6. **Raw HTML**: First 500 characters for reference

**Meaningful Content Check:**
A section is only included if it has:
- Text longer than 20 characters, OR
- At least one link, image, list, or table

## Noise Filtering Strategy

### Static Scraping Noise Removal

**Removed Elements:**
```python
noise_selectors = [
    '[class*="cookie"]',    # Cookie banners
    '[id*="consent"]',      # Consent dialogs
    '[class*="gdpr"]',      # GDPR notices
    '[role="dialog"]',      # Modal dialogs
    '[class*="modal"]',     # Bootstrap/custom modals
    '[class*="popup"]',     # Popups
]
```

**Strategy:**
- Only remove if positioned fixed/absolute
- Prevents removing legitimate content with similar class names
- Removes `<script>`, `<style>`, `<noscript>` tags

### JS Rendering Noise Removal

**JavaScript-Based Removal:**
```javascript
selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'absolute') {
            el.remove();
        }
    });
});
```

**Why JavaScript:**
- Can check computed styles (including CSS)
- More accurate position detection
- Runs after all CSS is applied

## HTML Truncation Approach

**Goal:** Include HTML samples without bloating response

**Implementation:**
```python
MAX_HTML_LENGTH = 500

def _truncate_html(self, html: str) -> str:
    if len(html) <= self.MAX_HTML_LENGTH:
        return html
    return html[:self.MAX_HTML_LENGTH] + "..."
```

**Strategy:**
- Keep first 500 characters of HTML
- Provides enough context for debugging
- Avoids massive JSON responses
- May break HTML structure but only used for reference

**Alternative Considered:**
- Parsing and properly closing tags would be more correct
- Trade-off: Complexity vs. utility (it's just a snippet)
- Current approach is simple and sufficient

## Error Handling Philosophy

**Graceful Degradation:**
Every scraping operation is wrapped in try-catch blocks with fallbacks:

1. **Network Errors**: Return partial results with error message
2. **Parsing Errors**: Try alternative parsing strategies
3. **Interaction Failures**: Continue with what worked
4. **Timeouts**: Return data captured before timeout

**Error Recording:**
```python
"errors": [
    "HTTP 404: Page not found",
    "Failed to click load more button"
]
```

Errors are informational, not fatal. The scraper always returns a valid response.

## Performance Optimizations

### Static Scraping
- Uses lxml parser (faster than html.parser)
- Limits content extraction (20 links, 10 images, etc.)
- Text truncation to prevent memory issues

### JS Rendering
- Headless mode for speed
- Parallel interaction attempts where safe
- Early termination when content sufficient
- Resource limits on browser

### Memory Management
- Closes browser immediately after scraping
- Limits section content size
- Truncates raw HTML
- Uses generator patterns where possible (future improvement)

## Security Considerations

### URL Validation
```python
@validator('url')
def validate_url(cls, v):
    if not v.startswith(('http://', 'https://')):
        raise ValueError('URL must start with http:// or https://')
```

Only http/https protocols allowed to prevent:
- file:// protocol access
- javascript: execution
- data: URI injection

### User-Agent
Uses standard browser User-Agent to:
- Avoid bot detection
- Receive standard content
- Not misrepresent identity (identifies as Chrome)

### Rate Limiting
**Not Implemented (Known Limitation):**
- No built-in rate limiting
- Users should implement at proxy/application level
- Could be added with Redis/memory store

## Frontend Design Philosophy

### Visual Design

**Color Palette:**
```css
--color-primary: #8b6f47;      /* Warm brown */
--color-accent: #d4a574;       /* Soft tan */
--color-bg: #faf8f5;           /* Off-white */
```

**Goals:**
- Warm, approachable feel
- Professional appearance
- High contrast for readability
- Earth-tone palette for calm, trustworthy impression

### User Experience

**Progressive Disclosure:**
- Sections collapsed by default
- Click to expand for details
- Prevents overwhelming users with data

**Loading States:**
- Spinner animation during scraping
- Disabled button to prevent double-submission
- Clear progress indication

**Error Handling:**
- Inline error messages
- Non-blocking (can still see partial results)
- Clear, actionable error text

### Responsive Design

**Mobile-First:**
```css
@media (max-width: 768px) {
    .input-group { flex-direction: column; }
    button { width: 100%; }
}
```

- Stacks form elements on mobile
- Full-width buttons for touch targets
- Readable text sizes

## API Design Decisions

### RESTful Structure
- `GET /` for UI
- `GET /healthz` for monitoring
- `POST /scrape` for scraping action

### Response Format
Always returns 200 OK with error details in response body:
```json
{
  "result": {
    "errors": ["Error message"]
  }
}
```

**Why:**
- Partial success is still useful
- Client can decide how to handle errors
- Consistent response structure

### Async/Await
All scraping operations are async:
- Non-blocking I/O for HTTP requests
- Supports concurrent scraping (future)
- Better resource utilization

## Testing Strategy

**Manual Test URLs:**
1. **example.com**: Basic HTML structure
2. **news.ycombinator.com**: Pagination, simple layout
3. **reddit.com**: Infinite scroll, complex interactions

**What to Test:**
- Static scraping on simple sites
- JS rendering fallback
- Tab clicking
- Load more buttons
- Infinite scroll
- Pagination
- Error handling (invalid URLs)
- Timeout behavior

## Future Improvements

### Performance
- Caching of scraped results
- Queue system for batch scraping
- Parallel scraping of multiple pages

### Features
- Authentication support (login forms)
- Proxy rotation
- Custom wait selectors per domain
- Screenshot capture
- PDF generation
- Webhook notifications

### Reliability
- Retry logic with exponential backoff
- Health checks for browser pool
- Memory leak detection
- Resource usage monitoring

## Conclusion

This scraper balances speed, accuracy, and reliability through:
- Intelligent fallback strategies
- Comprehensive interaction handling
- Graceful error handling
- Professional user experience

The design prioritizes practical utility over perfect accuracy, making it production-ready for real-world use cases.
