# Security Policy

## Supported Versions

Versions that are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 7.0   | :white_check_mark: |
| <= 6.0.0   | :x:   (No longer supported)|

## Reporting a Vulnerability
We appreciate your help in keeping our application secure. If you discover a security vulnerability, please report it responsibly by following these steps:

- Email us directly at imhoteptech@outlook.com.
- Include a detailed description of the vulnerability in your email. This should include steps to reproduce the issue, any relevant code snippets, and the potential impact of the vulnerability.
- We will acknowledge receipt of your report within 1-3 business days. We will then work to investigate the issue and provide you with an update within 2 more days maximum.
- If the vulnerability is confirmed, we will prioritize a fix and aim to release a security patch within 5 business days for supported versions.  We may also choose to disclose the vulnerability publicly after a fix is available.
- We will not disclose your identity without your permission, unless required by law.

## Mobile App Security

### Secure Data Storage
- The mobile app uses **AsyncStorage** for storing authentication tokens and user preferences
- Sensitive data (tokens) should be stored securely using platform-specific secure storage solutions
- Never store unencrypted sensitive information in AsyncStorage

### Deep Linking Security
- The mobile app supports deep linking for email verification (`/verify-email` and `/verify-email-change`)
- Deep links are validated server-side to prevent unauthorized access
- Email verification tokens expire after a set period
- Always verify the authenticity of deep link parameters before processing

### API Security
- All API requests from the mobile app use JWT authentication
- Tokens are included in the `Authorization` header as `Bearer <token>`
- API endpoints validate tokens server-side
- Implement proper token refresh mechanisms to maintain security

### App Store Security
- Production builds should use HTTPS endpoints only
- Ensure `EXPO_PUBLIC_API_URL` points to secure endpoints in production
- Follow platform-specific security guidelines:
  - **iOS**: App Transport Security (ATS) requirements
  - **Android**: Network security configuration

### Best Practices for Mobile Users
- Keep the app updated to the latest version
- Use strong passwords and enable biometric authentication when available
- Be cautious of phishing attempts via deep links
- Only download the app from official app stores

## Additional Notes:

- We do not offer bounties for vulnerability reports.
- We reserve the right to close reports that are not reported responsibly or do not provide sufficient information.
