import { onMessagePublished } from "firebase-functions/pubsub";
import { COLLECTIONS, MarchMadnessSimulationRequest, SimulationComplete, SimulationRequestVisitor, MarchMadnessSimulation, TeamSimulationInfo, Conference, MarchMadnessRound, getMarchMadnessRoundWorker } from "shared";
import { getDocument } from "./utils/GetCollection";
import { SimulationRequestConverter } from "./converters/SimulationRequestConverter";
import { SimulationConverter } from "./converters/SimulationConverter";
import { Storage } from '@google-cloud/storage';
import { createObjectCsvStringifier } from 'csv-writer';
import { v4 as uuidv4 } from 'uuid';
import { BUCKETS } from "shared";

// Initialize Google Cloud Storage
const storage = new Storage();
const simulationBucket = storage.bucket(BUCKETS.SimulationResults);

export const simulationComplete = onMessagePublished('simulation-complete', async (event) => {
    // When a simulation is completed, perform some final actions
    const input = SimulationComplete.createFromObject(event.data.message.json);
    const docRef = getDocument(input.documentReference).withConverter(SimulationRequestConverter);
    const doc = (await docRef.get()).data();
    if (doc) {
        const reqCompleter = new SimulationRequestCompletion();
        await doc.accept(reqCompleter, docRef);
    }
});

class SimulationRequestCompletion implements SimulationRequestVisitor<void, FirebaseFirestore.DocumentReference | undefined> {
    async visitMarchMadnessSimRequest(req: MarchMadnessSimulationRequest, optionalInput?: FirebaseFirestore.DocumentReference): Promise<void> {
        if (optionalInput) {
            const simulationsSnapshot = await optionalInput.collection(COLLECTIONS.Simulations).withConverter(SimulationConverter).get();
            const simulations = simulationsSnapshot.docs.map(doc => doc.data() as MarchMadnessSimulation);

            // Write simulations to CSV and upload to Google Cloud Storage
            await this.writeSimulationsToCSV(req.teamInfo, simulations, `simulations/${uuidv4()}.csv`);
        }
    }

    private async writeSimulationsToCSV(teams: TeamSimulationInfo[], simulations: MarchMadnessSimulation[], filePath: string): Promise<void> {
        // create header and data
        const header = createHeader(teams);
        const data = createData(simulations);
        const csvStringifier = createObjectCsvStringifier({header: header});

        // create csv
        const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data);

        // Upload CSV to Google Cloud Storage
        const file = simulationBucket.file(filePath);
        await file.save(csvContent, {
            contentType: 'text/csv'
        });
    }
}

const createHeader = (teams: TeamSimulationInfo[]): { id: string, title: string }[] => {
    const header = [];
    const conferences = [Conference.East, Conference.West, Conference.Midwest, Conference.South];
    for (const conference of conferences) {
        for (let seed = 1; seed <= 16; seed++) {
            const teamInfo = teams.find(team => team.conference === conference && team.seed === seed);
            if (teamInfo) {
                header.push({ id: getCsvId(conference,seed), title: teamInfo.team });
            }
        }
    }
    return header;
}

const createData = (simulations: MarchMadnessSimulation[]): any[] => {
    const records = [];
    for (const simulation of simulations) {
        const cRecord: { [key: string]: number } = {};
        const games = simulation.getAllResults();
        for (const game of games) {
            // if this is the championship game, winner is 1 and loser is 2, otherwise just mark loser
            if (game.gameInfo.round === MarchMadnessRound.Championship) {
                const winner = game.getWinner();
                const winnerid = getCsvId(winner.conference, winner.seed);
                cRecord[winnerid] = 1;
                const loser = game.getLoser();
                const loserid = getCsvId(loser.conference, loser.seed);
                cRecord[loserid] = 2;
            } else {
                const loser = game.getLoser();
                const roundWorker = getMarchMadnessRoundWorker(game.gameInfo.round);
                const loserid = getCsvId(loser.conference, loser.seed);
                cRecord[loserid] = roundWorker.remainingTeams();
            }
        }
        records.push(cRecord);
    }
    return records;
}

const getCsvId = (conference: Conference, seed: number): string => {
    return `${conference}_${seed}`;
}