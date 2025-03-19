import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { getCollection, getDocument } from "./utils/GetCollection";
import { CollectionReferenceData, COLLECTIONS, DocumentReferenceData, MarchMadnessSimulation, SimulateBatchInput, SimulationComplete, SimulationRequest, SimulationRequestVisitor, TeamSimulationInfo } from "shared";
import { firestore } from "firebase-admin";
import { SimulationRequestConverter } from "./converters/SimulationRequestConverter";
import { SimulationConverter } from "./converters/SimulationConverter";
import { PubSub } from '@google-cloud/pubsub';
import * as admin from 'firebase-admin';
import { MMOutcomeSimulationRequest, MMOpponentBracketSimulationRequest, MMBracketGeneratorSimulationRequest, TeamSelectionSimulationInfo, MarchMadnessPoolOutcome, getBestBracket } from "shared";

export const batchSimulate = onMessagePublished({ topic: 'simulate-batch', memory: "2GiB", timeoutSeconds: 300}, async (event) => {
    // Get the batch simulate input, break it up into smaller batches and simulate each batch
    const input = SimulateBatchInput.createFromObject(event.data.message.json);

    // Get the request
    const doc = getDocument(input.documentReference).withConverter(SimulationRequestConverter);
    const request = (await doc.get()).data();
    if (!request) {
        throw new Error('Document does not exist');
    }

    // Simulate a reqest batch
    const batchRunner = new BatchSimulationRunner();
    const runAnotherBatch = await request.accept(batchRunner, input.documentReference);
    if (runAnotherBatch) {
        const pubsub = new PubSub();
        const topic = pubsub.topic('simulate-batch');
        topic.publishMessage({ json: input.data() });
    }
});

class BatchSimulationRunner implements SimulationRequestVisitor<Promise<boolean>, DocumentReferenceData> {
    async visitMMOutcomeSimulationRequest(req: MMOutcomeSimulationRequest, simDoc?:  DocumentReferenceData): Promise<boolean> {
        return this.simulateSimpleRequestBatch(req.requestedSimulations, req.completedSimulations, req.teamInfo, simDoc);
    }

    async visitMMOpponentBracketSimulationRequest(req: MMOpponentBracketSimulationRequest, simDoc?:  DocumentReferenceData): Promise<boolean> {
        return this.simulateSimpleRequestBatch(req.requestedSimulations, req.completedSimulations, req.teamInfo, simDoc);
    }

    async visitMMBracketGeneratorSimulationRequest(req: MMBracketGeneratorSimulationRequest, simDoc?: DocumentReferenceData): Promise<boolean> {
        // Publish messages to simulate in smaller batches
        const batchSize = 100;
        let remainingSimulations = req.requestedSimulations - req.completedSimulations;
        const currentBatchSize = Math.min(batchSize, remainingSimulations);

        if (!simDoc) {
            throw new Error('Document Reference is null');
        }

        // Stop if there are no batches left
        if (currentBatchSize <= 0) {
            return false;
        }

        // simulate the tournements in a batch
        await simulateBestBracket(req.teamOddsInfo, req.teamSelectionInfo, currentBatchSize, req.poolSize, simDoc);

        // Update the request progress
        await updateRequestProgress(currentBatchSize,simDoc);
        
        return remainingSimulations > currentBatchSize;
    }

    async simulateSimpleRequestBatch(requestedSimulations: number, completedSimulations: number, teamInfo: TeamSimulationInfo<any>[], simDoc?: DocumentReferenceData): Promise<boolean> {
        // Publish messages to simulate in smaller batches
        const batchSize = 50;
        let remainingSimulations = requestedSimulations - completedSimulations;
        const currentBatchSize = Math.min(batchSize, remainingSimulations);

        if (!simDoc) {
            throw new Error('Document Reference is null');
        }

        // Stop if there are no batches left
        if (currentBatchSize <= 0) {
            return false;
        }

        // simulate the tournements in a batch
        await simulateAllTournaments(teamInfo, currentBatchSize, simDoc);

        // Update the request progress
        await updateRequestProgress(currentBatchSize,simDoc);
        
        return remainingSimulations > currentBatchSize;
    }
}

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
};

const simulateBestBracket = async (teamElo: TeamSelectionSimulationInfo[], teamSelection: TeamSelectionSimulationInfo[], requestedSimulations: number, poolSize: number, simDoc: DocumentReferenceData) => {
    // Get the simulation collection
    const collRef: CollectionReferenceData = {
        collectionId: COLLECTIONS.Simulations,
        documentReference: simDoc
    }

    // Initialize the array of simulation outcomes
    const sims: MarchMadnessPoolOutcome[] = [];

    // Simulate the requested number of tournaments in batches
    const simData = simulateManyTournaments(teamElo,requestedSimulations);

    // For each simulated tournament, simulate a pool of opponent brackets and find the best one
    for (let i = 0; i < requestedSimulations; i++) {
        const csim = simData[i];
        const opponentBrackets = simulateManyTournaments(teamSelection, poolSize);
        const bestBracket = getBestBracket(csim, opponentBrackets);
        sims.push(new MarchMadnessPoolOutcome(csim, bestBracket));
    }

    // For each simulation outcome, find winning brackets

    // TODO: we aren't submitting all sims
    const batch = admin.firestore().batch();
    //simData.forEach((doc) => {  
    const ref = getCollection(collRef).withConverter(SimulationConverter).doc();      
    batch.set(ref, sims[0]);
    //});
    await batch.commit();
};

const simulateManyTournaments = (teamInfo: TeamSimulationInfo<any>[], requestedSimulations: number): MarchMadnessSimulation[] => {
    const sims: MarchMadnessSimulation[] = [];
    const simulator = teamInfo[0].marchMadnessSimulator();
    for (let i = 0; i < requestedSimulations; i++) {
        sims.push(simulator.simulateMarchMadnessTournement(teamInfo));
    }
    return sims
}

const updateRequestProgress = async (completedSimulation: number, simDoc: DocumentReferenceData) => {
    const requestRef = getDocument(simDoc);
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
        if (optionalInput) {
            req.completedSimulations += optionalInput;
        }
        return req;
    }
};