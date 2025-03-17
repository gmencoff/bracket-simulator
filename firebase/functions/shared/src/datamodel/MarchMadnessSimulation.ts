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

export const getBestBracket = (outcome: MarchMadnessSimulation, brackets: MarchMadnessSimulation[]): MarchMadnessSimulation => {
    let bestBracket = brackets[0];
    let bestScore = 0;
    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const bracketScore = calculateBracketScore(outcome, bracket, bestScore);
        if (bracketScore.beatsCurrentBest) {
            bestBracket = bracket;
            bestScore = bracketScore.score;
        }
    }
    return bestBracket;
}

const pointsUnit = 1;
const pointsPerRound = 32*pointsUnit;

const calculateBracketScore = (outcome: MarchMadnessSimulation, bracket: MarchMadnessSimulation, currentBestScore: number): { score: number, beatsCurrentBest: boolean } => {
    // calculate the bracket score. If it cannot exceed the current best score, stop calculating it and return false for beatsCurrentBest
    const rounds = [MarchMadnessRound.Championship, MarchMadnessRound.FinalFour, MarchMadnessRound.EliteEight, MarchMadnessRound.SweetSixteen, MarchMadnessRound.SecondRound, MarchMadnessRound.FirstRound];
    let score = 0;
    let maxPossible = getMaxRemainingPoints(MarchMadnessRound.Championship);
    for (const round of rounds) {
        const worker = getMarchMadnessRoundWorker(round);
        const pointsPerGame = (2**worker.roundIdx()) * pointsUnit;
        const correctGames = getCorrectGames(outcome, bracket, round);
        const roundScore = correctGames * pointsPerGame;
        const pointsLost = pointsPerRound - roundScore;
        score += roundScore;
        maxPossible -= pointsLost;
        if (maxPossible <= currentBestScore) {
            return { score: score, beatsCurrentBest: false };
        }
    }
    return { score: score, beatsCurrentBest: true };
}

const getMaxRemainingPoints = (round: MarchMadnessRound): number => {
    // Get the maximum available points if we haven't yet calculated the given round
    const worker = getMarchMadnessRoundWorker(round);
    const remainingRounds = worker.roundIdx() + 1;
    return remainingRounds * pointsPerRound;
}

const getCorrectGames = (outcome: MarchMadnessSimulation, bracket: MarchMadnessSimulation, round: MarchMadnessRound): number => {
    const roundWorker = getMarchMadnessRoundWorker(round);
    const actualResults = roundWorker.getSortedRoundResults(outcome);
    const bracketResults = roundWorker.getSortedRoundResults(bracket);
    let correctGames = 0;
    for (let i = 0; i < actualResults.length; i++) {
        const actualConfResults = actualResults[i];
        const bracketConfResults = bracketResults[i];
        for (let j = 0; j < actualConfResults.length; j++) {
            const actualGame = actualConfResults[j];
            const bracketGame = bracketConfResults[j];
            if (actualGame.getWinner().team === bracketGame.getWinner().team) {
                correctGames += 1;
            }
        }
    }
    return correctGames;
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

export class MarchMadnessPoolOutcome implements Simulation {
    actualResult: MarchMadnessSimulation;
    bestBracket: MarchMadnessSimulation;
    tCreated: number;

    constructor(actualResult: MarchMadnessSimulation, bestBracket: MarchMadnessSimulation, tCreated: number = Date.now()) {
        this.actualResult = actualResult;
        this.bestBracket = bestBracket;
        this.tCreated = tCreated;
    }
    
    accept<T, U>(visitor: SimulationVisitor<T, U>, optionalInput?: U): T {
        return visitor.visitMarchMadnessPoolOutcome(this, optionalInput);
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