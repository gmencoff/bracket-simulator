import React, { useState } from 'react';
import { TextField, Typography, Button } from '@mui/material';
import { defaultTeamWinOdds, defaultTeamSelection, MMBracketGeneratorSimulationRequest, SimulateMarchMadnessInput } from 'shared';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../utils/firebase';

const simulateMarchMadness = httpsCallable(functions, 'simulateMarchMadness');

export const BracketGenerator: React.FC = () => {
    const [bracketEntries, setBracketEntries] = useState(100);
    const [tournamentOutcomes, setTournamentOutcomes] = useState(1000);

    const handleSubmit = async () => {
        const req = new MMBracketGeneratorSimulationRequest(tournamentOutcomes, bracketEntries, defaultTeamWinOdds(), defaultTeamSelection());
        const input = new SimulateMarchMadnessInput(req);
        try {
            await simulateMarchMadness(input.data());
            alert(`Running ${tournamentOutcomes} simulations... Please go to the "My Simulations" tab to check progress.`);
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div>
            <Typography variant="h6">March Madness Optimal Bracket Generator</Typography>
            <Typography variant="body1" style={{ marginTop: '20px' }}>
                How it works:
                <ol>
                    <li>Simulate a tournament outcome based on default team elo values (see Tournament Outcome Simulator Tab).</li>
                    <li>Simulate the best bracket expected from your competitors (see Opponent Bracket Simulator Tab).</li>
                    <li>Generate brackets that would have beat your competition.</li>
                    <li>Repeat many times to find some winners.</li>
                </ol>
            </Typography>
            <TextField
                label="Number of Expected Competitor Bracket Entries"
                type="number"
                value={bracketEntries}
                onChange={(e) => setBracketEntries(Number(e.target.value))}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Number of Tournaments to Simulate"
                type="number"
                value={tournamentOutcomes}
                onChange={(e) => setTournamentOutcomes(Number(e.target.value))}
                fullWidth
                margin="normal"
            />
            <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubmit} 
                style={{ marginTop: '20px' }}
            >
                Submit
            </Button>
        </div>
    );
};
