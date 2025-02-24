import { Simulation, SimulationVisitor } from "./Simulation";

export const simulateMarchMadness = (teamInfo: TeamSimulationInfo[]): MarchMadnessSimulation => {
    // Implement the simulation logic here
    const results: GameResult[][] = [];
    const rounds = [Round.FirstRound, Round.SecondRound, Round.SweetSixteen, Round.EliteEight, Round.FinalFour, Round.Championship];
    for (let i = 0; i < rounds.length; i++) {
        const roundSim = getRoundSimulator(rounds[i]);
        if (i === 0) {
            results[i] = roundSim.simulateRound([], teamInfo);
        } else {
            results[i] = roundSim.simulateRound(results[i-1], teamInfo);
        }
    }
    return new MarchMadnessSimulation(results[0], results[1], results[2], results[3], results[4], results[5]);
}

export class MarchMadnessSimulation implements Simulation {
    round1: GameResult[];
    round2: GameResult[];
    sweet16: GameResult[];
    elite8: GameResult[];
    final4: GameResult[];
    championship: GameResult[];

    constructor(round1: GameResult[], round2: GameResult[], sweet16: GameResult[], elite8: GameResult[], final4: GameResult[], championship: GameResult[]) {
        this.round1 = round1;
        this.round2 = round2;
        this.sweet16 = sweet16;
        this.elite8 = elite8;
        this.final4 = final4;
        this.championship = championship;
    }

    accept<T, U>(visitor: SimulationVisitor<T, U>, optionalInput?: U): T {
        return visitor.visitMarchMadnessSimulation(this, optionalInput);
    }
}


const getRoundSimulator = (round: Round): RoundSimulator => {
    switch (round) {
        case Round.FirstRound:
            return new FirstRoundSimulator();
        case Round.SecondRound:
            return new SecondRoundSimulator();
        case Round.SweetSixteen:
            return new SweetSixteenSimulator();
        case Round.EliteEight:
            return new EliteEightSimulator();
        case Round.FinalFour:
            return new FinalFourSimulator();
        case Round.Championship:
            return new ChampionshipSimulator();
        default:
            throw new Error('Unknown round');
    }
}

enum Round {
    FirstRound = 'First Round',
    SecondRound = 'Second Round',
    SweetSixteen = 'Sweet Sixteen',
    EliteEight = 'Elite Eight',
    FinalFour = 'Final Four',
    Championship = 'Championship'
}

interface RoundSimulator {
    simulateRound: (lastRound: GameResult[], teamInfo: TeamSimulationInfo[]) => GameResult[];
}

class FirstRoundSimulator implements RoundSimulator {
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
                const winner = team1.simulateGame(team2);

                results.push({
                    team1,
                    team2,
                    winner,
                    gameInfo: {
                        round: Round.FirstRound,
                        gameNumber: i + 1,
                        conference: conference
                    }
                });
            }
        });

        return results;
    }
}

class SecondRoundSimulator implements RoundSimulator {
    simulateRound(lastRound: GameResult[], teamInfo: TeamSimulationInfo[]): GameResult[] {
        return conferenceGameSimulator(lastRound, Round.SecondRound);
    }
}

class SweetSixteenSimulator implements RoundSimulator {
    simulateRound(lastRound: GameResult[], teamInfo: TeamSimulationInfo[]): GameResult[] {
        return conferenceGameSimulator(lastRound, Round.SweetSixteen);
    }
}

class EliteEightSimulator implements RoundSimulator {
    simulateRound(lastRound: GameResult[], teamInfo: TeamSimulationInfo[]): GameResult[] {
        return conferenceGameSimulator(lastRound, Round.EliteEight);
    }
}

class FinalFourSimulator implements RoundSimulator {
    simulateRound(currentResults: GameResult[], teamInfo: TeamSimulationInfo[]): GameResult[] {
        const results: GameResult[] = [];
        const eastWinner = currentResults.filter(result => result.gameInfo.conference === Conference.East)[0].winner;
        const westWinner = currentResults.filter(result => result.gameInfo.conference === Conference.West)[0].winner;
        const southWinner = currentResults.filter(result => result.gameInfo.conference === Conference.South)[0].winner;
        const midwestWinner = currentResults.filter(result => result.gameInfo.conference === Conference.Midwest)[0].winner;

        const eastWestGame = {
            team1: eastWinner,
            team2: westWinner,
            winner: eastWinner.simulateGame(westWinner),
            gameInfo: {
            round: Round.FinalFour,
            gameNumber: 1
            }
        };

        const southMidwestGame = {
            team1: southWinner,
            team2: midwestWinner,
            winner: southWinner.simulateGame(midwestWinner),
            gameInfo: {
            round: Round.FinalFour,
            gameNumber: 2
            }
        };

        results.push(eastWestGame, southMidwestGame);

        return results;
    }
}

class ChampionshipSimulator implements RoundSimulator {
    simulateRound(currentResults: GameResult[], teamInfo: TeamSimulationInfo[]): GameResult[] {
        const finalGame = {
            team1: currentResults[0].winner,
            team2: currentResults[1].winner,
            winner: currentResults[0].winner.simulateGame(currentResults[1].winner),
            gameInfo: {
            round: Round.Championship,
            gameNumber: 1
            }
        };

        return [finalGame];
    }
}

const conferenceGameSimulator = (lastRound: GameResult[], round: Round): GameResult[] => {
    const results: GameResult[] = [];
    const conferences = new Set(lastRound.map(result => result.gameInfo.conference));
    const nTeams = lastRound.length / conferences.size;
    const nGames = nTeams / 2;

    conferences.forEach(conference => {
        const games = lastRound.filter(result => result.gameInfo.conference === conference);

        for (let i = 0; i < nGames; i++) {
            const game1 = games[i];
            const game2 = games[nGames - 1 - i];
            const winner1 = game1.winner;
            const winner2 = game2.winner;
            const winner = winner1.simulateGame(winner2);

            results.push({
                team1: winner1,
                team2: winner2,
                winner,
                gameInfo: {
                    round: Round.SecondRound,
                    gameNumber: i + 1,
                    conference: conference
                }
            });
        }
    });

    return results;
}

interface GameInformation {
    round: Round;
    gameNumber: number;
    conference?: Conference;
}

interface GameResult {
    team1: TeamSimulationInfo;
    team2: TeamSimulationInfo;
    winner: TeamSimulationInfo;
    gameInfo: GameInformation;
}

export const gameResultConverterLogic = {
  toFireStore: function(teamSimulationInfo: GameResult): Object {
    return {
        team1: teamSimulationInfoConverterLogic.toFireStore(teamSimulationInfo.team1),
        team2: teamSimulationInfoConverterLogic.toFireStore(teamSimulationInfo.team2),
        winner: teamSimulationInfoConverterLogic.toFireStore(teamSimulationInfo.winner),
        gameInfo: teamSimulationInfo.gameInfo
    }
  },

  fromFireStore: function(document: Object): GameResult {
    const data = document as any;
    return {
        team1: teamSimulationInfoConverterLogic.fromFireStore(data.team1),
        team2: teamSimulationInfoConverterLogic.fromFireStore(data.team2),
        winner: teamSimulationInfoConverterLogic.fromFireStore(data.winner),
        gameInfo: data.gameInfo as GameInformation
    }
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

    simulateGame<T>(this: T, competitor: T): T;
    toFirestore(): Object;
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

    simulateGame<T>(this: T, competitor: T): T {
        // TODO: add the actual simulation logic
        const expectedScore =  Math.random();
        const actualScore = Math.random();
        if (actualScore < expectedScore) {
            return this;
        } else {
            return competitor;
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
];