import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { getCollection, getDocument } from "./utils/GetCollection";
import { CollectionReferenceData, COLLECTIONS, DocumentReferenceData, MarchMadnessSimulation, SimulateBatchInput, simulateMarchMadnessTournement, SimulationComplete, SimulationRequest, SimulationRequestVisitor, TeamSimulationInfo } from "shared";
import { firestore } from "firebase-admin";
import { SimulationRequestConverter } from "./converters/SimulationRequestConverter";
import { SimulationConverter } from "./converters/SimulationConverter";
import { PubSub } from '@google-cloud/pubsub';
import * as admin from 'firebase-admin';
import { MMOutcomeSimulationRequest, MMOpponentBracketSimulationRequest, MMBracketGeneratorSimulationRequest } from "shared/dist/datamodel/SimulationRequest";

export const batchSimulate = onMessagePublished({ topic: 'simulate-batch', memory: "2GiB", timeoutSeconds: 300}, async (event) => {
    // Get the batch simulate input, break it up into smaller batches and simulate each batch
    const input = SimulateBatchInput.createFromObject(event.data.message.json);

    // Publish messages to simulate in smaller batches
    const batchSize = 100;
    let remainingSimulations = input.requestedSimulations;
    const currentBatchSize = Math.min(batchSize, remainingSimulations);

    // Stop if there are no batches left
    if (currentBatchSize <= 0) {
        return
    }

    // simulat the tournements in a batch
    await simulateAllTournaments(input.teamInfo, currentBatchSize, input.documentReference);

    // call function again with new remaining sims
    input.requestedSimulations = input.requestedSimulations - currentBatchSize;
    const pubsub = new PubSub();
    const topic = pubsub.topic('simulate-batch');
    topic.publishMessage({ json: input.data() });
});

const simulateAllTournaments = async (teamInfo: TeamSimulationInfo<any>[], requestedSimulations: number, simDoc: DocumentReferenceData) => {
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

const simulateManyTournaments = (teamInfo: TeamSimulationInfo<any>[], requestedSimulations: number): MarchMadnessSimulation[] => {
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
    visitMMOutcomeSimulationRequest(req: MMOutcomeSimulationRequest, optionalInput?: number | undefined): SimulationRequest {
        if (optionalInput) {
            req.completedSimulations += optionalInput;
        }
        return req;
    }

    visitMMOpponentBracketSimulationRequest(req: MMOpponentBracketSimulationRequest, optionalInput?: number | undefined): SimulationRequest {
        if (optionalInput) {
            req.completedSimulations += optionalInput;
        }
        return req;
    }

    visitMMBracketGeneratorSimulationRequest(req: MMBracketGeneratorSimulationRequest, optionalInput?: number | undefined): SimulationRequest {
        // TODO: implement
        return req;
    }
};