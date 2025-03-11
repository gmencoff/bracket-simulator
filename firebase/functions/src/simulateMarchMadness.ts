import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getSimulationRequests, SimulateBatchInput, simulateMMInputFromData } from "shared";
import { getCollection } from "./utils/GetCollection";
import { SimulationRequestConverter } from "./converters/SimulationRequestConverter";
import { PubSub } from '@google-cloud/pubsub';

export const simulateMarchMadness = onCall(async (request) => {

    // Get the input in the correct format
    const input = simulateMMInputFromData(request.data);

    // Do not let people request more than 10,000 sims
    if (input.numTournaments > 10000) {
        throw new HttpsError("invalid-argument", "Number of tournaments exceeds the limit of 10,000. Please select a lower number.");
    }
    
    // Ensure authentication
    const auth = request.auth;
    if (!auth) {
        throw new HttpsError("unauthenticated", "The request does not have valid authentication credentials.");
    }

    // Create a simulation request document
    const simulationRequest = input.getRequest();

    // Write the simulation request info to firebase
    const collectionRef = getSimulationRequests(auth.uid);
    const collection = getCollection(collectionRef).withConverter(SimulationRequestConverter);
    const doc = await collection.add(simulationRequest);
    const docRef = {
        collectionReference: collectionRef,
        documentId: doc.id
    };

    // Publish a message to simulate the tournaments
    const simulateBatch = new SimulateBatchInput(input, docRef);
    const pubsub = new PubSub();
    const topic = pubsub.topic('simulate-batch');
    topic.publishMessage({json: simulateBatch.data()});
});