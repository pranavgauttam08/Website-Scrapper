from playwright.async_api import Page
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class InteractionHandler:
    """Handle page interactions: clicks, scrolls, pagination"""
    
    def __init__(self, page: Page):
        self.page = page
        self.clicks = []
        self.scrolls = 0
        self.pages = []
    
    async def perform_interactions(self, max_depth: int = 3):
        """
        Perform various interactions to load dynamic content.
        Includes: tab clicks, "Load more" buttons, scrolling, pagination
        """
        await self._handle_tabs()
        await self._handle_load_more()
        await self._handle_infinite_scroll()
        await self._handle_pagination(max_depth)
    
    async def _handle_tabs(self):
        """Click on tabs to reveal hidden content"""
        tab_selectors = [
            '[role="tab"]',
            '.tab',
            '[class*="tab-"]',
            'button[data-tab]',
            'a[data-toggle="tab"]'
        ]
        
        for selector in tab_selectors:
            try:
                tabs = await self.page.locator(selector).all()
                
                for idx, tab in enumerate(tabs[:5]):  # Limit to 5 tabs
                    try:
                        if await tab.is_visible():
                            text = await tab.inner_text()
                            await tab.click(timeout=2000)
                            await self.page.wait_for_timeout(500)
                            
                            self.clicks.append({
                                "type": "tab",
                                "selector": selector,
                                "text": text.strip()[:50]
                            })
                            logger.info(f"Clicked tab: {text.strip()[:30]}")
                    except Exception as e:
                        logger.debug(f"Failed to click tab {idx}: {str(e)}")
                        continue
                
                if tabs:
                    break  # Stop after finding tabs
                    
            except Exception as e:
                logger.debug(f"No tabs found with selector {selector}")
                continue
    
    async def _handle_load_more(self):
        """Click "Load more" / "Show more" buttons"""
        load_more_selectors = [
            'button:has-text("Load more")',
            'button:has-text("Show more")',
            'button:has-text("View more")',
            'a:has-text("Load more")',
            '[class*="load-more"]',
            '[class*="show-more"]',
            'button[class*="more"]'
        ]
        
        clicks_performed = 0
        max_clicks = 3
        
        for selector in load_more_selectors:
            try:
                while clicks_performed < max_clicks:
                    try:
                        button = self.page.locator(selector).first
                        
                        if await button.is_visible(timeout=1000):
                            text = await button.inner_text()
                            await button.click(timeout=2000)
                            await self.page.wait_for_timeout(1000)
                            
                            self.clicks.append({
                                "type": "load_more",
                                "selector": selector,
                                "text": text.strip()[:50]
                            })
                            clicks_performed += 1
                            logger.info(f"Clicked load more: {text.strip()[:30]}")
                        else:
                            break
                            
                    except Exception as e:
                        logger.debug(f"Load more button not found or clickable: {str(e)}")
                        break
                
                if clicks_performed > 0:
                    break  # Stop after finding working button
                    
            except Exception as e:
                logger.debug(f"No load more button found with selector {selector}")
                continue
    
    async def _handle_infinite_scroll(self):
        """Perform infinite scrolling to load more content"""
        try:
            previous_height = await self.page.evaluate('document.body.scrollHeight')
            scroll_attempts = 0
            max_scrolls = 3
            
            while scroll_attempts < max_scrolls:
                # Scroll to bottom
                await self.page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                await self.page.wait_for_timeout(1500)
                
                # Check if new content loaded
                new_height = await self.page.evaluate('document.body.scrollHeight')
                
                if new_height > previous_height:
                    self.scrolls += 1
                    scroll_attempts += 1
                    previous_height = new_height
                    logger.info(f"Scrolled: {scroll_attempts}/{max_scrolls}")
                else:
                    break
            
        except Exception as e:
            logger.error(f"Infinite scroll error: {str(e)}")
    
    async def _handle_pagination(self, max_depth: int = 3):
        """Follow pagination links to scrape multiple pages"""
        pagination_selectors = [
            'a:has-text("Next")',
            'a:has-text(">")',
            '[rel="next"]',
            '.pagination a:last-child',
            '[class*="next"]',
            'button:has-text("Next")'
        ]
        
        current_page = 1
        visited_urls = set([self.page.url])
        
        while current_page < max_depth:
            next_clicked = False
            
            for selector in pagination_selectors:
                try:
                    next_button = self.page.locator(selector).first
                    
                    if await next_button.is_visible(timeout=1000):
                        # Get URL before clicking
                        href = await next_button.get_attribute('href') or ""
                        
                        await next_button.click(timeout=2000)
                        await self.page.wait_for_load_state('networkidle', timeout=5000)
                        
                        new_url = self.page.url
                        
                        # Check if we actually navigated to a new page
                        if new_url not in visited_urls:
                            visited_urls.add(new_url)
                            current_page += 1
                            
                            self.pages.append({
                                "pageNumber": current_page,
                                "url": new_url
                            })
                            
                            logger.info(f"Navigated to page {current_page}: {new_url}")
                            next_clicked = True
                            break
                        else:
                            break
                            
                except Exception as e:
                    logger.debug(f"Pagination failed with selector {selector}: {str(e)}")
                    continue
            
            if not next_clicked:
                break
    
    def get_interaction_summary(self) -> Dict[str, Any]:
        """Return summary of all interactions performed"""
        return {
            "clicks": self.clicks,
            "scrolls": self.scrolls,
            "pages": self.pages
        }
