import { Conference } from "./Conference";
import { TeamEloSimulationInfo, TeamSelectionSimulationInfo } from "./MarchMadnessSimulation";

export enum Team {
    AbileneChristian = 'Abilene Christian',
    Alabama = 'Alabama',
    AppalachianState = 'Appalachian State',
    Arkansas = 'Arkansas',
    Baylor = 'Baylor',
    BYU = 'BYU',
    ClevelandState = 'Cleveland State',
    Clemson = 'Clemson',
    Colorado = 'Colorado',
    Creighton = 'Creighton',
    Drake = 'Drake',
    Drexel = 'Drexel',
    EasternWashington = 'Eastern Washington',
    FloridaState = 'Florida State',
    GeorgiaTech = 'Georgia Tech',
    Gonzaga = 'Gonzaga',
    GrandCanyon = 'Grand Canyon',
    Hartford = 'Hartford',
    Houston = 'Houston',
    Illinois = 'Illinois',
    Iona = 'Iona',
    Iowa = 'Iowa',
    Kansas = 'Kansas',
    Liberty = 'Liberty',
    LoyolaChicago = 'Loyola Chicago',
    LSU = 'LSU',
    Maryland = 'Maryland',
    Michigan = 'Michigan',
    MoreheadState = 'Morehead State',
    MountStMarys = 'Mount St. Mary\'s',
    NorfolkState = 'Norfolk State',
    NorthCarolina = 'North Carolina',
    OhioState = 'Ohio State',
    Oklahoma = 'Oklahoma',
    OklahomaState = 'Oklahoma State',
    OralRoberts = 'Oral Roberts',
    Oregon = 'Oregon',
    Purdue = 'Purdue',
    Rutgers = 'Rutgers',
    SanDiegoState = 'San Diego State',
    StBonaventure = 'St. Bonaventure',
    Syracuse = 'Syracuse',
    Tennessee = 'Tennessee',
    Texas = 'Texas',
    TexasTech = 'Texas Tech',
    UConn = 'UConn',
    UCSB = 'UCSB',
    USC = 'USC',
    VCU = 'VCU',
    Virginia = 'Virginia',
    Winthrop = 'Winthrop',
    Wisconsin = 'Wisconsin'
}

export interface TeamData {
    elo: number;
    selectionOdds: number[];
    conference: Conference;
    seed: number;
}

