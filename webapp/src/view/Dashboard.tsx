import React from 'react';
import { Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { MarchMadness } from './tabs/MarchMadness';
import { MySimulations } from './tabs/MySimulations';

const Dashboard: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <div>
            <Tabs value={selectedTab} onChange={handleChange}>
                <Tab label="March Madness" />
                <Tab label="My Simulations" />
            </Tabs>
            {selectedTab === 0 && <MarchMadness />}
            {selectedTab === 1 && <MySimulations />}
        </div>
    );
}

export default Dashboard;