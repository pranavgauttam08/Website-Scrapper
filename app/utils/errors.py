class ScraperError(Exception):
    """Base exception for scraper errors"""
    pass


class NetworkError(ScraperError):
    """Network-related errors"""
    pass


class ParsingError(ScraperError):
    """HTML parsing errors"""
    pass


class JSRenderError(ScraperError):
    """JavaScript rendering errors"""
    pass
