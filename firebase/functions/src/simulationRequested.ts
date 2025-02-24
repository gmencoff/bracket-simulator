import { onDocumentCreated } from 'firebase-functions/firestore';
import { CollectionReferenceData, COLLECTIONS, DocumentReferenceData, getSimulationRequests, MarchMadnessSimulationRequest, simulateMarchMadness, SimulationRequest, SimulationRequestVisitor } from 'shared';
import { SimulationRequestConverter } from './converters/SimulationRequestConverter';
import { getCollection, getDocument } from './utils/GetCollection';
import { SimulationConverter } from './converters/SimulationConverter';
import { firestore } from 'firebase-admin';

interface EventParams {
    userId: string;
    docId: string;
}

export const simulationRequested = onDocumentCreated(`${COLLECTIONS.SimulationRequests}/{userId}/${COLLECTIONS.SimulationRequests}/{docId}`, async (event) => {
    // When a new simulation request is created, handle it
    if (event.data) {
        const { userId, docId } = event.params as EventParams;
        const requestCollection = getSimulationRequests(userId);
        const requestRef: DocumentReferenceData = {
            collectionReference: requestCollection,
            documentId: docId
        };
        const request = SimulationRequestConverter.fromFirestore(event.data);
        const visitor = new SimulationRequestPerformer();
        await request.accept(visitor, requestRef);
    }
});

class SimulationRequestPerformer implements SimulationRequestVisitor<Promise<null>, DocumentReferenceData> {
    async visitMarchMadnessSimRequest(req: MarchMadnessSimulationRequest, requestRef?: DocumentReferenceData): Promise<null> {
        const numTournaments = req.requestedSimulations - req.completedSimulations;

        if (requestRef) {
            await Promise.all(Array.from({ length: numTournaments }, () => simulateTournament(req, requestRef)));
            await markRequestComplete(requestRef);
        }
        return null;
    }
}

const simulateTournament = async (request: MarchMadnessSimulationRequest, requestRef: DocumentReferenceData) => {
    const simCollection: CollectionReferenceData = {
        collectionId: COLLECTIONS.Simulations,
        documentReference: requestRef
    }
    const collection = getCollection(simCollection);
    
    // Simulate and add to the database
    const sim = simulateMarchMadness(request.teamInfo);
    await collection.withConverter(SimulationConverter).add(sim)
};

const markRequestComplete = async (requestRef: DocumentReferenceData) => {
    await firestore().runTransaction(async (transaction)  => {
        const requestDoc = getDocument(requestRef).withConverter(SimulationRequestConverter);
        const doc = (await transaction.get(requestDoc)).data();
        if (!doc) {
            throw new Error('Document does not exist');
        }
        const requestIncrementor = new RequestCompletionMarker();
        const newDoc = doc.accept(requestIncrementor);
        transaction.update(requestDoc, SimulationRequestConverter.toFirestore(newDoc));
    });
};

class RequestCompletionMarker implements SimulationRequestVisitor<SimulationRequest, null> {
    visitMarchMadnessSimRequest(req: MarchMadnessSimulationRequest, optionalInput?: null): MarchMadnessSimulationRequest {
        req.completedSimulations = req.requestedSimulations;
        return req;
    }
}