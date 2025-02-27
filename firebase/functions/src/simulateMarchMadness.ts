import { onCall } from "firebase-functions/v2/https";
import { getSimulationRequests, MarchMadnessSimulationRequest, SimulateMarchMadnessInput, SimulateBatchInput } from "shared";
import { getCollection } from "./utils/GetCollection";
import { SimulationRequestConverter } from "./converters/SimulationRequestConverter";
import { PubSub } from '@google-cloud/pubsub';

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
        const docRef = {
            collectionReference: collectionRef,
            documentId: doc.id
        };

        // Publish a message to simulate the tournaments
        const simulateBatch = new SimulateBatchInput(input, docRef);
        const pubsub = new PubSub();
        const topic = pubsub.topic('simulate-batch');
        topic.publishMessage({json: simulateBatch.data()});
    }
});