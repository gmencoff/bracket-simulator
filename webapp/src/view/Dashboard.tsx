import React from 'react';
import { Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { MarchMadness } from './tabs/MarchMadness';
import { MySimulations } from './tabs/MySimulations';
import { PoolSimulation } from './tabs/PoolSimulation';
//import { BracketGenerator } from './tabs/BracketGenerator';

const Dashboard: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <div style={{ padding: "20px" }}>
            <Tabs value={selectedTab} onChange={handleChange} style={{ marginBottom: "20px" }}>
                <Tab label="Tournament Outcome Simulator" />
                <Tab label="Opponent Bracket Simulator" />
                <Tab label="My Simulations" />
            </Tabs>
            {selectedTab === 0 && <MarchMadness />}
            {selectedTab === 1 && <PoolSimulation />}
            {selectedTab === 2 && <MySimulations />}
        </div>
    );
}

export default Dashboard;