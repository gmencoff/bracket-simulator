import * as admin from 'firebase-admin';
import { simulateMarchMadness } from './simulateMarchMadness';
import { simulationRequested } from './simulationRequested';

// Initialize Firebase Admin SDK
admin.initializeApp();

// You can export other functions here as well
export { simulationRequested, simulateMarchMadness };