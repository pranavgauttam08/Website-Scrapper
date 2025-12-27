import httpx
from bs4 import BeautifulSoup
from typing import Dict, Any
import logging

from app.scraper.section_parser import SectionParser
from app.utils.errors import NetworkError, ParsingError
from app.utils.url import normalize_url

logger = logging.getLogger(__name__)


class StaticScraper:
    """Static HTML scraper using httpx and BeautifulSoup"""
    
    TIMEOUT = 30.0
    MIN_TEXT_LENGTH = 200  # Minimum text length to consider scraping sufficient
    MIN_SECTIONS = 1  # Minimum number of sections
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=self.TIMEOUT,
            follow_redirects=True,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        )
    
    async def scrape(self, url: str) -> Dict[str, Any]:
        """
        Scrape static HTML content from URL
        """
        try:
            normalized_url = normalize_url(url)
            logger.info(f"Fetching static content from: {normalized_url}")
            
            # Fetch HTML
            response = await self.client.get(normalized_url)
            response.raise_for_status()
            html_content = response.text
            
            # Parse HTML
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Remove noise elements
            self._remove_noise(soup)
            
            # Initialize parser
            parser = SectionParser(normalized_url)
            
            # Extract meta and sections
            meta = parser.extract_meta(soup)
            sections = parser.parse_sections(soup)
            
            result = {
                "url": normalized_url,
                "meta": meta,
                "sections": sections,
                "interactions": {
                    "clicks": [],
                    "scrolls": 0,
                    "pages": []
                },
                "errors": []
            }
            
            logger.info(f"Static scraping completed: {len(sections)} sections found")
            return result
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error: {e.response.status_code}")
            raise NetworkError(f"HTTP {e.response.status_code}: {str(e)}")
        except httpx.RequestError as e:
            logger.error(f"Request error: {str(e)}")
            raise NetworkError(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Parsing error: {str(e)}")
            raise ParsingError(f"Failed to parse HTML: {str(e)}")
    
    def _remove_noise(self, soup: BeautifulSoup):
        """Remove common noise elements like cookie banners and modals"""
        # Remove cookie consent banners
        noise_selectors = [
            '[class*="cookie"]',
            '[id*="cookie"]',
            '[class*="consent"]',
            '[id*="consent"]',
            '[class*="gdpr"]',
            '[id*="gdpr"]',
            '[class*="banner"]',
            '[role="dialog"]',
            '[class*="modal"]',
            '[class*="popup"]',
            '[class*="overlay"]'
        ]
        
        for selector in noise_selectors:
            for element in soup.select(selector):
                # Only remove if it's likely a banner/modal (positioned fixed/absolute)
                style = element.get('style', '')
                if 'fixed' in style or 'absolute' in style or element.name in ['dialog']:
                    element.decompose()
        
        # Remove script and style tags
        for tag in soup(['script', 'style', 'noscript']):
            tag.decompose()
    
    def is_sufficient(self, result: Dict[str, Any]) -> bool:
        """
        Determine if static scraping produced sufficient content.
        Returns False if JS rendering is needed.
        """
        sections = result.get('sections', [])
        
        # Check if we have minimum sections
        if len(sections) < self.MIN_SECTIONS:
            logger.info("Insufficient sections found")
            return False
        
        # Calculate total text length
        total_text = sum(len(section.get('text', '')) for section in sections)
        
        if total_text < self.MIN_TEXT_LENGTH:
            logger.info(f"Insufficient text content: {total_text} chars")
            return False
        
        # Check if we have any meaningful content
        has_content = any(
            section.get('text') or 
            section.get('links') or 
            section.get('images')
            for section in sections
        )
        
        if not has_content:
            logger.info("No meaningful content found")
            return False
        
        return True
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
