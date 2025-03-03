import { Simulation, SimulationVisitor } from "./Simulation";

export const simulateMarchMadnessTournement = (teamInfo: TeamSimulationInfo[]): MarchMadnessSimulation => {
    // Implement the simulation logic here
    const results: GameResult[][] = [];
    const rounds = [MarchMadnessRound.FirstRound, MarchMadnessRound.SecondRound, MarchMadnessRound.SweetSixteen, MarchMadnessRound.EliteEight, MarchMadnessRound.FinalFour, MarchMadnessRound.Championship];
    for (let i = 0; i < rounds.length; i++) {
        const roundSim = getMarchMadnessRoundWorker(rounds[i]);
        if (i === 0) {
            results[i] = roundSim.simulateRound([], teamInfo);
        } else {
            results[i] = roundSim.simulateRound(results[i-1], teamInfo);
        }
    }
    return new MarchMadnessSimulation(results[0], results[1], results[2], results[3], results[4], results[5], Date.now());
}

export class MarchMadnessSimulation implements Simulation {
    round1: GameResult[];
    round2: GameResult[];
    sweet16: GameResult[];
    elite8: GameResult[];
    final4: GameResult[];
    championship: GameResult[];
    tCreated: number

    constructor(round1: GameResult[], round2: GameResult[], sweet16: GameResult[], elite8: GameResult[], final4: GameResult[], championship: GameResult[], tCreated: number) {
        this.round1 = round1;
        this.round2 = round2;
        this.sweet16 = sweet16;
        this.elite8 = elite8;
        this.final4 = final4;
        this.championship = championship;
        this.tCreated = tCreated;
    }

    getAllResults(): GameResult[] {
        const results = [];
        results.push(...this.round1);
        results.push(...this.round2);
        results.push(...this.sweet16);
        results.push(...this.elite8);
        results.push(...this.final4);
        results.push(...this.championship);
        return results;
    }

    accept<T, U>(visitor: SimulationVisitor<T, U>, optionalInput?: U): T {
        return visitor.visitMarchMadnessSimulation(this, optionalInput);
    }
}


export const getMarchMadnessRoundWorker = (round: MarchMadnessRound): RoundWorker => {
    switch (round) {
        case MarchMadnessRound.FirstRound:
            return new FirstRoundWorker();
        case MarchMadnessRound.SecondRound:
            return new SecondRoundWorker();
        case MarchMadnessRound.SweetSixteen:
            return new SweetSixteenWorker();
        case MarchMadnessRound.EliteEight:
            return new EliteEightWorker();
        case MarchMadnessRound.FinalFour:
            return new FinalFourWorker();
        case MarchMadnessRound.Championship:
            return new ChampionshipWorker();
        default:
            throw new Error('Unknown round');
    }
}

export enum MarchMadnessRound {
    FirstRound = 'First Round',
    SecondRound = 'Second Round',
    SweetSixteen = 'Sweet Sixteen',
    EliteEight = 'Elite Eight',
    FinalFour = 'Final Four',
    Championship = 'Championship'
}

interface RoundWorker {
    simulateRound: (lastRound: GameResult[], teamInfo: TeamSimulationInfo[]) => GameResult[];
    remainingTeams(): number;
}

class FirstRoundWorker implements RoundWorker {
    simulateRound(lastRound: GameResult[], teamInfo: TeamSimulationInfo[]): GameResult[] {
        const results: GameResult[] = [];
        const conferences = new Set(teamInfo.map(info => info.conference));
        const nTeams = 16;

        conferences.forEach(conference => {
            const teams = teamInfo.filter(info => info.conference === conference);
            teams.sort((a, b) => a.seed - b.seed);

            for (let i = 0; i < nTeams / 2; i++) {
                const team1 = teams[i];
                const team2 = teams[nTeams - 1 - i];
                const winner = team1.simulateGame(team2).winner;
                results.push(new GameResult(team1, team2, winner, { round: MarchMadnessRound.FirstRound, gameNumber: i + 1, conference: conference }));
            }
        });

        return results;
    }

    remainingTeams(): number {
        return 64;
    }
}

class SecondRoundWorker implements RoundWorker {
    simulateRound(lastRound: GameResult[], teamInfo: TeamSimulationInfo[]): GameResult[] {
        return conferenceGameSimulator(lastRound, MarchMadnessRound.SecondRound);
    }

