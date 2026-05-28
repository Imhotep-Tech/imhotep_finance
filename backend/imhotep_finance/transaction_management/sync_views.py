"""
Mobile Sync Push API
====================
Endpoint: POST /api/sync/push/
Authentication: IsAuthenticated (Bearer JWT)

Accepts batches of locally-modified records from the mobile client and applies a
synchronous Last-Write-Wins strategy that explicitly favours mobile input:

  if mobile_record.updated_at >= server_record.updated_at:
      overwrite server record

All operations execute in the active HTTP request-response thread (no Celery, no
background tasks) to comply with PythonAnywhere Free Tier constraints.

Payload schema:
{
  "transactions": [
    {
      "client_uuid": "uuid4-string",        // required, identifies the record
      "updated_at": "2025-01-01T12:00:00Z", // required, ISO 8601 UTC
      "is_deleted": false,                  // soft-delete flag
      "date": "2025-01-01",
      "amount": 99.99,
      "currency": "USD",
      "trans_status": "Withdraw",
      "trans_details": "Coffee",
      "category": "Food",
      "place": "General"
    },
    ...
  ],
  "networth": [
    {
      "client_uuid": "uuid4-string",
      "updated_at": "2025-01-01T12:00:00Z",
      "is_deleted": false,
      "total": 5000.00,
      "currency": "USD",
      "place": "Bank"
    },
    ...
  ],
  "wishlist": [
    {
      "client_uuid": "uuid4-string",
      "updated_at": "2025-01-01T12:00:00Z",
      "is_deleted": false,
      "year": 2025,
      "price": 299.99,
      "currency": "USD",
      "status": false,
      "link": "https://...",
      "wish_details": "New laptop",
      "place": "General"
    },
    ...
  ]
}

Response:
{
  "synced": { "transactions": 3, "networth": 1, "wishlist": 0 },
  "skipped": { "transactions": 1, "networth": 0, "wishlist": 0 },
  "errors": []
}
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone as dt_timezone
from typing import Any

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from transaction_management.models import NetWorth, Transactions
from wishlist_management.models import Wishlist

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_dt(value: str | None) -> datetime | None:
    """Parse an ISO 8601 datetime string to a timezone-aware datetime object."""
    if not value:
        return None
    try:
        # Python 3.11+ fromisoformat handles Z suffix; for older versions replace it.
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=dt_timezone.utc)
        return dt
    except (ValueError, AttributeError):
        return None


def _parse_uuid(value: str | None) -> uuid.UUID | None:
    """Parse a UUID string; return None on invalid input."""
    if not value:
        return None
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError):
        return None


# ---------------------------------------------------------------------------
# Per-model sync processors
# ---------------------------------------------------------------------------

def _sync_transactions(user, records: list[dict]) -> tuple[int, int, list[str]]:
    """Apply mobile transaction records. Returns (synced, skipped, error_messages)."""
    synced = skipped = 0
    errors: list[str] = []

    for record in records:
        client_uuid = _parse_uuid(record.get('client_uuid'))
        if not client_uuid:
            errors.append(f"Transaction record missing or invalid client_uuid: {record.get('client_uuid')}")
            continue

        mobile_updated_at = _parse_dt(record.get('updated_at'))
        if not mobile_updated_at:
            errors.append(f"Transaction {client_uuid}: invalid or missing updated_at")
            continue

        is_deleted = bool(record.get('is_deleted', False))

        try:
            server_record = Transactions.objects.filter(
                client_uuid=client_uuid, user=user
            ).first()

            if server_record is None:
                if is_deleted:
                    # Nothing to create — mobile deleted something that doesn't exist on server.
                    skipped += 1
                    continue

                # Create new record from mobile
                Transactions.objects.create(
                    user=user,
                    client_uuid=client_uuid,
                    date=record.get('date'),
                    amount=record.get('amount', 0.0),
                    currency=record.get('currency', 'USD'),
                    trans_status=record.get('trans_status', 'Withdraw'),
                    trans_details=record.get('trans_details', ''),
                    category=record.get('category', ''),
                    place=record.get('place', 'General'),
                    is_deleted=is_deleted,
                )
                synced += 1

            elif mobile_updated_at >= server_record.updated_at:
                # Mobile data is newer or equal — Mobile Wins
                if is_deleted:
                    server_record.is_deleted = True
                else:
                    server_record.date = record.get('date', server_record.date)
                    server_record.amount = record.get('amount', server_record.amount)
                    server_record.currency = record.get('currency', server_record.currency)
                    server_record.trans_status = record.get('trans_status', server_record.trans_status)
                    server_record.trans_details = record.get('trans_details', server_record.trans_details)
                    server_record.category = record.get('category', server_record.category)
                    server_record.place = record.get('place', server_record.place)
                    server_record.is_deleted = False

                server_record.save()
                synced += 1
            else:
                # Server is strictly newer — skip
                skipped += 1

        except Exception as exc:
            logger.exception("Sync error for transaction %s: %s", client_uuid, exc)
            errors.append(f"Transaction {client_uuid}: {str(exc)}")

    return synced, skipped, errors


def _sync_networth(user, records: list[dict]) -> tuple[int, int, list[str]]:
    """Apply mobile networth records. Upserts by client_uuid."""
    synced = skipped = 0
    errors: list[str] = []

    for record in records:
        client_uuid = _parse_uuid(record.get('client_uuid'))
        if not client_uuid:
            errors.append(f"NetWorth record missing or invalid client_uuid: {record.get('client_uuid')}")
            continue

        mobile_updated_at = _parse_dt(record.get('updated_at'))
        if not mobile_updated_at:
            errors.append(f"NetWorth {client_uuid}: invalid or missing updated_at")
            continue

        is_deleted = bool(record.get('is_deleted', False))

        try:
            server_record = NetWorth.objects.filter(
                client_uuid=client_uuid, user=user
            ).first()

            if server_record is None:
                if is_deleted:
                    skipped += 1
                    continue

                NetWorth.objects.create(
                    user=user,
                    client_uuid=client_uuid,
                    total=record.get('total', 0.0),
                    currency=record.get('currency', 'USD'),
                    place=record.get('place', 'General'),
                    is_deleted=is_deleted,
                )
                synced += 1

            elif mobile_updated_at >= server_record.updated_at:
                if is_deleted:
                    server_record.is_deleted = True
                else:
                    server_record.total = record.get('total', server_record.total)
                    server_record.currency = record.get('currency', server_record.currency)
                    server_record.place = record.get('place', server_record.place)
                    server_record.is_deleted = False

                server_record.save()
                synced += 1
            else:
                skipped += 1

        except Exception as exc:
            logger.exception("Sync error for networth %s: %s", client_uuid, exc)
            errors.append(f"NetWorth {client_uuid}: {str(exc)}")

    return synced, skipped, errors


def _sync_wishlist(user, records: list[dict]) -> tuple[int, int, list[str]]:
    """Apply mobile wishlist records. Upserts by client_uuid."""
    synced = skipped = 0
    errors: list[str] = []

    for record in records:
        client_uuid = _parse_uuid(record.get('client_uuid'))
        if not client_uuid:
            errors.append(f"Wishlist record missing or invalid client_uuid: {record.get('client_uuid')}")
            continue

        mobile_updated_at = _parse_dt(record.get('updated_at'))
        if not mobile_updated_at:
            errors.append(f"Wishlist {client_uuid}: invalid or missing updated_at")
            continue

        is_deleted = bool(record.get('is_deleted', False))

        try:
            server_record = Wishlist.objects.filter(
                client_uuid=client_uuid, user=user
            ).first()

            if server_record is None:
                if is_deleted:
                    skipped += 1
                    continue

                Wishlist.objects.create(
                    user=user,
                    client_uuid=client_uuid,
                    year=record.get('year', timezone.now().year),
                    price=record.get('price', 0.0),
                    currency=record.get('currency', 'USD'),
                    status=bool(record.get('status', False)),
                    link=record.get('link', ''),
                    wish_details=record.get('wish_details', ''),
                    place=record.get('place', 'General'),
                    is_deleted=is_deleted,
                )
                synced += 1

            elif mobile_updated_at >= server_record.updated_at:
                if is_deleted:
                    server_record.is_deleted = True
                else:
                    server_record.year = record.get('year', server_record.year)
                    server_record.price = record.get('price', server_record.price)
                    server_record.currency = record.get('currency', server_record.currency)
                    server_record.status = bool(record.get('status', server_record.status))
                    server_record.link = record.get('link', server_record.link)
                    server_record.wish_details = record.get('wish_details', server_record.wish_details)
                    server_record.place = record.get('place', server_record.place)
                    server_record.is_deleted = False

                server_record.save()
                synced += 1
            else:
                skipped += 1

        except Exception as exc:
            logger.exception("Sync error for wishlist %s: %s", client_uuid, exc)
            errors.append(f"Wishlist {client_uuid}: {str(exc)}")

    return synced, skipped, errors


# ---------------------------------------------------------------------------
# API View
# ---------------------------------------------------------------------------

class MobileSyncApi(APIView):
    """
    POST /api/sync/push/

    Synchronous Mobile-Wins Last-Write-Wins sync endpoint.
    Runs entirely within the HTTP request thread (PythonAnywhere Free Tier compatible).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        user = request.user
        data = request.data

        # Accept three optional lists; default to empty if not provided
        transaction_records: list[dict[str, Any]] = data.get('transactions', [])
        networth_records: list[dict[str, Any]] = data.get('networth', [])
        wishlist_records: list[dict[str, Any]] = data.get('wishlist', [])

        # Basic type validation
        if not isinstance(transaction_records, list):
            return Response(
                {'error': '`transactions` must be an array'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(networth_records, list):
            return Response(
                {'error': '`networth` must be an array'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(wishlist_records, list):
            return Response(
                {'error': '`wishlist` must be an array'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Guard against absurdly large payloads
        MAX_BATCH_SIZE = 500
        if len(transaction_records) + len(networth_records) + len(wishlist_records) > MAX_BATCH_SIZE:
            return Response(
                {'error': f'Batch size exceeds maximum of {MAX_BATCH_SIZE} records per sync call'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        all_errors: list[str] = []

        # --- Process each model ---
        t_synced, t_skipped, t_errors = _sync_transactions(user, transaction_records)
        all_errors.extend(t_errors)

        n_synced, n_skipped, n_errors = _sync_networth(user, networth_records)
        all_errors.extend(n_errors)

        w_synced, w_skipped, w_errors = _sync_wishlist(user, wishlist_records)
        all_errors.extend(w_errors)

        response_payload = {
            'synced': {
                'transactions': t_synced,
                'networth': n_synced,
                'wishlist': w_synced,
            },
            'skipped': {
                'transactions': t_skipped,
                'networth': n_skipped,
                'wishlist': w_skipped,
            },
            'errors': all_errors,
        }

        http_status = status.HTTP_200_OK
        if all_errors and (t_synced + n_synced + w_synced) == 0:
            # All records failed — report as partial error
            http_status = status.HTTP_207_MULTI_STATUS

        return Response(response_payload, status=http_status)
