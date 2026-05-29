# 📘 API Documentation

Complete guide to using the Imhotep Finance API, including authentication and Swagger UI.

## Interactive API Documentation

Imhotep Finance automatically generates Swagger/OpenAPI documentation for all backend endpoints.

- **Swagger UI**: http://localhost:8000/swagger/ - Interactive API explorer
- **ReDoc**: http://localhost:8000/redoc/ - Alternative documentation view
- **OpenAPI Schema**: http://localhost:8000/api/schema/ - Raw JSON schema

## Authentication Methods

### 1. JWT Authentication (Main API)

The main application API uses JWT (JSON Web Tokens) for authentication.

#### Getting a JWT Token

**Login Endpoint:**
```bash
POST /api/auth/login/
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "your_username",
    "email": "user@example.com"
  }
}
```

#### Using JWT Token in Requests

Include the access token in the `Authorization` header:

```bash
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

#### Token Refresh

Access tokens expire after 60 minutes. Use the refresh token to get a new access token:

```bash
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "your_refresh_token"
}
```
### 2. Google OAuth (User Login)

Users can log in with their Google account:

```bash
# Get Google OAuth URL
GET /api/auth/google/url/

# Authenticate with code
POST /api/auth/google/authenticate/
Content-Type: application/json

{
  "code": "google_authorization_code"
}
```

## Using Swagger UI

### Step 1: Get Your JWT Token

1. Open Swagger UI at http://localhost:8000/swagger/
2. Find the `POST /api/auth/login/` endpoint
3. Click **"Try it out"**
4. Enter your credentials:
   ```json
   {
     "username": "your_username",
     "password": "your_password"
   }
   ```
5. Click **"Execute"**
6. Copy the `access` token from the response (without quotes)

### Step 2: Authorize Swagger

1. Click the **"Authorize"** button (🔓 icon) at the top right
2. In the popup, find **"Bearer"** authentication
3. Enter your token in this format (including the word "Bearer" and a space):
   ```
   Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
   ```
4. Click **"Authorize"**
5. Click **"Close"**

### Step 3: Test Endpoints

- The 🔓 icon should now show as 🔒
- All requests will automatically include your Bearer token
- You can now test any protected endpoint

**Important Notes:**
- Access tokens expire after **60 minutes**
- Include the word "Bearer" followed by a **space** before your token
- Don't include quotes around the token
- For security, never share your tokens

## API Endpoints Overview

### Authentication Endpoints

- `POST /api/auth/login/` - User login (username/password)
- `POST /api/auth/register/` - User registration
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/auth/google/url/` - Get Google OAuth URL
- `POST /api/auth/google/authenticate/` - Authenticate with Google (web)
- `POST /api/auth/google/mobile/` - Authenticate with Google (mobile)
- `POST /api/auth/password-reset/` - Request password reset OTP
- `POST /api/auth/password-reset/confirm/` - Confirm password reset with OTP
- `POST /api/auth/password-reset/validate/` - Validate password reset code

### Transaction Endpoints

- `GET /api/finance-management/transactions/` - List transactions
- `POST /api/finance-management/transactions/` - Create transaction
- `GET /api/finance-management/transactions/{id}/` - Get transaction
- `PUT /api/finance-management/transactions/{id}/` - Update transaction
- `DELETE /api/finance-management/transactions/{id}/` - Delete transaction
- `POST /api/finance-management/transactions/import/` - Import transactions (CSV)

### Finance Management Endpoints

- `GET /api/finance-management/networth/` - Get net worth
- `GET /api/finance-management/categories/` - List categories
- `GET /api/finance-management/get-places/` - List user's active places (e.g. Bank, Cash, Safe)
- `POST /api/finance-management/move-money/` - Transfer funds between two places
- `POST /api/finance-management/convert-currency/` - Perform currency conversions within a place

### Scheduled Transactions

- `GET /api/finance-management/scheduled-trans/` - List scheduled transactions
- `POST /api/finance-management/scheduled-trans/` - Create scheduled transaction
- `PUT /api/finance-management/scheduled-trans/{id}/` - Update scheduled transaction
- `DELETE /api/finance-management/scheduled-trans/{id}/` - Delete scheduled transaction

### Targets (Savings Goals)

- `GET /api/finance-management/target/` - List targets
- `POST /api/finance-management/target/` - Create target
- `PUT /api/finance-management/target/{id}/` - Update target
- `DELETE /api/finance-management/target/{id}/` - Delete target

### Wishlist

