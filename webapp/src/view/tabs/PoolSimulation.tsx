import React, { useState } from 'react';
import './MarchMadness.css'; // Import the CSS file
import { defaultTeamSelection, MMOpponentBracketSimulationRequest, SimulateMarchMadnessInput } from 'shared';
import { httpsCallable } from "firebase/functions";
import { functions } from '../../utils/firebase';
import { TeamSelectionSimulationInfo } from 'shared/dist/datamodel/MarchMadnessSimulation';

const simulateMarchMadness = httpsCallable(functions, 'simulateMarchMadness');

export const PoolSimulation: React.FC = () => {
    const [teams, setTeams] = useState<TeamSelectionSimulationInfo[]>(defaultTeamSelection);
    const [showDialog, setShowDialog] = useState(false);
    const [numTournaments, setNumTournaments] = useState(1000);

    const handleSelectionChange = (teamIndex: number, oddsIndex: number, newOdds: number) => {
        const newTeams = [...teams];
        newTeams[teamIndex].selectionOdds[oddsIndex] = newOdds / 100; // Convert percentage to decimal
        setTeams(newTeams);
    };

    const resetToDefault = () => {
        setTeams(defaultTeamSelection);
    };

    const runSimulations = () => {
        setShowDialog(true);
    };

    const handleDialogClose = () => {
        setShowDialog(false);
    };

    const handleDialogOk = async () => {
        setShowDialog(false);
        const req = new MMOpponentBracketSimulationRequest(numTournaments, teams);
        const input = new SimulateMarchMadnessInput(req);
        try {
            await simulateMarchMadness(input.data());
            alert(`Running ${numTournaments} simulations... Please go to the "My Simulations" tab to check progress.`);
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="march-madness-container">
            <h1>Simulate Opponent Brackets</h1>
            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Conference</th>
                            <th>Team</th>
                            <th>Seed</th>
                            <th>Round 1 (%)</th>
                            <th>Round 2 (%)</th>
                            <th>Sweet 16 (%)</th>
                            <th>Elite 8 (%)</th>
                            <th>Final 4 (%)</th>
                            <th>Championship (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((team, teamIndex) => (
                            <tr key={teamIndex}>
                                <td>{team.conference}</td>
                                <td>{team.team}</td>
                                <td>{team.seed}</td>
                                {team.selectionOdds.map((odds, oddsIndex) => (
                                    <td key={oddsIndex}>
                                        <input
                                            type="number"
                                            value={odds * 100} // Convert decimal to percentage
                                            onChange={(e) =>
                                                handleSelectionChange(teamIndex, oddsIndex, Number(e.target.value))
                                            }
                                            style={{ width: '50px' }}
                                        />
                                    </td>
                                ))}
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