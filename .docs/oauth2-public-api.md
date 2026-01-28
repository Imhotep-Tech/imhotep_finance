## OAuth2 Public API – Single‑File Guide

This document explains **everything you need** to integrate with the Imhotep Finance OAuth2 Public API, **only by reading this file**.  
It is strictly based on the current backend code under `backend/imhotep_finance/` (developer portal, OAuth2 provider, and public API).

### Table of Contents

1. [What You Can Build](#what-you-can-build)
2. [High‑Level Architecture](#high-level-architecture)
3. [End‑to‑End Quickstart (from zero to first transaction)](#end-to-end-quickstart-from-zero-to-first-transaction)
4. [OAuth2 Flow Details](#oauth2-flow-details)
5. [Public API Reference (Transactions)](#public-api-reference-transactions)
6. [Developer Portal API Reference](#developer-portal-api-reference)
7. [Swagger / API Docs](#swagger--api-docs)
8. [Troubleshooting](#troubleshooting)
9. [Security & Scopes](#security--scopes)
10. [Implementation Status & Future Work](#implementation-status--future-work)
11. [Support](#support)

---

## What You Can Build

The public API lets a third‑party app **create, list, and delete transactions** for an Imhotep Finance user via OAuth2.

Typical use cases:

- **Todo integrations**: create a "Payment" transaction when a task completes.
- **Budgeting tools**: sync the user’s transaction history into your app.
- **Automation scripts**: automatically log recurring deposits/withdrawals.

The backend code for this lives in:

- `public_api/apis.py` – OAuth2‑protected transaction endpoints  
- `public_api/serializers.py` – request/response schemas  
- `public_api/permissions.py` – scope checks  
- `developer_portal/apis.py` – app registration & management  
- `developer_portal/oauth_views.py` – custom `/o/authorize/` view  
- `imhotep_finance/settings.py` – OAuth2 provider configuration

---

## High‑Level Architecture

### Technology Stack (from code)

- **OAuth2 provider**: `django-oauth-toolkit` (`OAUTH2_PROVIDER` settings in `settings.py`)
- **API framework**: Django REST Framework (`APIView` classes)
- **Auth for public API**: OAuth2 Bearer tokens (`OAuth2Authentication`, `TokenHasScope`)
- **Auth for developer portal**: JWT (SimpleJWT) – via `/api/auth/login/`
- **Docs**: drf-spectacular → `/swagger/` & `/api/schema/`

### OAuth2 Scopes (from `OAUTH2_PROVIDER["SCOPES"]`)

| Scope                | Description (from settings)                          |
|----------------------|------------------------------------------------------|
| `read`               | Read access to your financial data                   |
| `write`              | Write access to create/delete transactions           |
| `transactions:read`  | Read transaction data                                |
| `transactions:write` | Create and delete transactions                       |

Tokens can be issued with either the generic `read` / `write` scopes or the more specific `transactions:*` scopes.  
The public transaction endpoints explicitly require:

- `transactions:write` **or** `write` for create/delete (see `permissions.py`)
- `transactions:read` **or** `read` for list

### Token & Code Lifetimes (from `settings.py`)

- **Authorization code**: 600 seconds (10 minutes) – `AUTHORIZATION_CODE_EXPIRE_SECONDS`
- **Access token**: 3600 seconds (1 hour) – `ACCESS_TOKEN_EXPIRE_SECONDS`

---

## End‑to‑End Quickstart (from zero to first transaction)

This section is the **shortest path from nothing to “one transaction created via OAuth2”**.
Everything shown here is backed by the code in `accounts`, `developer_portal`, and `public_api`.

### Step 0 — Base URLs

All examples assume:

- **Backend**: `http://localhost:8000`
- **API base**: `http://localhost:8000/api/`
- **Public API base**: `http://localhost:8000/api/v1/external/`

Adjust the host if you run the backend elsewhere.

### Step 1 — Log in and get a JWT (developer)

The developer portal uses SimpleJWT, implemented in `accounts/apis.py::LoginApi` and wired at `path('auth/login/', LoginApi.as_view(), ...)`.

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "YOUR_USERNAME_OR_EMAIL",
    "password": "YOUR_PASSWORD"
  }'
```

**Expected 200 response (simplified, from `LoginApi`):**

```json
{
  "refresh": "jwt-refresh-token",
  "access": "jwt-access-token",
  "user": {
    "id": 1,
    "username": "dev",
    "email": "dev@example.com"
  }
}
```

You will use the `access` token as a **Bearer** token for all `/api/developer/` endpoints.

### Step 2 — Register an OAuth2 application

The create endpoint is `CreateOAuth2ApplicationApi` in `developer_portal/apis.py`, mapped at:

- `POST /api/developer/apps/`

```bash
curl -X POST http://localhost:8000/api/developer/apps/ \
  -H "Authorization: Bearer YOUR_JWT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Todo App",
    "client_type": "confidential",
    "authorization_grant_type": "authorization-code",
    "redirect_uris": "http://localhost:3000/oauth/callback"
  }'
```

**Expected 201 response (fields from `CreateOAuth2ApplicationApi`):**

```json
{
  "id": 1,
  "name": "My Todo App",
  "client_id": "generated-client-id",
  "client_secret": "generated-client-secret",
  "client_type": "confidential",
  "authorization_grant_type": "authorization-code",
  "redirect_uris": "http://localhost:3000/oauth/callback ...",
  "skip_authorization": false,
  "created": "2026-01-25T10:00:00Z",
  "updated": "2026-01-25T10:00:00Z",
  "user_id": 1,
  "message": "Application created successfully",
  "note": "Swagger redirect URI has been automatically added for API testing"
}
```

- **Save** `client_id` and `client_secret` – the secret is intentionally only returned on creation (see `CreateOAuth2ApplicationApi`).

### Step 3 — Redirect your user to `/o/authorize/`

The custom authorization view (`CustomAuthorizationView` in `developer_portal/oauth_views.py`) is mounted at:

- `GET /o/authorize/`

Construct an URL like:

```text
http://localhost:8000/o/authorize/?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  scope=transactions:write
```

All parameters in this query are passed through to `django-oauth-toolkit`:

- `response_type` must be `code`
- `client_id` must match your registered app
- `redirect_uri` must exactly match **one of** the registered URIs on the application
- `scope` is a space‑separated list. Examples:
  - `transactions:write`
  - `transactions:read`
  - `transactions:read transactions:write`

**Example full URL:**

```text
http://localhost:8000/o/authorize/?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/oauth/callback&scope=transactions:write
```

When the user:

1. Is not logged in → they will be redirected to frontend login (`/login`) with a `next` back to `/o/authorize/` (as implemented in `CustomAuthorizationView`).
2. Is logged in → they will see the standard OAuth2 consent screen, then be redirected back to:

```text
http://localhost:3000/oauth/callback?code=AUTHORIZATION_CODE&state=STATE
```

Authorization codes are:

- Single‑use
- Valid for 600 seconds (10 minutes), see `AUTHORIZATION_CODE_EXPIRE_SECONDS`.

### Step 4 — Exchange authorization code for access token

The token endpoint comes from `oauth2_provider.urls` and is mounted at:

- `POST /o/token/`

Use standard `application/x-www-form-urlencoded` body:

```bash
curl -X POST http://localhost:8000/o/token/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=YOUR_REDIRECT_URI&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"
```

**Typical 200 response from django-oauth-toolkit:**

```json
{
  "access_token": "access-token-string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh-token-string",
  "scope": "transactions:write"
}
```

- `expires_in` matches `ACCESS_TOKEN_EXPIRE_SECONDS` in `settings.py` (1 hour).

### Step 5 — Call the Public API (create a transaction)

The create endpoint is `ExternalTransactionCreateApi` in `public_api/apis.py`, mounted at:

- `POST /api/v1/external/transaction/add/`

It uses:

- `OAuth2Authentication`
- `TokenHasScope`
- `required_scopes = ['transactions:write']`

```bash
curl -X POST http://localhost:8000/api/v1/external/transaction/add/ \
  -H "Authorization: Bearer YOUR_OAUTH2_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "100.50",
    "currency": "USD",
    "trans_status": "deposit",
    "category": "Salary",
    "trans_details": "Payment from Todo App",
    "date": "2026-01-25"
  }'
```

The request body shape is defined in `ExternalTransactionCreateSerializer` and supports:

- `amount` (required) – decimal, `> 0`
- `currency` (required) – must be one of `get_allowed_currencies()` from `finance_management.utils.currencies`
- `trans_status` (required) – accepts **one of** `Deposit`, `Withdraw`, `deposit`, `withdraw`
- `category` (optional)
- `trans_details` (optional)
- `date` (optional) – `YYYY-MM-DD`, defaults to today when omitted (see serializer help text and `create_transaction` usage)

**Expected 201 response (from `ExternalTransactionCreateResponseSerializer` and `create_transaction` result):**

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "transaction_id": 123,
  "date": "2026-01-25",
  "amount": "100.50",
  "currency": "USD",
  "trans_status": "Deposit"
}
```

Note: `trans_status` in the response comes from the stored transaction object and may be normalized (e.g. `Deposit` instead of `deposit`).

At this point, your integration is working end‑to‑end.

---

## OAuth2 Flow Details

### Summary (from the code paths)

1. **Developer** authenticates with JWT:
   - `POST /api/auth/login/` → SimpleJWT access token (`LoginApi` in `accounts/apis.py`).
2. **Developer** creates an OAuth2 app:
   - `POST /api/developer/apps/` → `CreateOAuth2ApplicationApi`.
3. **End user** is redirected to `/o/authorize/`:
   - `CustomAuthorizationView` ensures a session using JWT if present, or redirects to frontend login (`/login`) with a `next` back to `/o/authorize/`.
4. **django-oauth-toolkit** handles:
   - Showing the consent screen
   - Issuing an authorization code
5. **Third‑party app** exchanges the authorization code at:
   - `POST /o/token/` → access token (+ refresh token if the grant type allows).
6. **Third‑party app** calls:
   - `POST /api/v1/external/transaction/add/`
   - `GET /api/v1/external/transaction/list/`
   - `DELETE /api/v1/external/transaction/delete/<id>/`

The user associated with these operations always comes from `request.user` created by `OAuth2Authentication` using the access token (see every `ExternalTransaction*Api` class).

### Important URLs (from `imhotep_finance/urls.py`)

- Developer accounts & JWT auth: `/api/...`
- Developer portal APIs: `/api/developer/...`
- Public external API: `/api/v1/external/...`
- OAuth2 provider:
  - Custom authorize: `/o/authorize/`
  - Other dot endpoints: `/o/token/`, `/o/revoke_token/`, etc.
- Swagger UI: `/swagger/`
- OpenAPI schema: `/api/schema/`

---

## Public API Reference (Transactions)

All endpoints below are defined in `public_api/apis.py` and `public_api/urls.py` and are included under the `/api/v1/external/` prefix.

### Authentication & Scopes (shared)

- **Auth**: OAuth2 Bearer token (via `OAuth2Authentication`)
- **Scope enforcement**: `TokenHasScope` with `required_scopes` on each view
- **Scope mapping**:
  - `transactions:write` or `write` → create/delete
  - `transactions:read` or `read` → list

### 1. Create Transaction

- **Method**: `POST`
- **Path**: `/api/v1/external/transaction/add/`
- **View**: `ExternalTransactionCreateApi`
- **Scopes**: `transactions:write` (or `write`)

**Request body** (from `ExternalTransactionCreateSerializer`):

```json
{
  "amount": "100.50",
  "currency": "USD",
  "trans_status": "deposit",
  "category": "Salary",
  "trans_details": "Payment from Todo App",
  "date": "2026-01-25"
}
```

- `amount` (required) – decimal string, must be greater than 0
- `currency` (required) – one of the allowed currencies configured in the app
- `trans_status` (required) – one of `Deposit`, `Withdraw`, `deposit`, `withdraw`
- `category` (optional, string up to 100 chars)
- `trans_details` (optional, string up to 500 chars)
- `date` (optional, `YYYY-MM-DD`), defaults to today if omitted

**201 response** (`ExternalTransactionCreateResponseSerializer`):

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "transaction_id": 123,
  "date": "2026-01-25",
  "amount": "100.50",
  "currency": "USD",
  "trans_status": "Deposit"
}
```

### 2. List Transactions

- **Method**: `GET`
- **Path**: `/api/v1/external/transaction/list/`
- **View**: `ExternalTransactionListApi`
- **Scopes**: `transactions:read` (or `read`)

Query parameters are validated by `ExternalTransactionListFilterSerializer`:

- `start_date` (optional, `YYYY-MM-DD`) – default: first day of current month
- `end_date` (optional, `YYYY-MM-DD`) – default: last day of current month
- `category` (optional, string)
- `trans_status` (optional) – one of `Deposit`, `Withdraw`, `deposit`, `withdraw`
- `page` (optional, int ≥ 1, default `1`)

The view calls `get_transactions_for_user(...)` from `transaction_management.selectors`.

**200 response** (`ExternalTransactionListResponseSerializer` + `serialize_transaction`):

```json
{
  "transactions": [
    {
      "id": 123,
      "date": "2026-01-25",
      "amount": "100.50",
      "currency": "USD",
      "trans_status": "Deposit",
      "category": "Salary",
      "trans_details": "Payment from Todo App"
    }
  ],
  "pagination": {
    "page": 1,
    "num_pages": 1,
    "per_page": 20,
    "total": 1
  },
  "date_range": {
    "start_date": "2026-01-01",
    "end_date": "2026-01-31"
  }
}
```

### 3. Delete Transaction

- **Method**: `DELETE`
- **Path**: `/api/v1/external/transaction/delete/<transaction_id>/`
- **View**: `ExternalTransactionDeleteApi`
- **Path variable**: `transaction_id` (int)
- **Scopes**: `transactions:write` (or `write`)

The view calls `delete_transaction(user=user, transaction_id=transaction_id)` from `transaction_management.services`.

**200 response** (`ExternalTransactionDeleteResponseSerializer`):

```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

**404 response** (from `Http404` in the delete call):

```json
{
  "error": "Transaction not found or you do not have permission to delete it"
}
```

---

## Developer Portal API Reference

All endpoints in this section are defined in `developer_portal/apis.py` and mounted under `/api/developer/` in `imhotep_finance/urls.py`.
Authentication is always via **JWT access token** (`Authorization: Bearer <jwt-access>`) and `IsAuthenticated` permissions.

### 1. Create or List Applications

#### Create OAuth2 Application

- **Method**: `POST`
- **Path**: `/api/developer/apps/`
- **View**: `CreateOAuth2ApplicationApi.post`
- **Auth**: JWT Bearer

Request body (`OAuth2ApplicationCreateSerializer`):

```json
{
  "name": "My Todo App",
  "client_type": "confidential",
  "authorization_grant_type": "authorization-code",
  "redirect_uris": "http://localhost:3000/oauth/callback"
}
```

Key behavior from code:

- If valid, `create_oauth2_application(...)` returns an `Application` instance and a message.
- Swagger redirect URI is auto‑added for testing:
  - e.g. `http://127.0.0.1:8000/swagger/oauth2-redirect.html`

Response includes `client_secret` only on creation (see the implementation in `CreateOAuth2ApplicationApi`).

#### List OAuth2 Applications

- **Method**: `GET`
- **Path**: `/api/developer/apps/`
- **View**: `CreateOAuth2ApplicationApi.get`
- **Auth**: JWT Bearer

Returns a list of applications for the authenticated user:

```json
[
  {
    "id": 1,
    "name": "My Todo App",
    "client_id": "generated-client-id",
    "client_type": "confidential",
    "authorization_grant_type": "authorization-code",
    "redirect_uris": "http://localhost:3000/oauth/callback ...",
    "skip_authorization": false,
    "created": "2026-01-25T10:00:00Z",
    "updated": "2026-01-25T10:00:00Z"
  }
]
```

### 2. Get / Delete Single Application

#### Get Application

- **Method**: `GET`
- **Path**: `/api/developer/apps/<application_id>/`
- **View**: `GetOAuth2ApplicationApi.get`
- **Auth**: JWT Bearer

Returns a single application (no `client_secret`).

#### Delete Application

- **Method**: `DELETE`
- **Path**: `/api/developer/apps/<application_id>/`
- **View**: `GetOAuth2ApplicationApi.delete`
- **Auth**: JWT Bearer

Deletes the application if owned by the authenticated user.

### 3. Regenerate Client Secret

- **Method**: `POST`
- **Path**: `/api/developer/apps/<application_id>/regenerate-secret/`
- **View**: `RegenerateClientSecretApi.post`
- **Auth**: JWT Bearer

Returns the application with a **new** `client_secret`.

### 4. Add Swagger Redirect URI

- **Method**: `POST`
- **Path**: `/api/developer/apps/<application_id>/add-swagger-uri/`
- **View**: `AddSwaggerRedirectUriApi.post`
- **Auth**: JWT Bearer

Adds the Swagger redirect URI (see `SwaggerOAuth2RedirectView` usage) to the app’s `redirect_uris`.

Response shape (from `AddSwaggerRedirectUriApi`):

```json
{
  "message": "Swagger redirect URI added successfully",
  "redirect_uris": "existing-uris plus swagger-uri"
}
```

---

## Swagger / API Docs

Swagger is configured in `imhotep_finance/urls.py` using drf-spectacular:

- **Schema**: `GET /api/schema/`
- **Swagger UI**: `GET /swagger/`

Every public and developer‑portal endpoint documented above is annotated with `@extend_schema` in code (`public_api/apis.py`, `developer_portal/apis.py`, `accounts/apis.py`).

### Method 1 – Use an existing access token (simplest)

1. Complete the OAuth2 flow and get an access token via `/o/token/`.
2. Open `http://localhost:8000/swagger/`.
3. Click **Authorize**.
4. Choose the **Bearer** (or similar) security scheme.
5. Paste `Bearer YOUR_OAUTH2_ACCESS_TOKEN`.
6. Call the `/api/v1/external/...` endpoints directly from Swagger.

### Method 2 – Use OAuth2 from inside Swagger

Swagger’s OAuth2 integration relies on the redirect handler in `developer_portal.swagger_views` and the route:

- `/swagger/oauth2-redirect.html`

To use it:

1. Ensure your OAuth2 `redirect_uris` include `http://127.0.0.1:8000/swagger/oauth2-redirect.html`.
2. Or call `POST /api/developer/apps/<id>/add-swagger-uri/`.
3. In Swagger UI: click **Authorize**, choose the OAuth2 scheme.
4. Provide your `client_id` (and secret if the flow requires it).
5. Complete the login and consent flow.
6. Swagger will handle the code exchange with `/o/token/` and apply the token automatically.

### Authorization Code vs Access Token (values from settings)

| Item                | Lifetime            | Where it is configured            | Usage                                         |
|---------------------|---------------------|-----------------------------------|-----------------------------------------------|
| Authorization Code  | 600 seconds (10m)   | `AUTHORIZATION_CODE_EXPIRE_SECONDS` | Exchanged at `/o/token/`                       |
| Access Token        | 3600 seconds (1h)   | `ACCESS_TOKEN_EXPIRE_SECONDS`     | Sent as `Authorization: Bearer <token>`       |

---

## Troubleshooting

This section matches actual error handling in `public_api/apis.py`, `developer_portal/apis.py`, and OAuth2 settings.

### Common OAuth2 / Redirect Issues

- **"Invalid redirect_uri"**
  - **Cause**: `redirect_uri` query parameter does not exactly match any registered URI.
  - **Fix**: Ensure protocol, host, port, path, and trailing slash are identical to what is stored on the application.

- **"Invalid authorization code"**
  - **Cause**: Code was used already or expired (> 10 minutes).
  - **Fix**: Restart the authorization flow and obtain a fresh code.

- **Redirect loops to frontend login**
  - **Cause**: User is not authenticated when hitting `/o/authorize/`.
  - **Fix**: Log in in the frontend, then retry, or pass a valid JWT access token so `CustomAuthorizationView` can create a session for you.

### Common Public API Errors

- **401 Unauthorized**
  - **Cause**: Missing or invalid Bearer token; user not found from token (`request.user` check).
  - **Seen in code**:
    - `ExternalTransactionCreateApi`, `ExternalTransactionListApi`, `ExternalTransactionDeleteApi` all return a 401 with `{ "error": "User not found in token" }` if `request.user` is falsy.
  - **Fix**: Ensure `Authorization: Bearer <access_token>` header is present and valid.

- **403 Forbidden – Token does not have required scope**
  - **Cause**: Token lacks the required `transactions:write` or `transactions:read` (or generic `read`/`write`) scope.
  - **Enforced in code**:
    - `required_scopes` on each `ExternalTransaction*Api`
    - `OAuth2TransactionWritePermission` / `OAuth2TransactionReadPermission` in `public_api/permissions.py` check the token’s `scope` string.
  - **Fix**: Request the correct scope(s) in the `/o/authorize/` URL and re‑obtain a token.

- **400 Validation errors**
  - **Cause**: Request bodies or query parameters do not match serializers in `public_api/serializers.py`.
  - **Examples**:
    - `amount <= 0` → `"Amount must be greater than zero"`
    - `currency` not in allowed values
    - Invalid date format
  - **Fix**: Adjust fields to match the serializer requirements (check Swagger or the serializer code).

- **404 Transaction not found**
  - **From**: `ExternalTransactionDeleteApi` catching `Http404`.
  - **Message**: `"Transaction not found or you do not have permission to delete it"`.
  - **Fix**: Ensure the `transaction_id` is correct and belongs to the same user as the access token.

### Debugging Tips (code‑aligned)

1. Check token expiry: access tokens are valid for 1 hour (`ACCESS_TOKEN_EXPIRE_SECONDS`).
2. Confirm scopes on the token – make sure they include `transactions:read` / `transactions:write` or `read` / `write`.
3. Use `/swagger/` to inspect request/response schemas and try requests interactively.
4. Use application logs (Django logs) to see full stack traces when a 500 occurs – every `except Exception` path in `public_api/apis.py` and `developer_portal/apis.py` returns a generic error message.

---

## Security & Scopes

Security configuration is encoded in `settings.py` and in the view/permission classes.

### What the Code Enforces

- **OAuth2 Authorization Code flow** – via `django-oauth-toolkit` and `CustomAuthorizationView`.
- **Scope‑based access** – via `TokenHasScope` on:
  - `ExternalTransactionCreateApi` (`transactions:write`)
  - `ExternalTransactionDeleteApi` (`transactions:write`)
  - `ExternalTransactionListApi` (`transactions:read`)
  - And the custom permission classes in `public_api/permissions.py`.
- **Token lifetimes**:
  - `AUTHORIZATION_CODE_EXPIRE_SECONDS = 600`
  - `ACCESS_TOKEN_EXPIRE_SECONDS = 3600`
- **User isolation**:
  - All operations use `request.user` from the OAuth2 token and call services that filter by user (`create_transaction`, `delete_transaction`, `get_transactions_for_user`).

### Recommended Best Practices for Your Integration

These are usage recommendations for your app (not hard‑coded enforcement):

1. **Store client secrets securely**
   - Never ship `client_secret` in browser/mobile code.
   - Keep it in backend environment variables or secret managers.

2. **Use HTTPS in non‑local environments**
   - Always serve `/o/authorize/`, `/o/token/`, and `/api/v1/external/...` over HTTPS in staging/production.

3. **Request the minimum scopes you need**
   - For read‑only apps, use `transactions:read`.
   - For write operations only, use `transactions:write`.
   - For both, request both scopes in the `scope` parameter.

4. **Handle token expiration**
   - When you receive a 401, refresh or re‑run the OAuth2 flow as appropriate.
   - Keep track of `expires_in` from the token response.

5. **Validate redirect URIs on your side**
   - Avoid constructing redirect URIs dynamically from untrusted input.

---

## Implementation Status & Future Work

Based on the code in `public_api`, `developer_portal`, `accounts`, and `settings.py`:

### Completed

- OAuth2 provider configuration (`OAUTH2_PROVIDER` in `settings.py`)
- Custom authorization view (`CustomAuthorizationView`)
- Developer portal APIs for managing OAuth2 applications
- Public transaction APIs:
  - Create (`ExternalTransactionCreateApi`)
  - List (`ExternalTransactionListApi`)
  - Delete (`ExternalTransactionDeleteApi`)
- Swagger / OpenAPI integration (`/swagger/`, `/api/schema/`)
- Authentication via SimpleJWT for developer portal

### Planned / Marked as Future Enhancements in the Repo

The codebase and docs mention potential future work such as:

- Rate limiting per application
- Usage statistics and analytics
- PKCE for public clients
- Webhooks for transaction events
- API versioning strategy

These are **not yet implemented** in the visible backend code, so do not rely on them.

---

## Support

- **Interactive API docs**: `/swagger/`
- **Developer Portal UI**: `/developer`
- **Backend repo**: `https://github.com/Imhotep-Tech/imhotep_finance`

If something in this document ever seems to conflict with behavior, the **source of truth** is:

- `backend/imhotep_finance/public_api/`  
- `backend/imhotep_finance/developer_portal/`  
- `backend/imhotep_finance/imhotep_finance/settings.py`

Those modules are what this document is synced to.

---

**Last Verified Against Code**: January 2026  
**API Version**: 1.0.0
