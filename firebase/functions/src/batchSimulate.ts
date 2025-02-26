import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { getCollection, getDocument } from "./utils/GetCollection";
import { CollectionReferenceData, COLLECTIONS, DocumentReferenceData, MarchMadnessSimulationRequest, SimulateBatchInput, simulateMarchMadnessTournement, SimulationRequest, SimulationRequestVisitor, TeamSimulationInfo } from "shared";
import { firestore } from "firebase-admin";
import { SimulationRequestConverter } from "./converters/SimulationRequestConverter";
import { SimulationConverter } from "./converters/SimulationConverter";

export const batchSimulate = onMessagePublished('simulate-batch', async (event) => {
    // Get the batch simulate input, break it up into smaller batches and simulate each batch
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
    await Promise.all(Array.from({ length: requestedSimulations }, () => simulateTournament(teamInfo, collRef)));

    // Mark the request as complete
    const doc = getDocument(simDoc);
    await markRequestComplete(doc);
};

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

const simulateTournament = async (teamInfo: TeamSimulationInfo[], simCollection: CollectionReferenceData) => {
    const collection = getCollection(simCollection);
    const sim = simulateMarchMadnessTournement(teamInfo);
    await collection.withConverter(SimulationConverter).add(sim)
};