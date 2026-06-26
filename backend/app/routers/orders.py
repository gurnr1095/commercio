"""Orders routes (scaffold — endpoints and state machine added in a later phase)."""

from fastapi import APIRouter

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/_ping")
def ping() -> dict:
    return {"module": "orders", "status": "ok"}