    remainingTeams(): number {
        return 32;
    }
}

class SweetSixteenWorker implements RoundWorker {
    simulateRound(lastRound: GameResult[], teamInfo: TeamSimulationInfo[]): GameResult[] {
        return conferenceGameSimulator(lastRound, MarchMadnessRound.SweetSixteen);
    }

    remainingTeams(): number {
        return 16;
    }
}

class EliteEightWorker implements RoundWorker {
    simulateRound(lastRound: GameResult[], teamInfo: TeamSimulationInfo[]): GameResult[] {
        return conferenceGameSimulator(lastRound, MarchMadnessRound.EliteEight);
    }

    remainingTeams(): number {
        return 8;
    }
}

class FinalFourWorker implements RoundWorker {
    simulateRound(currentResults: GameResult[], teamInfo: TeamSimulationInfo[]): GameResult[] {
        const results: GameResult[] = [];
        const eastWinner = currentResults.filter(result => result.gameInfo.conference === Conference.East)[0].getWinner();
        const westWinner = currentResults.filter(result => result.gameInfo.conference === Conference.West)[0].getWinner();
        const southWinner = currentResults.filter(result => result.gameInfo.conference === Conference.South)[0].getWinner();
        const midwestWinner = currentResults.filter(result => result.gameInfo.conference === Conference.Midwest)[0].getWinner();
        const eastWestGame = new GameResult(eastWinner, westWinner, eastWinner.simulateGame(westWinner).winner, { round: MarchMadnessRound.FinalFour, gameNumber: 1 });
        const southMidwestGame = new GameResult(southWinner, midwestWinner, southWinner.simulateGame(midwestWinner).winner, { round: MarchMadnessRound.FinalFour, gameNumber: 2 });
        results.push(eastWestGame, southMidwestGame);
        return results;
    }

    remainingTeams(): number {
        return 4;
    }
}

class ChampionshipWorker implements RoundWorker {
    simulateRound(currentResults: GameResult[], teamInfo: TeamSimulationInfo[]): GameResult[] {
        const winner1 = currentResults[0].getWinner();
        const winner2 = currentResults[1].getWinner();
        const champ = winner1.simulateGame(winner2).winner;
        const finalGame = new GameResult(winner1,winner2,champ,{round: MarchMadnessRound.Championship, gameNumber: 1});
        return [finalGame];
    }

    remainingTeams(): number {
        return 2;
    }
}

const conferenceGameSimulator = (lastRound: GameResult[], round: MarchMadnessRound): GameResult[] => {
    const results: GameResult[] = [];
    const conferences = new Set(lastRound.map(result => result.gameInfo.conference));
    const nGamesLastRound = lastRound.length / conferences.size;
    const nGamesCurRound = nGamesLastRound / 2;

    conferences.forEach(conference => {
        const games = lastRound.filter(result => result.gameInfo.conference === conference);

        for (let i = 0; i < nGamesCurRound; i++) {
            const game1 = games[i];
            const game2 = games[nGamesLastRound - 1 - i];
            const winner1 = game1.getWinner();
            const winner2 = game2.getWinner();
            const outcome = winner1.simulateGame(winner2);
            results.push(new GameResult(winner1,winner2,outcome.winner,{ round: round, gameNumber: i + 1, conference: conference }))
        }
    });

    return results;
}

interface GameInformation {
    round: MarchMadnessRound;
    gameNumber: number;
    conference?: Conference;
}

class GameResult {
    team1: TeamSimulationInfo;
    team2: TeamSimulationInfo;
    winner: number;
    gameInfo: GameInformation;

    constructor(team1: TeamSimulationInfo, team2: TeamSimulationInfo, winner: number, gameInfo: GameInformation) {
        this.team1 = team1;
        this.team2 = team2;
        this.winner = winner;
        this.gameInfo = gameInfo;
    }

    getWinner(): TeamSimulationInfo {
        return this.winner === 1 ? this.team1 : this.team2;
    }

    getLoser(): TeamSimulationInfo {
        return this.winner === 1 ? this.team2 : this.team1;
    }
}

