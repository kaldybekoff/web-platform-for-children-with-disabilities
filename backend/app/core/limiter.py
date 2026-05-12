"""Shared slowapi rate-limiter instance.

The app runs behind Render's load balancer (and the domain is on Cloudflare),
so `request.client.host` is the proxy address — the same for every visitor.
We derive the real client IP from the forwarded headers instead, otherwise all
users would share a single rate-limit bucket.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def client_ip(request: Request) -> str:
    """Best-effort real client IP behind Render / Cloudflare."""
    # Cloudflare (only set when the domain is proxied — "orange cloud")
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    # Render's load balancer sets X-Forwarded-For with the client IP first
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        first = xff.split(",")[0].strip()
        if first:
            return first
    return get_remote_address(request)


limiter = Limiter(key_func=client_ip)
