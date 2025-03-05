import { Conference } from "./Conference";
import { getMarchMadnessRoundWorker, MarchMadnessRound } from "./Rounds";
import { Simulation, SimulationVisitor } from "./Simulation";
import { Team } from "./Teams";

export const simulateMarchMadnessTournement = (teamInfo: TeamSimulationInfo<any>[]): MarchMadnessSimulation => {
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

interface GameInformation {
    round: MarchMadnessRound;
    gameNumber: number;
    conference?: Conference;
}

export class GameResult {
    team1: TeamSimulationInfo<any>;
    team2: TeamSimulationInfo<any>;
    winner: number;
    gameInfo: GameInformation;

    constructor(team1: TeamSimulationInfo<any>, team2: TeamSimulationInfo<any>, winner: number, gameInfo: GameInformation) {
        this.team1 = team1;
        this.team2 = team2;
        this.winner = winner;
        this.gameInfo = gameInfo;
    }

    getWinner(): TeamSimulationInfo<any> {
        return this.winner === 1 ? this.team1 : this.team2;
    }

    getLoser(): TeamSimulationInfo<any> {
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

export interface TeamSimulationInfo<T extends TeamSimulationInfo<T>> {
    team: Team;
    conference: Conference;
    seed: number;

    simulateGame(this: T, competitor: T, round: MarchMadnessRound): Outcome;
    toFirestore(): Object;
}

interface Outcome {
    winner: number
}

export class TeamEloSimulationInfo implements TeamSimulationInfo<TeamEloSimulationInfo> {
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

    simulateGame(this: TeamEloSimulationInfo, competitor: TeamEloSimulationInfo, round: MarchMadnessRound): Outcome {
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

export class TeamSelectionSimulationInfo implements TeamSimulationInfo<TeamSelectionSimulationInfo> {
    team: Team;
    conference: Conference;
    seed: number;
    selectionOdds: number[];

    constructor(team: Team, conference: Conference, seed: number, selectionOdds: number[]) {
        this.team = team;
        this.conference = conference;
        this.seed = seed;
        this.selectionOdds = selectionOdds;

    }

    simulateGame(this: TeamSelectionSimulationInfo, competitor: TeamSelectionSimulationInfo, round: MarchMadnessRound): Outcome {
        const worker = getMarchMadnessRoundWorker(round);
        const t1odds = this.selectionOdds[worker.roundIdx()];
        const t2odds = competitor.selectionOdds[worker.roundIdx()];
        const totalOdds = t1odds + t2odds;
        if (Math.random() < (t1odds/totalOdds)) {
            return { winner: 1 }
        } else {
            return { winner: 2 }
        }
    }

    toFirestore(): Object {
        return {
            type: 'TeamSelectionSimulationInfo',
            team: this.team,
            conference: this.conference,
            seed: this.seed,
            selectionOdds: this.selectionOdds
        };
    }
}

// Firebase converter Logic
export const teamSimulationInfoConverterLogic = {
  toFireStore: function(teamSimulationInfo: TeamSimulationInfo<any>): Object {
    return teamSimulationInfo.toFirestore();
  },

  fromFireStore: function(document: Object): TeamSimulationInfo<any> {
    const data = document as any;
    switch (data.type) {
        case 'TeamEloSimulationInfo':
            return new TeamEloSimulationInfo(data.team, data.conference, data.seed, data.elo);
        case 'TeamSelectionSimulationInfo':
            return new TeamSelectionSimulationInfo(data.team, data.conference, data.seed, data.selectionOdds)
        default:
            throw new Error('Unknown event type');
    }
  }
}