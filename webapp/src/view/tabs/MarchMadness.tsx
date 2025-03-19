import React, { useState } from 'react';
import './MarchMadness.css'; // Import the CSS file
import { MMOutcomeSimulationRequest, SimulateMarchMadnessInput, TeamSelectionSimulationInfo, defaultTeamWinOdds } from 'shared';
import { httpsCallable } from "firebase/functions";
import { functions } from '../../utils/firebase';
import { TableOddsView } from './OddsTable';

const simulateMarchMadness = httpsCallable(functions, 'simulateMarchMadness');

export const MarchMadness: React.FC = () => {
    const [teams, setTeams] = useState<TeamSelectionSimulationInfo[]>(defaultTeamWinOdds());
    const [showDialog, setShowDialog] = useState(false);
    const [numTournaments, setNumTournaments] = useState(1000);

    const handleSelectionChange = (teamIndex: number, oddsIndex: number, newOdds: number) => {
        const newTeams = [...teams];
        newTeams[teamIndex].selectionOdds[oddsIndex] = newOdds / 100; // Convert percentage to decimal
        setTeams(newTeams);
    };

    const resetToDefault = () => {
        setTeams(defaultTeamWinOdds());
    };

    const runSimulations = () => {
        setShowDialog(true);
    };

    const handleDialogClose = () => {
        setShowDialog(false);
    };

    const handleDialogOk = async () => {
        setShowDialog(false);
        const req = new MMOutcomeSimulationRequest(numTournaments, teams);
        const input = new SimulateMarchMadnessInput(req);
        try {
            await simulateMarchMadness(input.data());
            alert(`Running ${numTournaments} simulations... Please go to the "My Simulations" tab to check progress.`);
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <TableOddsView
            teams={teams}
            numTournaments={numTournaments}
            showDialog={showDialog}
            title="Simulate March Madness"
            description="Simulate expected March Madness outcomes based on <a href='https://www.natesilver.net/p/2025-march-madness-ncaa-tournament-predictions'>Nate Silver's</a> projections."
            onSelectionChange={handleSelectionChange}
            onRunSimulations={runSimulations}
            onResetToDefault={resetToDefault}
            onDialogClose={handleDialogClose}
            onDialogOk={handleDialogOk}
            onNumTournamentsChange={setNumTournaments}
        />
    );
};