export const teamStats: Map<Team, TeamData> = new Map([
    // East Conference
    [Team.Michigan, { elo: 2000, selectionOdds: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4], conference: Conference.East, seed: 1 }],
    [Team.LSU, { elo: 1900, selectionOdds: [0.85, 0.75, 0.65, 0.55, 0.45, 0.35], conference: Conference.East, seed: 2 }],
    [Team.Colorado, { elo: 1800, selectionOdds: [0.8, 0.7, 0.6, 0.5, 0.4, 0.3], conference: Conference.East, seed: 3 }],
    [Team.FloridaState, { elo: 1700, selectionOdds: [0.75, 0.65, 0.55, 0.45, 0.35, 0.25], conference: Conference.East, seed: 4 }],
    [Team.GeorgiaTech, { elo: 1600, selectionOdds: [0.7, 0.6, 0.5, 0.4, 0.3, 0.2], conference: Conference.East, seed: 5 }],
    [Team.BYU, { elo: 1500, selectionOdds: [0.65, 0.55, 0.45, 0.35, 0.25, 0.15], conference: Conference.East, seed: 6 }],
    [Team.Clemson, { elo: 1400, selectionOdds: [0.6, 0.5, 0.4, 0.3, 0.2, 0.1], conference: Conference.East, seed: 7 }],
    [Team.UConn, { elo: 1300, selectionOdds: [0.55, 0.45, 0.35, 0.25, 0.15, 0.05], conference: Conference.East, seed: 8 }],
    [Team.LoyolaChicago, { elo: 1200, selectionOdds: [0.5, 0.4, 0.3, 0.2, 0.1, 0.05], conference: Conference.East, seed: 9 }],
    [Team.NorthCarolina, { elo: 1100, selectionOdds: [0.45, 0.35, 0.25, 0.15, 0.1, 0.05], conference: Conference.East, seed: 10 }],
    [Team.Rutgers, { elo: 1000, selectionOdds: [0.4, 0.3, 0.2, 0.1, 0.05, 0.01], conference: Conference.East, seed: 11 }],
    [Team.StBonaventure, { elo: 900, selectionOdds: [0.35, 0.25, 0.15, 0.1, 0.05, 0.01], conference: Conference.East, seed: 12 }],
    [Team.Syracuse, { elo: 800, selectionOdds: [0.3, 0.2, 0.1, 0.05, 0.01, 0.01], conference: Conference.East, seed: 13 }],
    [Team.Maryland, { elo: 700, selectionOdds: [0.25, 0.15, 0.1, 0.05, 0.01, 0.01], conference: Conference.East, seed: 14 }],
    [Team.VCU, { elo: 600, selectionOdds: [0.2, 0.1, 0.05, 0.01, 0.01, 0.01], conference: Conference.East, seed: 15 }],
    [Team.Drake, { elo: 500, selectionOdds: [0.15, 0.1, 0.05, 0.01, 0.01, 0.01], conference: Conference.East, seed: 16 }],

    // West Conference
    [Team.Gonzaga, { elo: 2000, selectionOdds: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4], conference: Conference.West, seed: 1 }],
    [Team.Baylor, { elo: 1900, selectionOdds: [0.85, 0.75, 0.65, 0.55, 0.45, 0.35], conference: Conference.West, seed: 2 }],
    [Team.Iowa, { elo: 1800, selectionOdds: [0.8, 0.7, 0.6, 0.5, 0.4, 0.3], conference: Conference.West, seed: 3 }],
    [Team.Kansas, { elo: 1700, selectionOdds: [0.75, 0.65, 0.55, 0.45, 0.35, 0.25], conference: Conference.West, seed: 4 }],
    [Team.Arkansas, { elo: 1600, selectionOdds: [0.7, 0.6, 0.5, 0.4, 0.3, 0.2], conference: Conference.West, seed: 5 }],
    [Team.Texas, { elo: 1500, selectionOdds: [0.65, 0.55, 0.45, 0.35, 0.25, 0.15], conference: Conference.West, seed: 6 }],
    [Team.OklahomaState, { elo: 1400, selectionOdds: [0.6, 0.5, 0.4, 0.3, 0.2, 0.1], conference: Conference.West, seed: 7 }],
    [Team.Purdue, { elo: 1300, selectionOdds: [0.55, 0.45, 0.35, 0.25, 0.15, 0.05], conference: Conference.West, seed: 8 }],
    [Team.TexasTech, { elo: 1200, selectionOdds: [0.5, 0.4, 0.3, 0.2, 0.1, 0.05], conference: Conference.West, seed: 9 }],
    [Team.Virginia, { elo: 1100, selectionOdds: [0.45, 0.35, 0.25, 0.15, 0.1, 0.05], conference: Conference.West, seed: 10 }],
    [Team.Creighton, { elo: 1000, selectionOdds: [0.4, 0.3, 0.2, 0.1, 0.05, 0.01], conference: Conference.West, seed: 11 }],
    [Team.Colorado, { elo: 900, selectionOdds: [0.35, 0.25, 0.15, 0.1, 0.05, 0.01], conference: Conference.West, seed: 12 }],
    [Team.USC, { elo: 800, selectionOdds: [0.3, 0.2, 0.1, 0.05, 0.01, 0.01], conference: Conference.West, seed: 13 }],
    [Team.BYU, { elo: 700, selectionOdds: [0.25, 0.15, 0.1, 0.05, 0.01, 0.01], conference: Conference.West, seed: 14 }],
    [Team.Tennessee, { elo: 600, selectionOdds: [0.2, 0.1, 0.05, 0.01, 0.01, 0.01], conference: Conference.West, seed: 15 }],
    [Team.Wisconsin, { elo: 500, selectionOdds: [0.15, 0.1, 0.05, 0.01, 0.01, 0.01], conference: Conference.West, seed: 16 }],

    // South Conference
    [Team.Houston, { elo: 2000, selectionOdds: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4], conference: Conference.South, seed: 1 }],
    [Team.Illinois, { elo: 1900, selectionOdds: [0.85, 0.75, 0.65, 0.55, 0.45, 0.35], conference: Conference.South, seed: 2 }],
    [Team.OhioState, { elo: 1800, selectionOdds: [0.8, 0.7, 0.6, 0.5, 0.4, 0.3], conference: Conference.South, seed: 3 }],
    [Team.FloridaState, { elo: 1700, selectionOdds: [0.75, 0.65, 0.55, 0.45, 0.35, 0.25], conference: Conference.South, seed: 4 }],
    [Team.Kansas, { elo: 1600, selectionOdds: [0.7, 0.6, 0.5, 0.4, 0.3, 0.2], conference: Conference.South, seed: 5 }],
    [Team.Arkansas, { elo: 1500, selectionOdds: [0.65, 0.55, 0.45, 0.35, 0.25, 0.15], conference: Conference.South, seed: 6 }],
    [Team.Texas, { elo: 1400, selectionOdds: [0.6, 0.5, 0.4, 0.3, 0.2, 0.1], conference: Conference.South, seed: 7 }],
    [Team.OklahomaState, { elo: 1300, selectionOdds: [0.55, 0.45, 0.35, 0.25, 0.15, 0.05], conference: Conference.South, seed: 8 }],
    [Team.Purdue, { elo: 1200, selectionOdds: [0.5, 0.4, 0.3, 0.2, 0.1, 0.05], conference: Conference.South, seed: 9 }],
    [Team.TexasTech, { elo: 1100, selectionOdds: [0.45, 0.35, 0.25, 0.15, 0.1, 0.05], conference: Conference.South, seed: 10 }],
    [Team.Virginia, { elo: 1000, selectionOdds: [0.4, 0.3, 0.2, 0.1, 0.05, 0.01], conference: Conference.South, seed: 11 }],
    [Team.Creighton, { elo: 900, selectionOdds: [0.35, 0.25, 0.15, 0.1, 0.05, 0.01], conference: Conference.South, seed: 12 }],
    [Team.Colorado, { elo: 800, selectionOdds: [0.3, 0.2, 0.1, 0.05, 0.01, 0.01], conference: Conference.South, seed: 13 }],
    [Team.USC, { elo: 700, selectionOdds: [0.25, 0.15, 0.1, 0.05, 0.01, 0.01], conference: Conference.South, seed: 14 }],
    [Team.BYU, { elo: 600, selectionOdds: [0.2, 0.1, 0.05, 0.01, 0.01, 0.01], conference: Conference.South, seed: 15 }],
    [Team.Tennessee, { elo: 500, selectionOdds: [0.15, 0.1, 0.05, 0.01, 0.01, 0.01], conference: Conference.South, seed: 16 }],

    // Midwest Conference
    [Team.Gonzaga, { elo: 2000, selectionOdds: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4], conference: Conference.Midwest, seed: 1 }],
    [Team.Baylor, { elo: 1900, selectionOdds: [0.85, 0.75, 0.65, 0.55, 0.45, 0.35], conference: Conference.Midwest, seed: 2 }],
    [Team.Iowa, { elo: 1800, selectionOdds: [0.8, 0.7, 0.6, 0.5, 0.4, 0.3], conference: Conference.Midwest, seed: 3 }],
    [Team.Kansas, { elo: 1700, selectionOdds: [0.75, 0.65, 0.55, 0.45, 0.35, 0.25], conference: Conference.Midwest, seed: 4 }],
    [Team.Arkansas, { elo: 1600, selectionOdds: [0.7, 0.6, 0.5, 0.4, 0.3, 0.2], conference: Conference.Midwest, seed: 5 }],
    [Team.Texas, { elo: 1500, selectionOdds: [0.65, 0.55, 0.45, 0.35, 0.25, 0.15], conference: Conference.Midwest, seed: 6 }],
    [Team.OklahomaState, { elo: 1400, selectionOdds: [0.6, 0.5, 0.4, 0.3, 0.2, 0.1], conference: Conference.Midwest, seed: 7 }],
    [Team.Purdue, { elo: 1300, selectionOdds: [0.55, 0.45, 0.35, 0.25, 0.15, 0.05], conference: Conference.Midwest, seed: 8 }],
    [Team.TexasTech, { elo: 1200, selectionOdds: [0.5, 0.4, 0.3, 0.2, 0.1, 0.05], conference: Conference.Midwest, seed: 9 }],
    [Team.Virginia, { elo: 1100, selectionOdds: [0.45, 0.35, 0.25, 0.15, 0.1, 0.05], conference: Conference.Midwest, seed: 10 }],
    [Team.Creighton, { elo: 1000, selectionOdds: [0.4, 0.3, 0.2, 0.1, 0.05, 0.01], conference: Conference.Midwest, seed: 11 }],
    [Team.Colorado, { elo: 900, selectionOdds: [0.35, 0.25, 0.15, 0.1, 0.05, 0.01], conference: Conference.Midwest, seed: 12 }],
    [Team.USC, { elo: 800, selectionOdds: [0.3, 0.2, 0.1, 0.05, 0.01, 0.01], conference: Conference.Midwest, seed: 13 }],
    [Team.BYU, { elo: 700, selectionOdds: [0.25, 0.15, 0.1, 0.05, 0.01, 0.01], conference: Conference.Midwest, seed: 14 }],
    [Team.Tennessee, { elo: 600, selectionOdds: [0.2, 0.1, 0.05, 0.01, 0.01, 0.01], conference: Conference.Midwest, seed: 15 }],
    [Team.Wisconsin, { elo: 500, selectionOdds: [0.15, 0.1, 0.05, 0.01, 0.01, 0.01], conference: Conference.Midwest, seed: 16 }]
]);

export const defaultTeamElo: TeamEloSimulationInfo[] = Array.from(teamStats.entries()).map(([team, data]) => 
    new TeamEloSimulationInfo(team, data.conference, data.seed, data.elo)
);

export const defaultTeamSelection: TeamSelectionSimulationInfo[] = Array.from(teamStats.entries()).map(([team, data]) => 
    new TeamSelectionSimulationInfo(team, data.conference, data.seed, data.selectionOdds)
);