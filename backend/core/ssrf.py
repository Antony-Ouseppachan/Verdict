"""
Server-Side Request Forgery (SSRF) Protection and URL Safety Validation.
"""

import socket
import ipaddress
from urllib.parse import urlparse
from typing import Tuple


class SSRFValidationError(Exception):
    """Raised when a URL fails SSRF safety validation."""
    pass


# Private & restricted IPv4/IPv6 networks to block
BLOCKED_NETWORKS = [
    # IPv4 loopback & local
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),   # Link-local
    ipaddress.ip_network("10.0.0.0/8"),        # RFC1918 Class A
    ipaddress.ip_network("172.16.0.0/12"),     # RFC1918 Class B
    ipaddress.ip_network("192.168.0.0/16"),    # RFC1918 Class C
    ipaddress.ip_network("100.64.0.0/10"),     # Carrier grade NAT
    ipaddress.ip_network("192.0.0.0/24"),      # IETF protocol assignments
    ipaddress.ip_network("192.0.2.0/24"),      # TEST-NET-1
    ipaddress.ip_network("198.18.0.0/15"),     # Benchmark testing
    ipaddress.ip_network("198.51.100.0/24"),   # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),    # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),       # Multicast
    ipaddress.ip_network("240.0.0.0/4"),       # Reserved / Future use
    ipaddress.ip_network("255.255.255.255/32"), # Broadcast

    # IPv6 loopback, local, multicast
    ipaddress.ip_network("::1/128"),           # Loopback
    ipaddress.ip_network("::/128"),            # Unspecified
    ipaddress.ip_network("fe80::/10"),         # Link-local
    ipaddress.ip_network("fc00::/7"),          # Unique local (ULA)
    ipaddress.ip_network("ff00::/8"),          # Multicast
    ipaddress.ip_network("::ffff:0:0/96"),     # IPv4-mapped IPv6
    ipaddress.ip_network("64:ff9b::/96"),      # IPv4/IPv6 translation
    ipaddress.ip_network("2001:db8::/32"),     # Documentation
]


def is_ip_blocked(ip_addr: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Check if an IP address belongs to any blocked / private / loopback network."""
    if isinstance(ip_addr, ipaddress.IPv6Address) and ip_addr.ipv4_mapped:
        ip_addr = ip_addr.ipv4_mapped

    if ip_addr.is_private or ip_addr.is_loopback or ip_addr.is_link_local or ip_addr.is_reserved or ip_addr.is_multicast:
        return True

    for net in BLOCKED_NETWORKS:
        if ip_addr in net:
            return True

    return False


def validate_url_safety(raw_url: str) -> Tuple[str, str]:
    """
    Validate a user-provided URL against SSRF and protocol exploits.
    Returns (normalized_url, hostname) or raises SSRFValidationError.
    """
    if not raw_url or not isinstance(raw_url, str):
        raise SSRFValidationError("URL cannot be empty.")

    raw_url = raw_url.strip()

    # If no protocol scheme is specified at all, default to https://
    if not ("://" in raw_url or raw_url.startswith(("http:", "https:", "file:", "javascript:", "data:", "ftp:"))):
        raw_url = "https://" + raw_url

    try:
        parsed = urlparse(raw_url)
    except Exception as e:
        raise SSRFValidationError(f"Invalid URL structure: {e}")

    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        raise SSRFValidationError(f"Forbidden URL scheme '{scheme}'. Only HTTP and HTTPS are permitted.")

    hostname = (parsed.hostname or "").strip().lower()
    if not hostname:
        raise SSRFValidationError("URL has an empty or invalid hostname.")

    # Block common literal hosts directly
    if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "::1", "local") or hostname.endswith(".local") or hostname.endswith(".localhost"):
        raise SSRFValidationError(f"Access to private/local host '{hostname}' is blocked.")

    # Check if hostname is an IP literal
    is_ip = False
    try:
        ip_obj = ipaddress.ip_address(hostname)
        is_ip = True
    except ValueError:
        ip_obj = None

    if is_ip and ip_obj is not None:
        if is_ip_blocked(ip_obj):
            raise SSRFValidationError(f"Access to private/reserved IP address '{hostname}' is blocked.")
        return raw_url, hostname

    # Resolve hostname via DNS to verify resolved IP is safe
    try:
        addr_info = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
        for item in addr_info:
            sockaddr = item[4]
            ip_str = sockaddr[0]
            try:
                resolved_ip = ipaddress.ip_address(ip_str)
                if is_ip_blocked(resolved_ip):
                    raise SSRFValidationError(
                        f"Host '{hostname}' resolves to private/restricted IP '{ip_str}' and is blocked."
                    )
            except ValueError:
                pass
    except socket.gaierror:
        # DNS resolution failure will be handled by fetcher
        pass

    return raw_url, hostname
