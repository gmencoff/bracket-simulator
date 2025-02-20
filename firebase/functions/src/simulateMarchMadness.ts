import { onCall } from "firebase-functions/v2/https";
import { getSimulationReferences, MarchMadnessSimulationRequest, SimulateMarchMadnessInput } from "shared";
import { getCollection } from "./utils/GetCollection";
import { SimulationRequestConverter } from "./converters/SimulationRequestConverter";

export const simulateMarchMadness = onCall(async (request) => {

    const auth = request.auth;
    if (auth) {
        // Get the input in the correct format
        const input = SimulateMarchMadnessInput.createFromObject(request.data);

        // Create a simulation request document
        const simulationRequest = new MarchMadnessSimulationRequest(input.numTournaments, 0, Date.now(), input.teams);

        // Write the simulation request to firebase
        const collectionRef = getSimulationReferences(auth.uid);
        const collection = getCollection(collectionRef).withConverter(SimulationRequestConverter);
        await collection.add(simulationRequest);
    }
});