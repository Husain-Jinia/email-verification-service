import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  FirestoreError 
} from 'firebase/firestore';
import { EmailService } from './emailService';

const VERIFICATION_COLLECTION = 'verificationCodes';

interface VerificationCode {
  email: string;
  code: string;
  expiresAt: number;
  isVerified: boolean;
  createdAt: number;
}

interface VerificationStatus {
  isVerified: boolean;
  hasPendingCode: boolean;
  expiresAt: number | null;
}

export class ApiError extends Error {
  constructor(public message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
  }
}

export class VerificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async createVerificationCode(email: string): Promise<string> {
    try {
      console.log(`Generating verification code for email: ${email}`);
      const code = this.generateCode();
      const expiresAt = Date.now() + Number(process.env.VERIFICATION_CODE_EXPIRY || 600000);

      // Delete any existing codes for this email
      await this.deleteExistingCodes(email);
      console.log('Deleted existing codes');

      // Create new verification code
      const verificationRef = doc(collection(db, VERIFICATION_COLLECTION));
      await setDoc(verificationRef, {
        email,
        code,
        expiresAt,
        isVerified: false,
        createdAt: Date.now()
      });
      console.log('Created new verification code');

      // Send verification email
      await this.emailService.sendVerificationCode(email, code);
      console.log('Sent verification email');

      return code;
    } catch (error) {
      console.error('Error in createVerificationCode:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof FirestoreError) {
        throw new ApiError(`Database error: ${error.code}`, 500);
      }
      if (error instanceof Error) {
        throw new ApiError(error.message, 500);
      }
      throw new ApiError('Failed to generate verification code', 500);
    }
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    try {
      console.log(`Verifying code for email: ${email}`);
      const q = query(
        collection(db, VERIFICATION_COLLECTION),
        where('email', '==', email),
        where('code', '==', code)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log('No matching verification code found');
        return false;
      }

      const verificationDoc = querySnapshot.docs[0];
      const verification = verificationDoc.data() as VerificationCode;

      if (verification.expiresAt < Date.now()) {
        console.log('Verification code has expired');
        await this.deleteExistingCodes(email);
        return false;
      }

      // Mark as verified
      await setDoc(verificationDoc.ref, { ...verification, isVerified: true });
      console.log('Code verified successfully');
      return true;
    } catch (error) {
      console.error('Error in verifyCode:', error);
      if (error instanceof FirestoreError) {
        throw new ApiError(`Database error: ${error.code}`, 500);
      }
      if (error instanceof Error) {
        throw new ApiError(error.message, 500);
      }
      throw new ApiError('Failed to verify code', 500);
    }
  }

  async checkVerificationStatus(email: string): Promise<VerificationStatus> {
    try {
      console.log(`Checking verification status for email: ${email}`);
      const q = query(
        collection(db, VERIFICATION_COLLECTION),
        where('email', '==', email)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return {
          isVerified: false,
          hasPendingCode: false,
          expiresAt: null
        };
      }

      const latestCode = querySnapshot.docs
        .map(doc => doc.data() as VerificationCode)
        .sort((a, b) => b.createdAt - a.createdAt)[0];

      return {
        isVerified: latestCode.isVerified,
        hasPendingCode: latestCode.expiresAt > Date.now(),
        expiresAt: latestCode.expiresAt
      };
    } catch (error) {
      console.error('Error in checkVerificationStatus:', error);
      if (error instanceof FirestoreError) {
        throw new ApiError(`Database error: ${error.code}`, 500);
      }
      if (error instanceof Error) {
        throw new ApiError(error.message, 500);
      }
      throw new ApiError('Failed to check verification status', 500);
    }
  }

  private async deleteExistingCodes(email: string): Promise<void> {
    try {
      const q = query(
        collection(db, VERIFICATION_COLLECTION),
        where('email', '==', email)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error in deleteExistingCodes:', error);
      if (error instanceof FirestoreError) {
        throw new ApiError(`Database error: ${error.code}`, 500);
      }
      if (error instanceof Error) {
        throw new ApiError(error.message, 500);
      }
      throw new ApiError('Failed to delete existing codes', 500);
    }
  }
}
