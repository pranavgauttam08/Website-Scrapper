from playwright.async_api import async_playwright, Browser, Page
from bs4 import BeautifulSoup
from typing import Dict, Any
import logging

from app.scraper.section_parser import SectionParser
from app.scraper.interactions import InteractionHandler
from app.utils.errors import JSRenderError
from app.utils.url import normalize_url

logger = logging.getLogger(__name__)


class JSScraper:
    """JavaScript-enabled scraper using Playwright"""
    
    TIMEOUT = 30000  # 30 seconds
    WAIT_STRATEGIES = ['networkidle', 'domcontentloaded']
    
    async def scrape(self, url: str) -> Dict[str, Any]:
        """
        Scrape website using headless browser with JS rendering.
        Includes interactions: clicks, scrolls, pagination.
        """
        normalized_url = normalize_url(url)
        browser = None
        
        try:
            logger.info(f"Starting JS rendering for: {normalized_url}")
            
            async with async_playwright() as p:
                # Launch browser
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    viewport={'width': 1920, 'height': 1080}
                )
                
                page = await context.new_page()
                page.set_default_timeout(self.TIMEOUT)
                
                # Navigate to URL
                await page.goto(normalized_url, wait_until='domcontentloaded')
                
                # Wait for content using multiple strategies
                await self._wait_for_content(page)
                
                # Remove noise elements
                await self._remove_noise(page)
                
                # Perform interactions
                interaction_handler = InteractionHandler(page)
                await interaction_handler.perform_interactions(max_depth=3)
                
                # Get final HTML
                html_content = await page.content()
                
                # Parse with BeautifulSoup
                soup = BeautifulSoup(html_content, 'lxml')
                
                # Initialize parser
                parser = SectionParser(normalized_url)
                
                # Extract meta and sections
                meta = parser.extract_meta(soup)
                sections = parser.parse_sections(soup)
                
                # Get interaction summary
                interactions = interaction_handler.get_interaction_summary()
                
                result = {
                    "url": normalized_url,
                    "meta": meta,
                    "sections": sections,
                    "interactions": interactions,
                    "errors": []
                }
                
                logger.info(f"JS scraping completed: {len(sections)} sections, {len(interactions['clicks'])} clicks, {interactions['scrolls']} scrolls, {len(interactions['pages'])} pages")
                
                await browser.close()
                return result
                
        except Exception as e:
            if browser:
                await browser.close()
            logger.error(f"JS rendering error: {str(e)}")
            raise JSRenderError(f"Failed to render page: {str(e)}")
    
    async def _wait_for_content(self, page: Page):
        """
        Wait for page content using multiple strategies:
        - Network idle
        - Specific selector presence
        - Timeout fallback
        """
        try:
            # Try waiting for network idle
            await page.wait_for_load_state('networkidle', timeout=10000)
            logger.info("Network idle reached")
        except Exception:
            logger.info("Network idle timeout, continuing...")
        
        try:
            # Wait for common content selectors
            content_selectors = ['main', 'article', '[role="main"]', 'body']
            
            for selector in content_selectors:
                try:
                    await page.wait_for_selector(selector, timeout=3000)
                    logger.info(f"Content selector found: {selector}")
                    break
                except Exception:
                    continue
        except Exception:
            logger.info("No specific content selector found, using current state")
        
        # Additional wait for JS execution
        await page.wait_for_timeout(2000)
    
    async def _remove_noise(self, page: Page):
        """Remove noise elements like cookie banners and modals"""
        try:
            # JavaScript to remove common noise elements
            await page.evaluate('''
                () => {
                    const selectors = [
                        '[class*="cookie"]',
                        '[id*="cookie"]',
                        '[class*="consent"]',
                        '[id*="consent"]',
                        '[class*="gdpr"]',
                        '[role="dialog"][class*="modal"]',
                        '[class*="banner"]',
                        '[class*="popup"]',
                        '.modal.show',
                        '[style*="position: fixed"]'
                    ];
                    
                    selectors.forEach(selector => {
                        document.querySelectorAll(selector).forEach(el => {
                            const style = window.getComputedStyle(el);
                            if (style.position === 'fixed' || style.position === 'absolute') {
                                el.remove();
                            }
                        });
                    });
                }
            ''')
            logger.info("Removed noise elements")
        except Exception as e:
            logger.debug(f"Failed to remove noise: {str(e)}")
