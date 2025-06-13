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

const router = Router();
const verificationService = new VerificationService();

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Code validation regex (6 character alphanumeric)
const CODE_REGEX = /^[A-Z0-9]{6}$/;

// Generate verification code
router.post('/generate', (async (req: Request<{}, any, GenerateCodeRequest>, res: Response) => {
  try {
    console.log('Received generate code request');
    const { email } = req.body;
    
    if (!email || !EMAIL_REGEX.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address' 
      });
    }

    const code = await verificationService.createVerificationCode(email);
    console.log('Code generated successfully');
    res.json({ 
      success: true, 
      data: { code, email } 
    });
  } catch (error) {
    console.error('Error in generate endpoint:', error);
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
  try {
    console.log('Received verify code request');
    const { email, code } = req.body;
    
    if (!email || !EMAIL_REGEX.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address' 
      });
    }

    if (!code || !CODE_REGEX.test(code)) {
      console.log('Invalid code format:', code);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid verification code format' 
      });
    }

    const isValid = await verificationService.verifyCode(email, code);
    
    if (isValid) {
      console.log('Code verified successfully');
      res.json({ 
        success: true, 
        data: { 
          email,
          message: 'Email verified successfully' 
        }
      });
    } else {
      console.log('Invalid or expired code');
      res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired verification code' 
      });
    }
  } catch (error) {
    console.error('Error in verify endpoint:', error);
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

export default router;
