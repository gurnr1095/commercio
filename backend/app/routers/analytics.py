"""Analytics routes (scaffold — endpoints added in a later phase)."""

from fastapi import APIRouter

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/_ping")
def ping() -> dict:
    return {"module": "analytics", "status": "ok"}
