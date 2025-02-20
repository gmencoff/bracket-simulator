import * as admin from 'firebase-admin';
import { simulateMarchMadness } from './simulateMarchMadness';

// Initialize Firebase Admin SDK
admin.initializeApp();

// You can export other functions here as well
export { simulateMarchMadness };