"""Customers routes (scaffold — endpoints added in a later phase)."""

from fastapi import APIRouter

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/_ping")
def ping() -> dict:
    return {"module": "customers", "status": "ok"}
