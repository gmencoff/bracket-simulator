import { CollectionReferenceData, SimulateBatchInput, simulateMarchMadness, TeamSimulationInfo } from 'shared';
import { getCollection } from './utils/GetCollection';
import { SimulationConverter } from './converters/SimulationConverter';
import { onCall } from 'firebase-functions/https';


export const simulateBatch = onCall(async (request) => {
    const auth = request.auth;
    if (auth) {
        // Get the input in the correct format
        const input = SimulateBatchInput.createFromObject(request.data);
        await Promise.all(Array.from({ length: input.specification.numTournaments }, () => simulateTournament(input.specification.teams, input.collectionReference)));
    }
})

const simulateTournament = async (teamInfo: TeamSimulationInfo[], simCollection: CollectionReferenceData) => {
    const collection = getCollection(simCollection);
    const sim = simulateMarchMadness(teamInfo);
    await collection.withConverter(SimulationConverter).add(sim)
};