# OAuth2 Public API Documentation

Complete documentation for the Imhotep Finance OAuth2 Public API, enabling third-party developers to securely integrate with the platform.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [OAuth2 Flow](#oauth2-flow)
5. [API Endpoints](#api-endpoints)
6. [Testing Guide](#testing-guide)
7. [Swagger Integration](#swagger-integration)
8. [Troubleshooting](#troubleshooting)
9. [Security](#security)

---

## Overview

The Imhotep Finance Public API allows third-party applications to securely manage user transactions on behalf of users through OAuth2 authentication. This enables developers to build integrations like:

- Todo apps that automatically create transactions when tasks are completed
- Budgeting tools that sync with Imhotep Finance
- Automation scripts for recurring transactions
- Financial analysis tools

### Key Features

- ✅ **OAuth2 Authorization Code Flow** (RFC 6749 compliant)
- ✅ **Scope-based permissions** for granular access control
- ✅ **Developer Portal** for easy application management
- ✅ **Comprehensive API documentation** via Swagger UI
- ✅ **Secure token management** with automatic expiration
- ✅ **User data isolation** (apps can only access their own user's data)

---

## Architecture

### Technology Stack

- **OAuth2 Provider**: `django-oauth-toolkit` (v1.7.1+)
- **API Framework**: Django REST Framework
- **Documentation**: drf-spectacular (Swagger UI)
- **Authentication**: OAuth2 + JWT (for developer portal)

### Application Structure

```
backend/imhotep_finance/
├── developer_portal/          # Developer application management
│   ├── models.py              # DeveloperProfile model
│   ├── apis.py                # Developer portal APIs
│   ├── services.py            # Business logic
│   └── urls.py
├── public_api/                # Public API endpoints
│   ├── apis.py                # Transaction APIs
│   ├── permissions.py         # OAuth2 scope validation
│   └── urls.py
└── oauth2_provider/           # django-oauth-toolkit
```

### OAuth2 Scopes

| Scope | Description |
|-------|-------------|
| `read` | Read access to financial data |
| `write` | Write access to create/delete transactions |
| `transactions:read` | Read transaction data |
| `transactions:write` | Create and delete transactions |

---

## Getting Started

### Step 1: Register Your Application

#### Via Developer Portal (Recommended)

1. Log in to your Imhotep Finance account
2. Navigate to **Developer Portal** (`/developer`)
3. Click **"+ Create New Application"**
4. Fill in the form:
   - **Name**: Your application name
   - **Client Type**: `Confidential` (for server-side apps)
   - **Authorization Grant Type**: `Authorization Code` (recommended)
   - **Redirect URIs**: Your application's callback URL (e.g., `http://localhost:3000/oauth/callback`)
5. Click **"Create Application"**
6. **IMPORTANT**: Copy and save both **Client ID** and **Client Secret** - the secret is shown only once!

#### Via API

```bash
# First, get your JWT token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'

# Create application
curl -X POST http://localhost:8000/api/developer/apps/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Todo App",
    "client_type": "confidential",
    "authorization_grant_type": "authorization-code",
    "redirect_uris": "http://localhost:3000/oauth/callback"
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "My Todo App",
  "client_id": "abc123xyz...",
  "client_secret": "def456uvw...",
  "client_type": "confidential",
  "authorization_grant_type": "authorization-code",
  "redirect_uris": "http://localhost:3000/oauth/callback",
  "message": "Application created successfully"
}
```

---

## OAuth2 Flow

### Complete Authorization Flow

```
1. Developer registers app → Gets Client ID & Secret
2. User visits third-party app
3. App redirects to: /o/authorize/?client_id=XXX&redirect_uri=YYY&scope=transactions:write
4. User logs in (if not already) and grants permissions
5. User redirected back to app with authorization code
6. App exchanges code for access token: POST /o/token/
7. App uses access token in Authorization header: Bearer {token}
8. App can now make API calls to /api/v1/external/transaction/
```

### Step-by-Step Implementation

#### Step 1: Redirect User to Authorization

Construct the authorization URL:

```
http://localhost:8000/o/authorize/?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  scope=transactions:write
```

**Parameters:**
- `response_type`: Must be `code` for Authorization Code flow
- `client_id`: Your application's Client ID
- `redirect_uri`: Must exactly match one of your registered redirect URIs
- `scope`: Requested permissions (e.g., `transactions:write`, `transactions:read`, or both separated by spaces)

**Example:**
```
http://localhost:8000/o/authorize/?response_type=code&client_id=abc123xyz&redirect_uri=http://localhost:3000/oauth/callback&scope=transactions:write
```

#### Step 2: User Grants Permission

1. User is redirected to the authorization page
2. If not logged in, user will be prompted to log in
3. User sees what permissions are being requested
4. User clicks **"Authorize"**
5. User is redirected back to your `redirect_uri` with an authorization code:

```
http://localhost:3000/oauth/callback?code=AUTHORIZATION_CODE&state=STATE
```

**Note**: Authorization codes are single-use and expire in 10 minutes.

#### Step 3: Exchange Code for Access Token

Exchange the authorization code for an access token:

```bash
curl -X POST http://localhost:8000/o/token/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=YOUR_REDIRECT_URI&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "abc123...",
  "scope": "transactions:write"
}
```

**Save the `access_token`** - you'll use it for API calls!

#### Step 4: Use Access Token in API Calls

Include the access token in the `Authorization` header:

```bash
curl -X POST http://localhost:8000/api/v1/external/transaction/add/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "100.50",
    "currency": "USD",
    "trans_status": "deposit",
    "category": "Salary",
    "trans_details": "Payment from Todo App"
  }'
```

---

## API Endpoints

### Developer Portal APIs

#### Create Application
- **Endpoint**: `POST /api/developer/apps/`
- **Auth**: JWT Bearer token
- **Description**: Register a new OAuth2 application

#### List Applications
- **Endpoint**: `GET /api/developer/apps/`
- **Auth**: JWT Bearer token
- **Description**: List all applications for the authenticated developer

#### Get Application
- **Endpoint**: `GET /api/developer/apps/{id}/`
- **Auth**: JWT Bearer token
- **Description**: Get details of a specific application

#### Delete Application
- **Endpoint**: `DELETE /api/developer/apps/{id}/`
- **Auth**: JWT Bearer token
- **Description**: Delete an application

#### Regenerate Client Secret
- **Endpoint**: `POST /api/developer/apps/{id}/regenerate-secret/`
- **Auth**: JWT Bearer token
- **Description**: Generate a new client secret for an application

#### Add Swagger Redirect URI
- **Endpoint**: `POST /api/developer/apps/{id}/add-swagger-uri/`
- **Auth**: JWT Bearer token
- **Description**: Add Swagger UI redirect URI to an existing application

### OAuth2 Provider Endpoints

#### Authorization Endpoint
- **Endpoint**: `GET /o/authorize/`
- **Auth**: User session (redirects to login if not authenticated)
- **Description**: User authorization page

#### Token Exchange Endpoint
- **Endpoint**: `POST /o/token/`
- **Auth**: Client credentials (client_id + client_secret)
- **Description**: Exchange authorization code for access token

#### Revoke Token
- **Endpoint**: `POST /o/revoke_token/`
- **Auth**: Client credentials
- **Description**: Revoke an access token

### Public API Endpoints

#### Create Transaction
- **Endpoint**: `POST /api/v1/external/transaction/add/`
- **Auth**: OAuth2 Bearer token with `transactions:write` scope
- **Description**: Create a new transaction on behalf of the user

**Request Body:**
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

**Response:**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "transaction_id": 123,
  "date": "2026-01-25",
  "amount": "100.50",
  "currency": "USD",
  "trans_status": "deposit"
}
```

#### List Transactions
- **Endpoint**: `GET /api/v1/external/transaction/list/`
- **Auth**: OAuth2 Bearer token with `transactions:read` scope
- **Description**: List transactions for the authenticated user

**Query Parameters:**
- `start_date` (optional): Start date for filtering (YYYY-MM-DD)
- `end_date` (optional): End date for filtering (YYYY-MM-DD)
- `category` (optional): Filter by category
- `trans_status` (optional): Filter by transaction type (deposit/withdraw)
- `page` (optional): Page number for pagination (default: 1)

**Response:**
```json
{
  "transactions": [
    {
      "id": 123,
      "date": "2026-01-25",
      "amount": "100.50",
      "currency": "USD",
      "trans_status": "deposit",
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

#### Delete Transaction
- **Endpoint**: `DELETE /api/v1/external/transaction/delete/{id}/`
- **Auth**: OAuth2 Bearer token with `transactions:write` scope
- **Description**: Delete a transaction on behalf of the user

**Response:**
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

---

## Testing Guide

### Quick Test Script

Use the provided test scripts:

1. **`test_oauth2_flow.sh`** - Complete OAuth2 flow test
2. **`test_external_app_integration.sh`** - External app integration simulation

### Manual Testing Steps

1. **Create OAuth2 Application**
   - Via Developer Portal or API
   - Save Client ID and Secret

2. **Get Authorization Code**
   - Open authorization URL in browser
   - Log in and authorize
   - Copy authorization code from redirect URL

3. **Exchange Code for Token**
   - Use `POST /o/token/` endpoint
   - Save access token

4. **Test API Endpoints**
   - Create transaction
   - List transactions
   - Delete transaction

### Testing Checklist

- [ ] Application registration works
- [ ] OAuth2 authorization flow works
- [ ] Token exchange works
- [ ] Transaction creation works
- [ ] Transaction listing works
- [ ] Transaction deletion works
- [ ] Error handling works (invalid token, missing scope, etc.)

---

## Swagger Integration

### Using Swagger UI

Swagger UI is available at `/swagger/` for interactive API testing.

#### Method 1: Bearer Token Authentication (Recommended)

1. Get an OAuth2 access token (see [OAuth2 Flow](#oauth2-flow))
2. In Swagger UI, click **"Authorize"** button
3. Select **"Bearer"** (not OAuth2)
4. Paste your access token
5. Click **"Authorize"**
6. Test API endpoints

#### Method 2: OAuth2 Flow in Swagger

1. Ensure your application has Swagger redirect URI registered:
   - `http://127.0.0.1:8000/swagger/oauth2-redirect.html`
   - Or use the "Add Swagger URI" button in Developer Portal

2. In Swagger UI, click **"Authorize"**
3. Select **"OAuth2"**
4. Enter your Client ID and Client Secret
5. Click **"Authorize"**
6. Complete the authorization flow
7. Swagger will automatically exchange the code for a token

### Understanding Authorization Code vs Access Token

**Important**: The authorization code is NOT the same as an access token!

| Item | Description | Lifetime | Usage |
|------|-------------|----------|-------|
| **Authorization Code** | Temporary code after authorization | 10 minutes | Exchange for access token |
| **Access Token** | Token for API authentication | 1 hour | Use in `Authorization: Bearer <token>` header |

### Common Swagger Issues

#### Issue: "Mismatching redirect URI"
**Solution**: Ensure your application has the Swagger redirect URI registered. Use the "Add Swagger URI" button in Developer Portal.

#### Issue: Redirects to frontend instead of authorization page
**Solution**: This is expected behavior. The authorization page redirects unauthenticated users to login. After login, you'll be redirected back to complete authorization.

#### Issue: "window.opener is null" error
**Solution**: Use Bearer token authentication instead of Swagger's OAuth2 flow, or use the redirect page form to exchange the code for a token.

---

## Troubleshooting

### Common Errors

#### "Invalid redirect_uri"
- **Cause**: The redirect_uri in the authorization request doesn't match registered URIs
- **Solution**: Ensure the redirect_uri exactly matches one of your registered URIs (including protocol, domain, port, and path)

#### "Invalid authorization code"
- **Cause**: Code expired (10 minutes) or already used
- **Solution**: Get a new authorization code

#### "Token does not have required scope"
- **Cause**: Token doesn't have the required scope (e.g., `transactions:write`)
- **Solution**: Request the correct scope in the authorization URL

#### "401 Unauthorized"
- **Cause**: Invalid or expired access token
- **Solution**: Get a new access token

#### "404 Transaction not found"
- **Cause**: Transaction doesn't exist or belongs to a different user
- **Solution**: Verify the transaction ID and ensure it belongs to the user associated with the token

### Debugging Tips

1. **Check token expiration**: Access tokens expire after 1 hour
2. **Verify scopes**: Ensure your token has the required scopes
3. **Check redirect URIs**: Must match exactly (including trailing slashes)
4. **Review backend logs**: Check Django logs for detailed error messages
5. **Use Swagger UI**: Interactive testing helps identify issues quickly

---

## Security

### Security Features

- ✅ **OAuth2 Authorization Code Flow** (RFC 6749 compliant)
- ✅ **Scope-based permissions** for granular access control
- ✅ **Token expiration** (1 hour default for access tokens)
- ✅ **User data isolation** (apps can only access their own user's data)
- ✅ **HTTPS required** in production
- ✅ **Secure token storage** (tokens are hashed in database)

### Best Practices

1. **Store Client Secret Securely**
   - Never expose in client-side code
   - Use environment variables
   - Rotate secrets regularly

2. **Use HTTPS in Production**
   - All OAuth2 endpoints must use HTTPS
   - Redirect URIs must use HTTPS

3. **Request Minimal Scopes**
   - Only request scopes your app actually needs
   - Users can see what permissions you're requesting

4. **Handle Token Expiration**
   - Implement token refresh logic
   - Handle 401 errors gracefully
   - Re-authenticate when needed

5. **Validate Redirect URIs**
   - Only use registered redirect URIs
   - Never allow open redirects

### Production Checklist

- [ ] All endpoints use HTTPS
- [ ] Client secrets stored securely
- [ ] Redirect URIs validated
- [ ] Rate limiting implemented (future enhancement)
- [ ] Error messages don't leak sensitive information
- [ ] CORS configured properly
- [ ] Token expiration handled
- [ ] Security headers configured

---

## Implementation Status

### ✅ Completed Features

- [x] OAuth2 provider setup
- [x] Developer Portal backend
- [x] Public API endpoints (Create, Read, Delete transactions)
- [x] Frontend Developer Portal
- [x] Swagger UI integration
- [x] Comprehensive documentation
- [x] Test scripts and guides

### 🚀 Ready for Production

The OAuth2 Public API is fully functional and ready for external app integration. All core features have been implemented, tested, and documented.

### 🔮 Future Enhancements

- [ ] Rate limiting per application
- [ ] Usage statistics and analytics
- [ ] PKCE support for public clients (mobile apps)
- [ ] Personal Access Tokens (PATs) for power users
- [ ] Webhook support for transaction events
- [ ] API versioning strategy

---

## Support & Resources

- **API Documentation**: `/swagger/` - Interactive Swagger UI
- **Developer Portal**: `/developer` - Application management
- **OAuth Test Page**: `/developer/oauth-test` - Step-by-step testing
- **GitHub Repository**: [Imhotep Finance](https://github.com/Imhotep-Tech/imhotep_finance)

For issues or questions, please check the troubleshooting section or review the API documentation in Swagger UI.

---

**Last Updated**: January 2026  
**API Version**: 1.0.0  
**Status**: ✅ Production Ready
