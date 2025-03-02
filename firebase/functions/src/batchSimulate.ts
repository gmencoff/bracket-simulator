import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { getCollection, getDocument } from "./utils/GetCollection";
import { CollectionReferenceData, COLLECTIONS, DocumentReferenceData, MarchMadnessSimulation, MarchMadnessSimulationRequest, SimulateBatchInput, SimulateMarchMadnessInput, simulateMarchMadnessTournement, SimulationComplete, SimulationRequest, SimulationRequestVisitor, TeamSimulationInfo } from "shared";
import { firestore } from "firebase-admin";
import { SimulationRequestConverter } from "./converters/SimulationRequestConverter";
import { SimulationConverter } from "./converters/SimulationConverter";
import { PubSub } from '@google-cloud/pubsub';
import * as admin from 'firebase-admin';

export const batchSimulate = onMessagePublished('simulate-batch', async (event) => {
    // Get the batch simulate input, break it up into smaller batches and simulate each batch
    const input = SimulateBatchInput.createFromObject(event.data.message.json);

    // Publish messages to simulate in smaller batches
    const pubsub = new PubSub();
    const topic = pubsub.topic('simulate-batch-group');
    const batchSize = 100;
    let remainingSimulations = input.specification.numTournaments;
    while (remainingSimulations > 0) {
        const currentBatchSize = Math.min(batchSize, remainingSimulations);
        const simspec = new SimulateMarchMadnessInput(input.specification.teams, currentBatchSize);
        const batchInput = new SimulateBatchInput(simspec, input.documentReference);
        topic.publishMessage({ json: batchInput.data() });
        remainingSimulations -= currentBatchSize;
    }
});

export const simulateBatchGroup = onMessagePublished('simulate-batch-group', async (event) => {
    // Simulate the batch group
    const input = SimulateBatchInput.createFromObject(event.data.message.json);

    // Simulate the requested number of tournaments
    await simulateAllTournaments(input.specification.teams, input.specification.numTournaments, input.documentReference);
});


const simulateAllTournaments = async (teamInfo: TeamSimulationInfo[], requestedSimulations: number, simDoc: DocumentReferenceData) => {
    // Get the simulation collection
    const collRef: CollectionReferenceData = {
        collectionId: COLLECTIONS.Simulations,
        documentReference: simDoc
    }

    // Simulate the requested number of tournaments in batches
    const simData = simulateManyTournaments(teamInfo, requestedSimulations);
    const batch = admin.firestore().batch();
    simData.forEach((doc) => {  
        const ref = getCollection(collRef).withConverter(SimulationConverter).doc();      
        batch.set(ref, doc);
    });
    await batch.commit();

    // Mark the request as complete
    const doc = getDocument(simDoc);
    await updateRequestProgress(doc,requestedSimulations,simDoc);
};

const simulateManyTournaments = (teamInfo: TeamSimulationInfo[], requestedSimulations: number): MarchMadnessSimulation[] => {
    const sims: MarchMadnessSimulation[] = [];
    for (let i = 0; i < requestedSimulations; i++) {
        sims.push(simulateMarchMadnessTournement(teamInfo));
    }
    return sims
}

const updateRequestProgress = async (requestRef: firestore.DocumentReference, completedSimulation: number, simDoc: DocumentReferenceData) => {
    await firestore().runTransaction(async (transaction) => {
        const requestDoc = requestRef.withConverter(SimulationRequestConverter);
        const doc = (await transaction.get(requestDoc)).data();
        if (!doc) {
            throw new Error('Document does not exist');
        }
        const requestIncrementor = new RequestProgressUpdater();
        const newDoc = doc.accept(requestIncrementor,completedSimulation);
        transaction.update(requestDoc, SimulationRequestConverter.toFirestore(newDoc));
        if (newDoc.isComplete()) {
            const pubsub = new PubSub();
            const topic = pubsub.topic('simulation-complete');
            const simComplete = new SimulationComplete(simDoc);
            topic.publishMessage({ json: simComplete.data() });
        }
    });
};

class RequestProgressUpdater implements SimulationRequestVisitor<SimulationRequest, number> {
    visitMarchMadnessSimRequest(req: MarchMadnessSimulationRequest, optionalInput?: number): MarchMadnessSimulationRequest {
        if (optionalInput) {
            req.completedSimulations += optionalInput;
        }
        return req;
    }
};