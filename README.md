# Universal Website Scraper

A production-ready web scraping tool that extracts structured data from any website using intelligent static and JavaScript rendering capabilities.

## Features

- **Static HTML Scraping**: Fast extraction using httpx and BeautifulSoup
- **JavaScript Rendering**: Fallback to Playwright for dynamic content
- **Intelligent Interactions**:
  - Click tabs and "Load more" buttons
  - Infinite scroll handling
  - Pagination navigation (up to depth 3)
- **Section-Aware Parsing**: Groups content using semantic HTML landmarks
- **Noise Filtering**: Removes cookie banners, modals, and overlays
- **Professional UI**: Warm, earth-tone design with expandable sections
- **JSON Export**: Download complete structured data

## Tech Stack

**Backend:**
- Python 3.10+
- FastAPI
- httpx for HTTP requests
- BeautifulSoup4 for HTML parsing
- Playwright for JavaScript rendering

**Frontend:**
- Jinja2 templates
- Vanilla JavaScript
- CSS with warm, professional styling

## Quick Start

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

### Installation & Run

Simply execute the run script:

```bash
chmod +x run.sh
./run.sh
```

The script will:
1. Create a virtual environment
2. Install all dependencies
3. Install Playwright browsers
4. Start the server on http://localhost:8000

### Manual Setup (Alternative)

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Usage

1. Open your browser to http://localhost:8000
2. Enter a website URL (must start with http:// or https://)
3. Click "Scrape Website"
4. Wait for the scraping to complete
5. Explore sections by clicking to expand them
6. Download the full JSON response

## API Endpoints

### GET /healthz

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

### POST /scrape

Scrape a website and return structured JSON.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "result": {
    "url": "https://example.com",
    "scrapedAt": "2024-01-15T10:30:00Z",
    "meta": {
      "title": "Page Title",
      "description": "Page description",
      "language": "en",
      "canonical": "https://example.com"
    },
    "sections": [
      {
        "id": "section-0",
        "type": "header",
        "heading": "Main Heading",
        "text": "Content text...",
        "links": [
          {
            "text": "Link text",
            "url": "https://example.com/link"
          }
        ],
        "images": [
          {
            "src": "https://example.com/image.jpg",
            "alt": "Image description"
          }
        ],
        "lists": [["Item 1", "Item 2"]],
        "tables": [
          {
            "headers": ["Column 1", "Column 2"],
            "rows": [["Value 1", "Value 2"]]
          }
        ],
        "rawHtml": "<header>...</header>"
      }
    ],
    "interactions": {
      "clicks": [
        {
          "type": "tab",
          "selector": "[role='tab']",
          "text": "Tab Name"
        }
      ],
      "scrolls": 3,
      "pages": [
        {
          "pageNumber": 2,
          "url": "https://example.com?page=2"
        }
      ]
    },
    "errors": []
  }
}
```

## Test URLs

Here are three test URLs that demonstrate different scraping scenarios:

1. **Static Content**: https://example.com
   - Simple static HTML, no JavaScript required
   
2. **Dynamic Content**: https://news.ycombinator.com
   - JavaScript-rendered content with pagination
   
3. **Complex Interactions**: https://www.reddit.com
   - Tabs, infinite scroll, and dynamic loading

## Project Structure

```
.
├── app/
│   ├── main.py                 # FastAPI application
│   ├── scraper/
│   │   ├── static_scraper.py   # Static HTML scraping
│   │   ├── js_scraper.py       # JavaScript rendering
│   │   ├── section_parser.py   # Content parsing logic
│   │   └── interactions.py     # Click, scroll, pagination
│   ├── templates/
│   │   └── index.html          # Frontend UI
│   ├── static/
│   │   └── styles.css          # Styling
│   └── utils/
│       ├── url.py              # URL utilities
│       └── errors.py           # Custom exceptions
├── run.sh                      # Setup & run script
├── requirements.txt            # Python dependencies
├── README.md                   # This file
├── design_notes.md            # Design decisions
└── capabilities.json          # Feature flags
```

## Known Limitations

- **Performance**: JavaScript rendering is slower than static scraping (10-30 seconds)
- **Rate Limiting**: No built-in rate limiting; use responsibly
- **Authentication**: Does not handle login-protected content
- **CAPTCHAs**: Cannot bypass CAPTCHA challenges
- **Browser Resources**: Playwright requires ~200MB for Chromium browser
- **Timeout**: Requests timeout after 30 seconds
- **JavaScript Heavy Sites**: Some SPA frameworks may require custom wait strategies

## Error Handling

The scraper includes comprehensive error handling:

- Network errors return partial results with error messages
- Parsing failures fall back to alternative strategies
- Timeouts return what was captured before the timeout
- All errors are logged and included in the response

## Development

### Running Tests

```bash
# Activate virtual environment
source venv/bin/activate

# Run the application
uvicorn app.main:app --reload
```

### Adding New Interaction Types

Edit `app/scraper/interactions.py` and add new methods to the `InteractionHandler` class.

### Customizing Section Parsing

Modify `app/scraper/section_parser.py` to adjust how content is grouped into sections.

## License

This project is provided as-is for evaluation purposes.

## Support

For issues or questions, please refer to the design_notes.md for implementation details.
