"""AI / LLM routes (scaffold — OpenRouter workflows added in a later phase).

Will host the on-demand inventory-analysis and sales-summarization endpoints,
backed by schema-constrained (Pydantic) structured outputs with validate +
retry/repair and an OpenRouter model-fallback list.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/_ping")
def ping() -> dict:
    return {"module": "ai", "status": "ok"}
