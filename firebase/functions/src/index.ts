import * as admin from 'firebase-admin';
import { simulateMarchMadness } from './simulateMarchMadness';
import { batchSimulate, simulateBatchGroup } from './batchSimulate';
import { simulationComplete } from './simulationComplete';

// Initialize Firebase Admin SDK
admin.initializeApp();

// You can export other functions here as well
export { simulateMarchMadness, batchSimulate, simulateBatchGroup, simulationComplete };