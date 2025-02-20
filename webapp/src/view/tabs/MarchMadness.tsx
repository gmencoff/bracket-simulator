import React, { useState } from 'react';
import './MarchMadness.css'; // Import the CSS file
import { SimulateMarchMadnessInput, TeamSimulationInfo, initialTeams } from 'shared';
import { httpsCallable } from "firebase/functions";
import { functions } from '../../utils/firebase';

const simulateMarchMadness = httpsCallable(functions, 'simulateMarchMadness');

export const MarchMadness: React.FC = () => {
    const [teams, setTeams] = useState<TeamSimulationInfo[]>(initialTeams);
    const [showDialog, setShowDialog] = useState(false);
    const [numTournaments, setNumTournaments] = useState(1);

    const handleEloChange = (index: number, newElo: number) => {
        const updatedTeams = teams.map((team, i) =>
            i === index ? { ...team, elo: newElo } : team
        );
        setTeams(updatedTeams);
    };

    const resetToDefault = () => {
        setTeams(initialTeams);
    };

    const runSimulations = () => {
        setShowDialog(true);
    };

    const handleDialogClose = () => {
        setShowDialog(false);
    };

    const handleDialogOk = async () => {
        setShowDialog(false);
        const input = new SimulateMarchMadnessInput(teams, numTournaments);
        await simulateMarchMadness(input.data());
        alert(`Running ${numTournaments} simulations... Please go to the "My Simulations" tab to check progress.`);
    };

    return (
        <div className="march-madness-container">
            <h1>Simulate Tournament</h1>
            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Conference</th>
                            <th>Team</th>
                            <th>Seed</th>
                            <th>Elo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((team, index) => (
                            <tr key={index}>
                                <td>{team.conference}</td>
                                <td>{team.team}</td>
                                <td>{team.seed}</td>
                                <td>
                                    <input
                                        type="number"
                                        value={team.elo}
                                        onChange={(e) =>
                                            handleEloChange(index, Number(e.target.value))
                                        }
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="controls">
                <button onClick={runSimulations}>Run Simulations</button>
                <button onClick={resetToDefault}>Reset to Default</button>
            </div>
            {showDialog && (
                <div className="dialog">
                    <div className="dialog-content">
                        <label>
                            Number of tournaments to simulate:
                            <input
                                type="number"
                                value={numTournaments}
                                onChange={(e) => setNumTournaments(Number(e.target.value))}
                            />
                        </label>
                        <div className="dialog-buttons">
                            <button onClick={handleDialogClose}>Cancel</button>
                            <button onClick={handleDialogOk}>OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};