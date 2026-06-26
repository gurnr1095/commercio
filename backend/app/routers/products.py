"""Products / inventory routes (scaffold — endpoints added in a later phase)."""

from fastapi import APIRouter

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/_ping")
def ping() -> dict:
    return {"module": "products", "status": "ok"}
