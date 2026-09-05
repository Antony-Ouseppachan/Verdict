"""
Safe HTTP Fetcher with SSRF validation, size limiting, and timeout enforcement.
"""

import requests
from typing import Dict, Any, Tuple
from urllib.parse import urljoin, urlparse

from .config import settings
from .ssrf import validate_url_safety, SSRFValidationError


class FetchError(Exception):
    """Base exception for webpage fetching errors."""
    pass

class FetchTimeoutError(FetchError):
    """Raised when the target website takes too long to respond."""
    pass

class FetchUnreachableError(FetchError):
    """Raised when the target host cannot be reached or DNS fails."""
    pass

class FetchSizeExceededError(FetchError):
    """Raised when the target page exceeds maximum allowed payload size."""
    pass


class SafeWebFetcher:
    """Fetches web page HTML safely without JavaScript execution."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": settings.FETCH_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Upgrade-Insecure-Requests": "1",
        })

    def fetch(self, target_url: str) -> Tuple[str, str, int, float]:
        """
        Safely fetch webpage HTML.
        Returns:
            (html_content, final_url, status_code, elapsed_seconds)
        """
        # 1. Validate Initial URL
        normalized_url, hostname = validate_url_safety(target_url)

        # 2. Fetch with streaming to enforce size limit and manual safe redirect tracking
        current_url = normalized_url
        redirect_count = 0
        total_time = 0.0

        while True:
            # Re-validate before each request (including redirects)
            validate_url_safety(current_url)

            try:
                resp = self.session.get(
                    current_url,
                    timeout=settings.FETCH_TIMEOUT_SECONDS,
                    allow_redirects=False,
                    stream=True,
                    verify=False,  # Allow analyzing expired/self-signed certs (common in phishing)
                )
            except requests.exceptions.Timeout as e:
                raise FetchTimeoutError(f"Connection timed out while fetching '{current_url}': {e}")
            except requests.exceptions.SSLError as e:
                raise FetchUnreachableError(f"SSL handshake error: {e}")
            except requests.exceptions.ConnectionError as e:
                raise FetchUnreachableError(f"Target website unreachable: {e}")
            except Exception as e:
                raise FetchUnreachableError(f"Failed to fetch website: {e}")

            total_time += resp.elapsed.total_seconds()

            # Handle redirects manually to check SSRF on redirect destinations
            if resp.is_redirect or resp.status_code in (301, 302, 303, 307, 308):
                redirect_count += 1
                if redirect_count > settings.FETCH_MAX_REDIRECTS:
                    raise FetchError(f"Too many redirects (exceeded limit of {settings.FETCH_MAX_REDIRECTS}).")

                location = resp.headers.get("Location")
                if not location:
                    break  # Treat as terminal if no location header

                # Resolve relative redirects
                next_url = urljoin(current_url, location)
                current_url, _ = validate_url_safety(next_url)
                continue

            # Read response body with byte limit
            content_bytes = bytearray()
            for chunk in resp.iter_content(chunk_size=16384):
                if chunk:
                    content_bytes.extend(chunk)
                    if len(content_bytes) > settings.FETCH_MAX_BYTES:
                        raise FetchSizeExceededError(
                            f"Page size exceeded {settings.FETCH_MAX_BYTES / (1024 * 1024):.1f} MB limit."
                        )

            # Decode content safely
            encoding = resp.encoding or "utf-8"
            try:
                html_text = content_bytes.decode(encoding, errors="replace")
            except Exception:
                html_text = content_bytes.decode("utf-8", errors="replace")

            return html_text, str(resp.url), resp.status_code, total_time


fetcher = SafeWebFetcher()
