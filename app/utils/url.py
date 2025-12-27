from urllib.parse import urljoin, urlparse


def is_valid_url(url: str) -> bool:
    """Check if URL is valid and uses http/https scheme"""
    try:
        result = urlparse(url)
        return all([result.scheme in ('http', 'https'), result.netloc])
    except Exception:
        return False


def make_absolute_url(base_url: str, relative_url: str) -> str:
    """Convert relative URL to absolute URL"""
    if not relative_url:
        return ""
    return urljoin(base_url, relative_url)


def normalize_url(url: str) -> str:
    """Normalize URL by removing fragments and ensuring proper format"""
    parsed = urlparse(url)
    # Remove fragment
    normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    if parsed.query:
        normalized += f"?{parsed.query}"
    return normalized