export const gameResultConverterLogic = {
  toFireStore: function(teamSimulationInfo: GameResult): Object {
    return {
        team1: teamSimulationInfoConverterLogic.toFireStore(teamSimulationInfo.team1),
        team2: teamSimulationInfoConverterLogic.toFireStore(teamSimulationInfo.team2),
        winner: teamSimulationInfo.winner,
        gameInfo: teamSimulationInfo.gameInfo
    }
  },

  fromFireStore: function(document: Object): GameResult {
    const data = document as any;
    return new GameResult(
        teamSimulationInfoConverterLogic.fromFireStore(data.team1),
        teamSimulationInfoConverterLogic.fromFireStore(data.team2),
        data.winner,
        data.gameInfo as GameInformation
    )
  }
}

export enum Conference {
    East = 'East',
    West = 'West',
    South = 'South',
    Midwest = 'Midwest'
}

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

export interface TeamSimulationInfo {
    team: Team;
    conference: Conference;
    seed: number;

    simulateGame<T>(this: T, competitor: T): Outcome;
    toFirestore(): Object;
}

interface Outcome {
    winner: number
}

export class TeamEloSimulationInfo implements TeamSimulationInfo {
    team: Team;
    conference: Conference;
    seed: number;
    elo: number;

    constructor(team: Team, conference: Conference, seed: number, elo: number) {
        this.team = team;
        this.conference = conference;
        this.seed = seed;
        this.elo = elo;
    }

    simulateGame<T>(this: T, competitor: T): Outcome {
        // TODO: add the actual simulation logic
        const expectedScore =  Math.random();
        const actualScore = Math.random();
        if (actualScore < expectedScore) {
            return { winner: 1 };
        } else {
            return { winner: 2 };
        }
    }

    toFirestore(): Object {
        return {
            type: 'TeamEloSimulationInfo',
            team: this.team,
            conference: this.conference,
            seed: this.seed,
            elo: this.elo
        };
    }
}

// Firebase converter Logic
export const teamSimulationInfoConverterLogic = {
  toFireStore: function(teamSimulationInfo: TeamSimulationInfo): Object {
    return teamSimulationInfo.toFirestore();
  },

  fromFireStore: function(document: Object): TeamSimulationInfo {
    const data = document as any;
    switch (data.type) {
        case 'TeamEloSimulationInfo':
            return new TeamEloSimulationInfo(data.team, data.conference, data.seed, data.elo);
        default:
            throw new Error('Unknown event type');
    }
  }
}


