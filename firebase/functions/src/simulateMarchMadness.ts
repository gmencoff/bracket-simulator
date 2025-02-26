import { onCall } from "firebase-functions/v2/https";
import { CollectionReferenceData, COLLECTIONS, DocumentReferenceData, getSimulationRequests, MarchMadnessSimulationRequest, SimulateBatchInput, SimulateMarchMadnessInput, SimulationRequest, SimulationRequestVisitor } from "shared";
import { getCollection } from "./utils/GetCollection";
import { SimulationRequestConverter } from "./converters/SimulationRequestConverter";
import { firestore } from "firebase-admin";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const simulateBatch = httpsCallable(functions, 'simulateBatch');

export const simulateMarchMadness = onCall(async (request) => {

    const auth = request.auth;
    if (auth) {
        // Get the input in the correct format
        const input = SimulateMarchMadnessInput.createFromObject(request.data);

        // Create a simulation request document
        const simulationRequest = new MarchMadnessSimulationRequest(input.numTournaments, 0, Date.now(), input.teams);

        // Write the simulation request info to firebase
        const collectionRef = getSimulationRequests(auth.uid);
        const collection = getCollection(collectionRef).withConverter(SimulationRequestConverter);
        const doc = await collection.add(simulationRequest);
        const docRef: DocumentReferenceData = {
            collectionReference: collectionRef,
            documentId: doc.id
        };
        const collRef: CollectionReferenceData = {
            collectionId: COLLECTIONS.Simulations,
            documentReference: docRef
        };

        // Simulate the requested number of tournaments in batches
        const batchSize = 1000;
        const promises = [];
        var remainingSimulations = input.numTournaments;
        while (remainingSimulations > 0) {
            const cBatchSize = Math.min(remainingSimulations, batchSize);
            const cSimRequest = new SimulateMarchMadnessInput(input.teams,cBatchSize);
            const cBatchRequest = new SimulateBatchInput(cSimRequest, collRef);
            promises.push(simulateBatch(cBatchRequest.data()));
            remainingSimulations -= batchSize;
        }
        await Promise.all(promises);

        // Mark the request as complete
        await markRequestComplete(doc);
    }
});

const markRequestComplete = async (requestRef: firestore.DocumentReference) => {
    await firestore().runTransaction(async (transaction) => {
        const requestDoc = requestRef.withConverter(SimulationRequestConverter);
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
};