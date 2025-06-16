import { Router, Request, Response } from 'express';
import { VerificationService, ApiError } from '../services/verificationService';

// Define interface for request body types
interface GenerateCodeRequest {
  email: string;
}

interface VerifyCodeRequest {
  email: string;
  code: string;
}

interface StatusCheckRequest {
  email: string;
}

const router = Router();
const verificationService = new VerificationService();

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Code validation regex (6 character alphanumeric)
const CODE_REGEX = /^[A-Z0-9]{6}$/;

// Generate verification code
router.post('/generate', (async (req: Request<{}, any, GenerateCodeRequest>, res: Response) => {
  const startTime = Date.now();
  try {
    console.log('[Generate] Request received:', { email: req.body.email, timestamp: new Date().toISOString() });
    const { email } = req.body;
    
    if (!email || !EMAIL_REGEX.test(email)) {
      console.log('[Generate] Invalid email format:', email);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address' 
      });
    }

    console.log('[Generate] Generating code for email:', email);
    const code = await verificationService.createVerificationCode(email);
    const duration = Date.now() - startTime;
    
    console.log('[Generate] Success:', { email, duration: `${duration}ms` });
    res.json({ 
      success: true, 
      data: { code, email } 
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Generate] Error:', { error, duration: `${duration}ms` });
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate verification code' 
    });
  }
}) as any);

// Verify code
router.post('/verify', (async (req: Request<{}, any, VerifyCodeRequest>, res: Response) => {
  const startTime = Date.now();
  try {
    console.log('[Verify] Request received:', { 
      email: req.body.email, 
      code: req.body.code,
      timestamp: new Date().toISOString() 
    });
    
    const { email, code } = req.body;
    
    if (!email || !EMAIL_REGEX.test(email)) {
      console.log('[Verify] Invalid email format:', email);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address' 
      });
    }

    if (!code || !CODE_REGEX.test(code)) {
      console.log('[Verify] Invalid code format:', code);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid verification code format' 
      });
    }

    console.log('[Verify] Verifying code for email:', email);
    const isValid = await verificationService.verifyCode(email, code);
    const duration = Date.now() - startTime;
    
    if (isValid) {
      console.log('[Verify] Success:', { email, duration: `${duration}ms` });
      res.json({ 
        success: true, 
        data: { 
          email,
          message: 'Email verified successfully' 
        }
      });
    } else {
      console.log('[Verify] Invalid code:', { email, code, duration: `${duration}ms` });
      res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired verification code' 
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Verify] Error:', { error, duration: `${duration}ms` });
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify code' 
    });
  }
}) as any);

// Check verification status
router.post('/status', (async (req: Request<{}, any, StatusCheckRequest>, res: Response) => {
  const startTime = Date.now();
  try {
    console.log('[Status] Request received:', { 
      email: req.body.email,
      timestamp: new Date().toISOString() 
    });
    
    const { email } = req.body;
    
    if (!email || !EMAIL_REGEX.test(email)) {
      console.log('[Status] Invalid email format:', email);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address' 
      });
    }

    console.log('[Status] Checking verification status for email:', email);
    const status = await verificationService.checkVerificationStatus(email);
    const duration = Date.now() - startTime;
    
    console.log('[Status] Success:', { email, status, duration: `${duration}ms` });
    res.json({ 
      success: true, 
      data: { 
        email,
        isVerified: status.isVerified,
        pendingVerification: status.hasPendingCode,
        expiresAt: status.expiresAt
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Status] Error:', { error, duration: `${duration}ms` });
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check verification status' 
    });
  }
}) as any);

export default router;
