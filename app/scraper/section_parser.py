from bs4 import BeautifulSoup, Tag
from typing import List, Dict, Any
from app.utils.url import make_absolute_url


class SectionParser:
    """Parse HTML content into structured sections"""
    
    MAX_HTML_LENGTH = 500  # Maximum length for rawHtml snippets
    
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    def parse_sections(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """
        Group content into sections using semantic landmarks and headings
        """
        sections = []
        
        # Try semantic HTML5 landmarks first
        landmarks = soup.find_all(['header', 'nav', 'main', 'article', 'section', 'aside', 'footer'])
        
        if landmarks:
            for idx, landmark in enumerate(landmarks):
                section = self._parse_section(landmark, f"{landmark.name}-{idx}")
                if section and self._has_meaningful_content(section):
                    sections.append(section)
        
        # If no landmarks or insufficient content, fall back to heading-based sections
        if len(sections) < 2:
            sections = self._parse_by_headings(soup)
        
        return sections if sections else self._fallback_section(soup)
    
    def _parse_by_headings(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Parse content grouped by h1-h3 headings"""
        sections = []
        headings = soup.find_all(['h1', 'h2', 'h3'])
        
        for idx, heading in enumerate(headings):
            # Get content until next heading
            content_elements = []
            for sibling in heading.find_next_siblings():
                if sibling.name in ['h1', 'h2', 'h3']:
                    break
                content_elements.append(sibling)
            
            section = {
                "id": f"section-{idx}",
                "type": "content",
                "heading": heading.get_text(strip=True),
                "text": self._extract_text(content_elements),
                "links": self._extract_links(content_elements),
                "images": self._extract_images(content_elements),
                "lists": self._extract_lists(content_elements),
                "tables": self._extract_tables(content_elements),
                "rawHtml": self._truncate_html(str(heading) + ''.join(str(el) for el in content_elements[:3]))
            }
            
            if self._has_meaningful_content(section):
                sections.append(section)
        
        return sections
    
    def _fallback_section(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Create a single fallback section from body content"""
        body = soup.find('body') or soup
        
        return [{
            "id": "section-0",
            "type": "content",
            "heading": "Main Content",
            "text": self._extract_text([body]),
            "links": self._extract_links([body]),
            "images": self._extract_images([body]),
            "lists": self._extract_lists([body]),
            "tables": self._extract_tables([body]),
            "rawHtml": self._truncate_html(str(body))
        }]
    
    def _parse_section(self, element: Tag, section_id: str) -> Dict[str, Any]:
        """Parse a single section element"""
        # Find heading
        heading_tag = element.find(['h1', 'h2', 'h3', 'h4'])
        heading = heading_tag.get_text(strip=True) if heading_tag else element.name.title()
        
        return {
            "id": section_id,
            "type": self._determine_section_type(element),
            "heading": heading,
            "text": self._extract_text([element]),
            "links": self._extract_links([element]),
            "images": self._extract_images([element]),
            "lists": self._extract_lists([element]),
            "tables": self._extract_tables([element]),
            "rawHtml": self._truncate_html(str(element))
        }
    
    def _determine_section_type(self, element: Tag) -> str:
        """Determine the type of section based on element"""
        tag_map = {
            'header': 'header',
            'nav': 'navigation',
            'main': 'content',
            'article': 'article',
            'aside': 'sidebar',
            'footer': 'footer'
        }
        return tag_map.get(element.name, 'content')
    
    def _extract_text(self, elements: List[Tag]) -> str:
        """Extract clean text from elements"""
        texts = []
        for el in elements:
            text = el.get_text(separator=' ', strip=True)
            if text:
                texts.append(text)
        return ' '.join(texts)[:2000]  # Limit text length
    
    def _extract_links(self, elements: List[Tag]) -> List[Dict[str, str]]:
        """Extract links with text and absolute URLs"""
        links = []
        for el in elements:
            for a in el.find_all('a', href=True):
                text = a.get_text(strip=True)
                href = make_absolute_url(self.base_url, a['href'])
                if text and href:
                    links.append({"text": text, "url": href})
        return links[:20]  # Limit number of links
    
    def _extract_images(self, elements: List[Tag]) -> List[Dict[str, str]]:
        """Extract images with src and alt text"""
        images = []
        for el in elements:
            for img in el.find_all('img', src=True):
                src = make_absolute_url(self.base_url, img['src'])
                alt = img.get('alt', '')
                images.append({"src": src, "alt": alt})
        return images[:10]  # Limit number of images
    
    def _extract_lists(self, elements: List[Tag]) -> List[List[str]]:
        """Extract list items from ul/ol elements"""
        lists = []
        for el in elements:
            for ul in el.find_all(['ul', 'ol']):
                items = [li.get_text(strip=True) for li in ul.find_all('li', recursive=False)]
                if items:
                    lists.append(items[:10])  # Limit items per list
        return lists[:5]  # Limit number of lists
    
    def _extract_tables(self, elements: List[Tag]) -> List[Dict[str, Any]]:
        """Extract table data"""
        tables = []
        for el in elements:
            for table in el.find_all('table'):
                headers = [th.get_text(strip=True) for th in table.find_all('th')]
                rows = []
                for tr in table.find_all('tr'):
                    cells = [td.get_text(strip=True) for td in tr.find_all('td')]
                    if cells:
                        rows.append(cells)
                
                if headers or rows:
                    tables.append({"headers": headers, "rows": rows[:10]})
        return tables[:3]  # Limit number of tables
    
    def _truncate_html(self, html: str) -> str:
        """Safely truncate HTML to maximum length"""
        if len(html) <= self.MAX_HTML_LENGTH:
            return html
        return html[:self.MAX_HTML_LENGTH] + "..."
    
    def _has_meaningful_content(self, section: Dict[str, Any]) -> bool:
        """Check if section has meaningful content"""
        return (
            len(section.get('text', '')) > 20 or
            len(section.get('links', [])) > 0 or
            len(section.get('images', [])) > 0 or
            len(section.get('lists', [])) > 0 or
            len(section.get('tables', [])) > 0
        )
    
    def extract_meta(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract meta information from HTML"""
        meta = {
            "title": "",
            "description": "",
            "language": "",
            "canonical": ""
        }
        
        # Title
        title_tag = soup.find('title')
        if title_tag:
            meta['title'] = title_tag.get_text(strip=True)
        
        # Meta tags
        description_tag = soup.find('meta', attrs={'name': 'description'}) or \
                         soup.find('meta', attrs={'property': 'og:description'})
        if description_tag and description_tag.get('content'):
            meta['description'] = description_tag['content']
        
        # Language
        html_tag = soup.find('html')
        if html_tag and html_tag.get('lang'):
            meta['language'] = html_tag['lang']
        
        # Canonical
        canonical_tag = soup.find('link', attrs={'rel': 'canonical'})
        if canonical_tag and canonical_tag.get('href'):
            meta['canonical'] = make_absolute_url(self.base_url, canonical_tag['href'])
        
        return meta
