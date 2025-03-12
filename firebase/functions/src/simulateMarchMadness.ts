import { onCall, HttpsError } from "firebase-functions/v2/https";
import { DocumentReferenceData, getSimulationRequests, MMOpponentBracketSimulationRequest, MMOutcomeSimulationRequest, SimulateBatchInput, SimulateMarchMadnessInput, SimulationRequestVisitor, TeamSimulationInfo } from "shared";
import { getCollection } from "./utils/GetCollection";
import { SimulationRequestConverter } from "./converters/SimulationRequestConverter";
import { PubSub } from '@google-cloud/pubsub';

export const simulateMarchMadness = onCall(async (request) => {

    // Ensure authentication
    const auth = request.auth;
    if (!auth) {
        throw new HttpsError("unauthenticated", "The request does not have valid authentication credentials.");
    }

    // Get the input in the correct format
    const input = SimulateMarchMadnessInput.createFromObject(request.data);

    // Validate the request
    const validator = new RequestValidationVisitor();
    input.request.accept(validator);

    // Create a simulation request document
    const simulationRequest = input.request;

    // Write the simulation request info to firebase
    const collectionRef = getSimulationRequests(auth.uid);
    const collection = getCollection(collectionRef).withConverter(SimulationRequestConverter);
    const doc = await collection.add(simulationRequest);
    const docRef: DocumentReferenceData = {
        collectionReference: collectionRef,
        documentId: doc.id
    };

    // Perform simulation actions
    const simulationAction = new SimulationActionVisitor();
    simulationRequest.accept(simulationAction, docRef);
});

class RequestValidationVisitor implements SimulationRequestVisitor<void,null> {
    
    visitMMOutcomeSimulationRequest(req: MMOutcomeSimulationRequest): void {
        if (req.requestedSimulations > 10000) {
            throw new HttpsError("invalid-argument", "Number of tournaments exceeds the limit of 10,000. Please select a lower number.");
        }
    }

    visitMMOpponentBracketSimulationRequest(req: MMOpponentBracketSimulationRequest): void {
        if (req.requestedSimulations > 10000) {
            throw new HttpsError("invalid-argument", "Number of tournaments exceeds the limit of 10,000. Please select a lower number.");
        }
    }
}

class SimulationActionVisitor implements SimulationRequestVisitor<void, DocumentReferenceData> {

    visitMMOutcomeSimulationRequest(req: MMOutcomeSimulationRequest, docRef?: DocumentReferenceData): void {
        this.simulateBatch(req.requestedSimulations, req.teamInfo, docRef);
    }

    visitMMOpponentBracketSimulationRequest(req: MMOpponentBracketSimulationRequest, docRef?: DocumentReferenceData): void {
        this.simulateBatch(req.requestedSimulations, req.teamInfo, docRef);
    }
    
    simulateBatch(requestedSimulations: number, teamInfo: TeamSimulationInfo<any>[], docRef?: DocumentReferenceData): void {
        if (docRef) {
            const input = new SimulateBatchInput(requestedSimulations, teamInfo, docRef);
            const pubsub = new PubSub();
            const topic = pubsub.topic('simulate-batch');
            topic.publishMessage({json: input.data()});
        } else {
            Error("Document Reference is null");
        }
        
    }
}