- `GET /api/finance-management/wishlist/` - List wishlist items
- `POST /api/finance-management/wishlist/` - Add wishlist item
- `PUT /api/finance-management/wishlist/{id}/` - Update wishlist item
- `DELETE /api/finance-management/wishlist/{id}/` - Delete wishlist item

### Reports

- `GET /api/finance-management/reports/` - List reports
- `GET /api/finance-management/reports/{id}/` - Get report details

### User Profile

- `GET /api/profile/` - Get user profile
- `PUT /api/profile/update/` - Update user profile
- `POST /api/profile/change-password/` - Change password
- `POST /api/profile/verify-email-change/` - Verify email change
- `POST /api/profile/verify-email-change-otp/` - Verify email change OTP
- `POST /api/profile/request-delete-otp/` - Request account deletion OTP
- `POST /api/profile/delete-account/` - Delete account

## Places & Money Management

Imhotep Finance models your assets by distributing them across different virtual or physical **Places** (e.g., `Bank`, `Cash`, `Safe`). Net Worth values, Transactions, Scheduled Transactions, and Wishlist items are all tied to a specific **Place**.

The backend provides automated services to transfer money between places and perform currency conversions:

### 1. Inter-Place Transfer (`POST /api/finance-management/move-money/`)
This endpoint allows transferring funds from one place to another. 
- **Payload Schema**:
  ```json
  {
    "source_place": "Cash",
    "target_place": "Bank",
    "amount": 500.0,
    "currency": "USD"
  }
  ```
- **Backend Execution**:
  1. Validates that the user has sufficient funds in the source place for the selected currency.
  2. Wraps the operation in a database transaction block (`transaction.atomic()`).
  3. Creates a **Withdraw** transaction from the source place (e.g. `source_place = "Cash"`) with category `"Transfer"` and description `"Transfer to Bank"`.
  4. Creates a corresponding **Deposit** transaction to the target place (e.g. `target_place = "Bank"`) with category `"Transfer"` and description `"Transfer from Cash"`.
  5. The system dynamically updates the Net Worth representation for both locations.

### 2. Intra-Place Currency Conversion (`POST /api/finance-management/convert-currency/`)
This endpoint allows converting funds from one currency to another within a single place.
- **Payload Schema**:
  ```json
  {
    "place": "Bank",
    "source_currency": "USD",
    "target_currency": "EUR",
    "amount": 100.0,
    "target_amount": 92.0
  }
  ```
- **Backend Execution**:
  1. Validates that the user has sufficient funds of the source currency in the specified place.
  2. Wraps the execution in a database transaction block.
  3. Creates a **Withdraw** transaction for the `source_currency` (e.g. `USD`) with category `"Conversion"`.
  4. Creates a **Deposit** transaction for the `target_currency` (e.g. `EUR`) with the converted amount.
  5. Automatically recalculates and updates the place's currency balances.

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "error": "Error message",
  "detail": "Detailed error information"
}
```

### Validation Error

```json
{
  "field_name": ["Error message"],
  "another_field": ["Another error"]
}
```

## Status Codes

- `200 OK` - Successful GET, PUT, PATCH request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

Some endpoints may have rate limiting to prevent abuse. If you encounter `429 Too Many Requests`, wait before retrying.

## Pagination

List endpoints support pagination:

```json
{
  "results": [ ... ],
  "count": 100,
  "next": "http://localhost:8000/api/endpoint/?page=2",
  "previous": null
}
```

## Filtering & Sorting

Many list endpoints support filtering and sorting via query parameters:

```
GET /api/finance-management/transactions/?start_date=2026-01-01&end_date=2026-01-31&category=Food
```

See individual endpoint documentation in Swagger UI for available filters.

## Testing in Swagger

### Best Practices

1. **Always authorize first** - Click "Authorize" and add your Bearer token
2. **Test endpoints in order** - Some endpoints depend on data from others
3. **Check response schemas** - Swagger shows expected request/response formats
4. **Use "Try it out"** - Interactive testing helps understand the API
5. **Review error responses** - Swagger shows all possible error codes

### Common Swagger Operations

- **Try it out**: Click to enable editing and testing
- **Execute**: Send the request and see the response
- **Authorize**: Add authentication tokens
- **Clear**: Reset form fields
- **Copy cURL**: Get the equivalent curl command

## Additional Resources

- [Setup Guide](SETUP.md) - Initial setup and configuration
- [Testing Guide](TESTING.md) - API testing practices

---

**Note**: All endpoints are automatically documented in Swagger UI. For the most up-to-date information, always refer to the interactive documentation at `/swagger/`.
