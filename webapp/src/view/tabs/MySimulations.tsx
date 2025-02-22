import React, { JSX, useEffect, useState } from 'react';
import { getSimulationRequests, MarchMadnessSimulationRequest, SimulationRequest, SimulationRequestVisitor } from 'shared';
import './MySimulations.css'; // Import the CSS file
import { auth } from '../../utils/firebase';
import { getCollection } from '../../utils/GetCollection';
import { SimulationRequestConverter } from '../../converters/SimulationRequestConverter';
import { onSnapshot } from 'firebase/firestore';

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
    visitMarchMadnessSimRequest(req: MarchMadnessSimulationRequest, optionalInput?: null): JSX.Element {
        return (
            <div className="simulation-info">
                <p>Type: Simulate March Madness</p>
                <p>Requested Simulations: {req.requestedSimulations}</p>
                <p>Completed Simulations: {req.completedSimulations}</p>
                <div className="simulation-status">
                    {req.completedSimulations < req.requestedSimulations ? (
                        <progress value={req.completedSimulations} max={req.requestedSimulations}></progress>
                    ) : (
                        <a href={req.storageReferenceData?.fullPath} download>Download Results</a>
                    )}
                </div>
            </div>
        );
    }
}