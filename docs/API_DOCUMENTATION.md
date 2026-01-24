# 📘 API Documentation (Swagger)

TAConnect automatically generates Swagger/OpenAPI docs for every backend endpoint.

- Interactive Docs: http://localhost:8000/swagger
- Raw Schema: http://localhost:8000/swagger.json

## JWT Authorization in Swagger

**Step-by-step guide:**

1. **Login to get your token:**
   - In Swagger UI, find the `POST /api/auth/login/` endpoint
   - Click "Try it out"
   - Enter your credentials:
     ```json
     {
       "username": "your_username",
       "password": "your_password"
     }
     ```
   - Click "Execute"
   - Copy the `access` token from the response (without quotes)

2. **Authorize Swagger:**
   - Click the **"Authorize"** button (🔓 icon) at the top right of the Swagger page
   - In the popup, enter **exactly** (including the space after "Bearer"):
     ```
     Bearer <paste_your_access_token_here>
     ```
   - Example:
     ```
     Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM...
     ```
   - Click **"Authorize"**
   - Click **"Close"**

3. **Use protected endpoints:**
   - The 🔓 icon should now show as 🔒
   - All requests will automatically include your Bearer token
   - If you get 401 errors, your token may have expired - login again to get a new one

**Important Notes:**
- Access tokens expire after **60 minutes**
- Include the word "Bearer" followed by a **space** before your token
- Don't include quotes around the token
- For security, never share your tokens

**Token Refresh:**
If your access token expires, use the `POST /api/auth/token/refresh/` endpoint with your refresh token to get a new access token without logging in again.

All new endpoints appear in Swagger automatically after commits.

