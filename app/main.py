from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, HttpUrl, validator
from starlette.requests import Request
from datetime import datetime
import logging

from app.scraper.static_scraper import StaticScraper
from app.scraper.js_scraper import JSScraper
from app.utils.errors import ScraperError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Universal Website Scraper")

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Setup templates
templates = Jinja2Templates(directory="app/templates")


class ScrapeRequest(BaseModel):
    url: str

    @validator('url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        return v


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Serve the main UI"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/healthz")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.post("/scrape")
async def scrape(request: ScrapeRequest):
    """
    Scrape a website and return structured JSON.
    Falls back to JS rendering if static scraping is insufficient.
    """
    try:
        logger.info(f"Scraping URL: {request.url}")
        
        # Try static scraping first
        static_scraper = StaticScraper()
        result = await static_scraper.scrape(request.url)
        
        # Check if static scraping was sufficient
        if static_scraper.is_sufficient(result):
            logger.info("Static scraping successful")
            result['scrapedAt'] = datetime.utcnow().isoformat() + 'Z'
            return JSONResponse(content={"result": result})
        
        # Fall back to JS rendering
        logger.info("Static scraping insufficient, using JS rendering")
        js_scraper = JSScraper()
        result = await js_scraper.scrape(request.url)
        result['scrapedAt'] = datetime.utcnow().isoformat() + 'Z'
        
        return JSONResponse(content={"result": result})
        
    except ScraperError as e:
        logger.error(f"Scraper error: {str(e)}")
        return JSONResponse(
            content={
                "result": {
                    "url": request.url,
                    "scrapedAt": datetime.utcnow().isoformat() + 'Z',
                    "meta": {},
                    "sections": [],
                    "interactions": {},
                    "errors": [str(e)]
                }
            },
            status_code=200
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
