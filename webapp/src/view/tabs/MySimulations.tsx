import React, { JSX, useEffect, useState } from 'react';
import { getSimulationRequests, SimulationRequest, SimulationRequestVisitor, StorageReferenceData } from 'shared';
import './MySimulations.css'; // Import the CSS file
import { auth, storage } from '../../utils/firebase';
import { getCollection } from '../../utils/GetCollection';
import { SimulationRequestConverter } from '../../converters/SimulationRequestConverter';
import { onSnapshot } from 'firebase/firestore';
import { ref, getDownloadURL } from "firebase/storage";
import { saveAs } from "file-saver"; // Helps with downloading
import { MMOutcomeSimulationRequest, MMOpponentBracketSimulationRequest } from 'shared/dist/datamodel/SimulationRequest';

export const MySimulations: React.FC = () => {
    const [simulations, setSimulations] = useState<SimulationRequest[]>([]);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const id = user.uid;
            const simlist = getSimulationRequests(id);
            const videosRef = getCollection(simlist).withConverter(SimulationRequestConverter);

            // Listen for real-time updates
            const unsubscribe = onSnapshot(videosRef, (snapshot) => {
                const simulationRequestes: SimulationRequest[] = snapshot.docs.map((doc) => doc.data());
                simulationRequestes.sort((a, b) => b.requestTime - a.requestTime);
                setSimulations(simulationRequestes);
            });

            return () => unsubscribe();
        } else {
            return () => {};
        }
    }, []);

    return (
        <div className="my-simulations-container">
            <h1>My Simulations</h1>
            <div className="simulations-list">
                {simulations.map((simulation) => (
                    <div key={simulation.requestTime} className="simulation-row">
                        {simulation.accept(new SimulationRowRenderer())}
                    </div>
                ))}
            </div>
        </div>
    );
};

class SimulationRowRenderer implements SimulationRequestVisitor<JSX.Element, null> {
    
    visitMMOutcomeSimulationRequest(req: MMOutcomeSimulationRequest, optionalInput?: null | undefined): JSX.Element {
        return this.mmsimRow('Tournament Simulation',req.requestedSimulations,req.completedSimulations,req.storageReferenceData)
    }

    visitMMOpponentBracketSimulationRequest(req: MMOpponentBracketSimulationRequest, optionalInput?: null | undefined): JSX.Element {
        return this.mmsimRow('Opponent Bracket Simulation',req.requestedSimulations,req.completedSimulations,req.storageReferenceData)
    }

    mmsimRow(type: string, requestedSimulations: number, completedSimulations: number, storageReferenceData: StorageReferenceData | null): JSX.Element {
        return (
            <div className="simulation-info">
                <div className="simulation-details">
                    <p>Type: {type}</p>
                    <p>Number Simulations: {requestedSimulations}</p>
                </div>
                <div className="simulation-status">
                    {(storageReferenceData?.fullPath) ? (
                        <button className="download-button" onClick={() => downloadCSV(storageReferenceData?.fullPath || '')}>
                            Download Results
                        </button>
                    ) : (
                        <progress value={completedSimulations} max={requestedSimulations}></progress>
                    )}
                </div>
            </div>
        );
    }
}

const downloadCSV = async (path: string) => {
  const fileRef = ref(storage, path); // Path in Firebase Storage

  try {
    const url = await getDownloadURL(fileRef); // Get the file URL

    // Fetch the file and trigger download
    const response = await fetch(url);
    const blob = await response.blob();
    saveAs(blob, fileRef.name);
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};