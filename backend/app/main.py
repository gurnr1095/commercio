"""Commercio API entrypoint."""

from fastapi import FastAPI, Request
from fastapi.responses import Response

from app.routers import ai, analytics, customers, orders, products

app = FastAPI(
    title="Commercio API",
    description="Merchant operating system — products, customers, orders, analytics, AI.",
    version="0.1.0",
)

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE, GET, OPTIONS, PATCH, POST, PUT",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "600",
}


@app.middleware("http")
async def cors(request: Request, call_next):
    if request.method == "OPTIONS":
        return Response(status_code=200, headers=_CORS_HEADERS)
    response = await call_next(request)
    for k, v in _CORS_HEADERS.items():
        response.headers[k] = v
    return response


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(analytics.router)
app.include_router(ai.router)
