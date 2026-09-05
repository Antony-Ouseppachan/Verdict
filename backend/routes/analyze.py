"""
Analysis & Live Feed API Endpoints for Verdict Intelligence SOC Platform.
"""

import time
import json
import asyncio
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..schemas.api import AnalyzeRequest, AnalyzeResponse
from ..services.pipeline import pipeline_service
from ..core.ssrf import SSRFValidationError
from ..core.fetcher import (
    FetchTimeoutError,
    FetchUnreachableError,
    FetchSizeExceededError,
    FetchError,
)

router = APIRouter(tags=["Analysis & Live Feed"])

# In-memory recent events ring buffer (max 500 events)
MAX_BUFFER_SIZE = 500
recent_events: List[Dict[str, Any]] = []
event_subscribers: List[asyncio.Queue] = []


def broadcast_event(event: Dict[str, Any]):
    """Broadcast an analysis event to all connected SSE clients."""
    # Add to beginning of ring buffer
    recent_events.insert(0, event)
    if len(recent_events) > MAX_BUFFER_SIZE:
        recent_events.pop()

    # Dispatch to SSE subscriber queues
    dead_queues = []
    for q in event_subscribers:
        try:
            q.put_nowait(event)
        except Exception:
            dead_queues.append(q)

    for dq in dead_queues:
        if dq in event_subscribers:
            event_subscribers.remove(dq)


def execute_analysis(raw_url: str, initiator: str = "CONSOLE") -> AnalyzeResponse:
    """Execute analysis and broadcast to live feed."""
    response = pipeline_service.analyze(raw_url)

    # Derive clean hostname
    try:
        hostname = urlparse(response.url).hostname or response.url
    except Exception:
        hostname = response.url

    event_payload = {
        "id": f"evt-{int(time.time() * 1000)}-{hash(response.url) % 10000:04d}",
        "timestamp": int(time.time() * 1000),
        "url": response.url,
        "finalUrl": response.finalUrl,
        "hostname": hostname,
        "verdict": response.verdict,
        "riskScore": response.riskScore,
        "models": response.models.model_dump(),
        "findings": [f.model_dump() for f in response.findings],
        "analysis": response.analysis.model_dump(),
        "telemetry": response.telemetry,
        "scanDuration": response.scanDuration,
        "initiator": initiator,
    }

    broadcast_event(event_payload)
    return response


# ==============================================================================
# PRIMARY & EXTENSION COMPATIBILITY ANALYZE ENDPOINTS
# ==============================================================================

@router.post(
    "/api/analyze",
    response_model=AnalyzeResponse,
    summary="Analyze URL & Broadcast to SOC Live Feed",
)
@router.post(
    "/v1/analyze",
    response_model=AnalyzeResponse,
    summary="Extension Compatible Analysis Endpoint",
)
async def analyze_url_endpoint(payload: AnalyzeRequest, request: Request):
    if not payload.url or not payload.url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL parameter is required and cannot be empty.",
        )

    # Detect initiator
    user_agent = request.headers.get("user-agent", "")
    initiator = "CHROME_EXTENSION" if "extension" in user_agent.lower() or "Verdict" in user_agent else "ANALYST_CONSOLE"

    try:
        response = execute_analysis(payload.url.strip(), initiator=initiator)
        return response
    except SSRFValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"SSRF Protection Blocked: {str(e)}",
        )
    except FetchTimeoutError as e:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Website Analysis Timeout: {str(e)}",
        )
    except FetchSizeExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Target Page Exceeds Allowed Size: {str(e)}",
        )
    except FetchUnreachableError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Target Website Unreachable: {str(e)}",
        )
    except FetchError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Web Fetch Error: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference Pipeline Error: {str(e)}",
        )


# ==============================================================================
# LIVE FEED & SSE STREAMING ENDPOINTS
# ==============================================================================

@router.get("/api/events", summary="Get Recent SOC Feed Events")
@router.get("/v1/investigations", summary="Get Recent Investigations")
async def get_recent_events(limit: int = 100):
    return {
        "success": True,
        "total": len(recent_events),
        "events": recent_events[:limit],
    }


@router.delete("/api/events", summary="Clear SOC Feed Events")
@router.delete("/v1/investigations", summary="Clear Investigations")
async def clear_events():
    recent_events.clear()
    return {"success": True, "count": 0}


@router.get("/api/events/stream", summary="Server-Sent Events Stream for SOC Live Feed")
async def events_stream(request: Request):
    """Real-time SSE stream sending incoming analysis events to connected SOC consoles."""
    queue: asyncio.Queue = asyncio.Queue(maxsize=50)
    event_subscribers.append(queue)

    async def event_generator():
        try:
            # Send initial keepalive & connection handshake
            yield f"event: handshake\ndata: {json.dumps({'status': 'connected', 'bufferedEvents': len(recent_events)})}\n\n"

            while True:
                # Check for client disconnect
                if await request.is_disconnected():
                    break

                try:
                    # Wait for next event or send keepalive ping every 15s
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"event: new_event\ndata: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield f": ping\n\n"
        finally:
            if queue in event_subscribers:
                event_subscribers.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# Extension status handshake
@router.get("/v1/status")
@router.get("/api/status")
async def protection_status():
    return {
        "status": "online",
        "models": "4_ONLINE",
        "timestamp": int(time.time() * 1000),
    }
