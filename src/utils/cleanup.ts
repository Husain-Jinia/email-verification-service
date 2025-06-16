import { db } from '../config/firebase';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

const VERIFICATION_COLLECTION = 'verificationCodes';

export async function cleanupExpiredCodes(): Promise<number> {
  try {
    const now = Date.now();
    const q = query(
      collection(db, VERIFICATION_COLLECTION),
      where('expiresAt', '<', now)
    );

    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    const count = deletePromises.length;
    console.log(`Cleaned up ${count} expired verification codes`);
    return count;
  } catch (error) {
    console.error('Error cleaning up expired codes:', error);
    return 0;
  }
}
