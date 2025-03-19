import React, { useState } from 'react';
import './MarchMadness.css'; // Import the CSS file
import { defaultTeamSelection, MMOpponentBracketSimulationRequest, SimulateMarchMadnessInput } from 'shared';
import { httpsCallable } from "firebase/functions";
import { functions } from '../../utils/firebase';
import { TeamSelectionSimulationInfo } from 'shared/dist/datamodel/MarchMadnessSimulation';
import { TableOddsView } from './OddsTable';

const simulateMarchMadness = httpsCallable(functions, 'simulateMarchMadness');

export const PoolSimulation: React.FC = () => {
    const [teams, setTeams] = useState<TeamSelectionSimulationInfo[]>(defaultTeamSelection());
    const [showDialog, setShowDialog] = useState(false);
    const [numTournaments, setNumTournaments] = useState(1000);

    const handleSelectionChange = (teamIndex: number, oddsIndex: number, newOdds: number) => {
        const newTeams = [...teams];
        newTeams[teamIndex].selectionOdds[oddsIndex] = newOdds / 100; // Convert percentage to decimal
        setTeams(newTeams);
    };

    const resetToDefault = () => {
        setTeams(defaultTeamSelection());
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
        <TableOddsView
            teams={teams}
            numTournaments={numTournaments}
            showDialog={showDialog}
            title="Simulate Opponent Brackets"
            description="Simulate what your opponents brackets might look like based on <a href='https://tournament.fantasysports.yahoo.com/mens-basketball-bracket/pickdistribution?guccounter=1'>Yahoo</a> pick distribution."
            onSelectionChange={handleSelectionChange}
            onRunSimulations={runSimulations}
            onResetToDefault={resetToDefault}
            onDialogClose={handleDialogClose}
            onDialogOk={handleDialogOk}
            onNumTournamentsChange={setNumTournaments}
        />
    );
}