import * as admin from 'firebase-admin';
import { simulateMarchMadness } from './simulateMarchMadness';
import { batchSimulate } from './batchSimulate';

// Initialize Firebase Admin SDK
admin.initializeApp();

// You can export other functions here as well
export { simulateMarchMadness, batchSimulate };