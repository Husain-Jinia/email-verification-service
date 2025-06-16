# Email Verification Service

A robust email verification service built with Node.js, TypeScript, Express, and Firebase. This service provides secure email verification functionality with rate limiting and automatic cleanup of expired codes.

## Features

- 🔒 Secure email verification code generation
- 📧 Email notifications using Gmail SMTP
- ⏱️ Rate limiting to prevent abuse
- 🧹 Automatic cleanup of expired codes
- 🔥 Firebase integration for data storage
- 📝 TypeScript for type safety
- 🚀 Ready for Vercel deployment

## Prerequisites

- Node.js v18 or higher
- Gmail account with 2-Step Verification enabled
- Firebase project
- Vercel account (for deployment)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd email-verify
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

## Configurations

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Add the following to your `.env` file:
```properties
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### Gmail Setup

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to Google Account Settings → Security
   - Under "2-Step Verification" → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password
3. Add to `.env`:
```properties
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

## API Endpoints

### Generate Verification Code
```http
POST /api/verification/generate
Content-Type: application/json

{
    "email": "user@example.com"
}
```

Response:
```json
{
    "success": true,
    "data": {
        "code": "ABC123",
        "email": "user@example.com"
    }
}
```

### Verify Code
```http
POST /api/verification/verify
Content-Type: application/json

{
    "email": "user@example.com",
    "code": "ABC123"
}
```

Response:
```json
{
    "success": true,
    "data": {
        "email": "user@example.com",
        "message": "Email verified successfully"
    }
}
```

### Check Verification Status
```http
POST /api/verification/status
Content-Type: application/json

{
    "email": "user@example.com"
}
```

Response:
```json
{
    "success": true,
    "data": {
        "email": "user@example.com",
        "isVerified": true,
        "pendingVerification": false,
        "expiresAt": 1623580000000
    }
}
```

## Development

Start the development server:
```bash
npm run dev
```

Build the project:
```bash
npm run build
```

Clean and build:
```bash
npm run build:clean
```

## Deployment to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel Dashboard:
   - Project Settings → Environment Variables
   - Add all variables from `.env`
   - Ensure all Firebase and SMTP configurations are properly set

## Security Features

### Rate Limiting
- Maximum 5 verification requests per email per hour
- Includes retry-after header in rate limit responses
- Configurable through middleware settings

### Code Expiration
- Verification codes expire after 10 minutes
- Automatic cleanup of expired codes every 15 minutes
- Configurable expiration time through environment variables

### Email Security
- Uses Gmail SMTP with App Password authentication
- TLS encryption for email transmission
- HTML email templates with security recommendations

## Error Handling

The service provides detailed error responses for:
```typescript
{
    "success": false,
    "error": "Error message",
    "retryAfter?: number // for rate limiting
}
```

Common error scenarios:
- Invalid email format
- Invalid verification code
- Rate limit exceeded
- Expired verification code
- Email sending failures
- Firebase connection issues

## Type Definitions

```typescript
interface VerificationCode {
    email: string;
    code: string;
    createdAt: number;
    expiresAt: number;
    verified: boolean;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    retryAfter?: number;
}
```

## Project Structure

```
email-verify/
├── src/
│   ├── config/
│   │   ├── firebase.ts        # Firebase configuration
│   │   └── cleanup.ts         # Cleanup routines
│   ├── middleware/
│   │   ├── errorHandler.ts    # Global error handling
│   │   └── rateLimiter.ts     # Rate limiting
│   ├── services/
│   │   ├── emailService.ts    # Email sending logic
│   │   └── verificationService.ts # Verification logic
│   ├── routes/
│   │   └── verificationRoutes.ts # API routes
│   ├── types/
│   │   └── environment.d.ts   # Type definitions
│   └── app.ts                 # Main application
├── .env                       # Environment variables
├── package.json              # Project dependencies
├── tsconfig.json            # TypeScript configuration
└── vercel.json             # Vercel deployment config
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, please create an issue in the repository or contact the maintainers.
