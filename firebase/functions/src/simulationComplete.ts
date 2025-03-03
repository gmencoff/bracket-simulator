import { onMessagePublished } from "firebase-functions/pubsub";
import { COLLECTIONS, MarchMadnessSimulationRequest, SimulationComplete, SimulationRequestVisitor, MarchMadnessSimulation, TeamSimulationInfo, Conference, MarchMadnessRound, getMarchMadnessRoundWorker, SimulationRequest } from "shared";
import { getDocument } from "./utils/GetCollection";
import { SimulationRequestConverter } from "./converters/SimulationRequestConverter";
import { SimulationConverter } from "./converters/SimulationConverter";
import { createObjectCsvStringifier } from 'csv-writer';
import { v4 as uuidv4 } from 'uuid';
import { StorageReferenceData } from "shared/dist/dbreferences/DatabaseReferences";
import * as admin from 'firebase-admin';

export const simulationComplete = onMessagePublished({ topic: 'simulation-complete', memory: "2GiB", timeoutSeconds: 300}, async (event) => {
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
    async visitMarchMadnessSimRequest(req: MarchMadnessSimulationRequest, optionalInput?: FirebaseFirestore.DocumentReference<SimulationRequest, FirebaseFirestore.DocumentData>): Promise<void> {
        if (optionalInput) {
            // Setup
            const collectionRef = optionalInput.collection(COLLECTIONS.Simulations).withConverter(SimulationConverter)
            let lastDoc = null;
            let batchSize = 100; // Adjust based on Firestore limits
            const path = `simulations/${uuidv4()}.csv`;
            
            // create header and data
            const header = createHeader(req.teamInfo);
            const data: any = [];
        
            // Download data in chunks
            do {
                let query = collectionRef.orderBy("tCreated").limit(batchSize);
                if (lastDoc) {
                    query = query.startAfter(lastDoc);
                }
                
                const snapshot = await query.get();
                if (snapshot.empty) break;
        
                // Create simulation csv data
                const simulations = snapshot.docs.map(doc => doc.data() as MarchMadnessSimulation);
                data.push(...createData(simulations,data.length+1));
        
                lastDoc = snapshot.docs[snapshot.docs.length - 1];
        
            } while (lastDoc);

            const csvStringifier = createObjectCsvStringifier({header: header});

            // create csv
            const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data);

            // Upload CSV to Google Cloud Storage
            const simulationBucket = admin.storage().bucket();
            const file = simulationBucket.file(path);
            await file.save(csvContent, {
                contentType: 'text/csv'
            });

            // Update the Simulation Request document to mark it as completed
            await optionalInput.firestore.runTransaction(async (transaction) => {
                const doc = await transaction.get(optionalInput);
                if (doc.exists) {
                    const docData = doc.data();
                    if (docData) {
                        const storage: StorageReferenceData = {
                            bucket: 'default',
                            fullPath: path
                        }
                        docData.storageReferenceData = storage;
                        transaction.set(optionalInput, docData);
                    }
                }
            });
        }
    }
}

const createHeader = (teams: TeamSimulationInfo[]): { id: string, title: string }[] => {
    const header = [{id: 'sim', title: 'Simulation'}];
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

const createData = (simulations: MarchMadnessSimulation[], startIdx: number): any[] => {
    const records = [];
    for (let i = 0; i < simulations.length; i++) {
        const simulation = simulations[i];
        const cRecord: { [key: string]: number } = {};
        cRecord['sim'] = i+startIdx;
        const games = simulation.getAllResults();
        for (let j = 0; j < games.length; j++) {
            const game = games[j];
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