export const initialTeams: TeamEloSimulationInfo[] = [
    new TeamEloSimulationInfo(Team.Michigan, Conference.East, 1, 2000),
    new TeamEloSimulationInfo(Team.LSU, Conference.East, 2, 1900),
    new TeamEloSimulationInfo(Team.Colorado, Conference.East, 3, 1800),
    new TeamEloSimulationInfo(Team.FloridaState, Conference.East, 4, 1700),
    new TeamEloSimulationInfo(Team.GeorgiaTech, Conference.East, 5, 1600),
    new TeamEloSimulationInfo(Team.BYU, Conference.East, 6, 1500),
    new TeamEloSimulationInfo(Team.Clemson, Conference.East, 7, 1400),
    new TeamEloSimulationInfo(Team.UConn, Conference.East, 8, 1300),
    new TeamEloSimulationInfo(Team.LoyolaChicago, Conference.East, 9, 1200),
    new TeamEloSimulationInfo(Team.NorthCarolina, Conference.East, 10, 1100),
    new TeamEloSimulationInfo(Team.Rutgers, Conference.East, 11, 1000),
    new TeamEloSimulationInfo(Team.StBonaventure, Conference.East, 12, 900),
    new TeamEloSimulationInfo(Team.Syracuse, Conference.East, 13, 800),
    new TeamEloSimulationInfo(Team.Maryland, Conference.East, 14, 700),
    new TeamEloSimulationInfo(Team.VCU, Conference.East, 15, 600),
    new TeamEloSimulationInfo(Team.Drake, Conference.East, 16, 500),
    new TeamEloSimulationInfo(Team.Gonzaga, Conference.West, 1, 2000),
    new TeamEloSimulationInfo(Team.Baylor, Conference.West, 2, 1900),
    new TeamEloSimulationInfo(Team.Iowa, Conference.West, 3, 1800),
    new TeamEloSimulationInfo(Team.Kansas, Conference.West, 4, 1700),
    new TeamEloSimulationInfo(Team.Arkansas, Conference.West, 5, 1600),
    new TeamEloSimulationInfo(Team.Texas, Conference.West, 6, 1500),
    new TeamEloSimulationInfo(Team.OklahomaState, Conference.West, 7, 1400),
    new TeamEloSimulationInfo(Team.Purdue, Conference.West, 8, 1300),
    new TeamEloSimulationInfo(Team.TexasTech, Conference.West, 9, 1200),
    new TeamEloSimulationInfo(Team.Virginia, Conference.West, 10, 1100),
    new TeamEloSimulationInfo(Team.Creighton, Conference.West, 11, 1000),
    new TeamEloSimulationInfo(Team.Colorado, Conference.West, 12, 900),
    new TeamEloSimulationInfo(Team.USC, Conference.West, 13, 800),
    new TeamEloSimulationInfo(Team.BYU, Conference.West, 14, 700),
    new TeamEloSimulationInfo(Team.Tennessee, Conference.West, 15, 600),
    new TeamEloSimulationInfo(Team.Wisconsin, Conference.West, 16, 500),
    new TeamEloSimulationInfo(Team.Houston, Conference.South, 1, 2000),
    new TeamEloSimulationInfo(Team.Illinois, Conference.South, 2, 1900),
    new TeamEloSimulationInfo(Team.OhioState, Conference.South, 3, 1800),
    new TeamEloSimulationInfo(Team.FloridaState, Conference.South, 4, 1700),
    new TeamEloSimulationInfo(Team.Kansas, Conference.South, 5, 1600),
    new TeamEloSimulationInfo(Team.Arkansas, Conference.South, 6, 1500),
    new TeamEloSimulationInfo(Team.Texas, Conference.South, 7, 1400),
    new TeamEloSimulationInfo(Team.OklahomaState, Conference.South, 8, 1300),
    new TeamEloSimulationInfo(Team.Purdue, Conference.South, 9, 1200),
    new TeamEloSimulationInfo(Team.TexasTech, Conference.South, 10, 1100),
    new TeamEloSimulationInfo(Team.Virginia, Conference.South, 11, 1000),
    new TeamEloSimulationInfo(Team.Creighton, Conference.South, 12, 900),
    new TeamEloSimulationInfo(Team.Colorado, Conference.South, 13, 800),
    new TeamEloSimulationInfo(Team.USC, Conference.South, 14, 700),
    new TeamEloSimulationInfo(Team.BYU, Conference.South, 15, 600),
    new TeamEloSimulationInfo(Team.Tennessee, Conference.South, 16, 500),
    new TeamEloSimulationInfo(Team.Gonzaga, Conference.Midwest, 1, 2000),
    new TeamEloSimulationInfo(Team.Baylor, Conference.Midwest, 2, 1900),
    new TeamEloSimulationInfo(Team.Iowa, Conference.Midwest, 3, 1800),
    new TeamEloSimulationInfo(Team.Kansas, Conference.Midwest, 4, 1700),
    new TeamEloSimulationInfo(Team.Arkansas, Conference.Midwest, 5, 1600),
    new TeamEloSimulationInfo(Team.Texas, Conference.Midwest, 6, 1500),
    new TeamEloSimulationInfo(Team.OklahomaState, Conference.Midwest, 7, 1400),
    new TeamEloSimulationInfo(Team.Purdue, Conference.Midwest, 8, 1300),
    new TeamEloSimulationInfo(Team.TexasTech, Conference.Midwest, 9, 1200),
    new TeamEloSimulationInfo(Team.Virginia, Conference.Midwest, 10, 1100),
    new TeamEloSimulationInfo(Team.Creighton, Conference.Midwest, 11, 1000),
    new TeamEloSimulationInfo(Team.Colorado, Conference.Midwest, 12, 900),
    new TeamEloSimulationInfo(Team.USC, Conference.Midwest, 13, 800),
    new TeamEloSimulationInfo(Team.BYU, Conference.Midwest, 14, 700),
    new TeamEloSimulationInfo(Team.Tennessee, Conference.Midwest, 15, 600),
    new TeamEloSimulationInfo(Team.Wisconsin, Conference.Midwest, 16, 500)
]