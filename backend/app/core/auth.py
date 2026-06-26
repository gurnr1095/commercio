"""Clerk JWT verification dependency.

This is a scaffold. Verification is wired up but kept simple: when
`AUTH_DISABLED=true` (the default for local development) the dependency returns a
stub user so the app is runnable before Clerk is configured. Flip `AUTH_DISABLED`
to false and set the Clerk env vars to enforce real token verification.
"""

from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.config import settings

_bearer = HTTPBearer(auto_error=False)
_jwks_client: PyJWKClient | None = None


@dataclass
class AuthUser:
    """The authenticated principal extracted from a verified Clerk token."""

    id: str
    claims: dict


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        if not settings.clerk_jwks_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="CLERK_JWKS_URL is not configured.",
            )
        _jwks_client = PyJWKClient(settings.clerk_jwks_url)
    return _jwks_client


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> AuthUser:
    """Verify the incoming Clerk JWT and return the current user."""
    if settings.auth_disabled:
        return AuthUser(id="demo-owner", claims={"sub": "demo-owner"})

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )

    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(credentials.credentials)
        claims = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer or None,
            audience=settings.clerk_audience or None,
            options={"verify_aud": bool(settings.clerk_audience)},
        )
    except jwt.PyJWTError as exc:  # noqa: BLE001 - surface as 401
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        ) from exc

    return AuthUser(id=claims.get("sub", ""), claims=claims)
