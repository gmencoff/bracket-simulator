import * as admin from 'firebase-admin';
import { simulateMarchMadness } from './simulateMarchMadness';
import { simulateBatch } from './simulationRequested';

// Initialize Firebase Admin SDK
admin.initializeApp();

// You can export other functions here as well
export { simulateBatch, simulateMarchMadness };