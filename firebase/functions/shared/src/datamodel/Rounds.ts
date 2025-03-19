import { Conference } from "./Conference";
import { GameResult, MarchMadnessSimulation, TeamEloSimulationInfo, TeamSimulationInfo, TeamSelectionSimulationInfo, GameInformation } from "./MarchMadnessSimulation";

export enum MarchMadnessRound {
    FirstRound = 'First Round',
    SecondRound = 'Second Round',
    SweetSixteen = 'Sweet Sixteen',
    EliteEight = 'Elite Eight',
    FinalFour = 'Final Four',
    Championship = 'Championship'
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

interface RoundWorker {
    simulateRoundForward: (lastRound: GameResult[], teamInfo: TeamEloSimulationInfo[]) => GameResult[];
    simulateRoundBackward: (nextRound: GameResult[], teamInfo: TeamSelectionSimulationInfo[]) => GameResult[];
    getPotentialOpponents: (team: TeamSelectionSimulationInfo, teamInfo: TeamSelectionSimulationInfo[]) => TeamSelectionSimulationInfo[];
    getGameInfo: (gameNumber: number, confernece: Conference) => GameInformation;
    remainingTeams(): number;
    roundIdx(): number
    getSortedRoundResults: (sim: MarchMadnessSimulation) => GameResult[][];
}

class FirstRoundWorker implements RoundWorker {
    getGameInfo(gameNumber: number, conference: Conference): GameInformation {
        return { round: MarchMadnessRound.FirstRound, gameNumber: gameNumber, conference: conference };
    }

    getPotentialOpponents(team: TeamSelectionSimulationInfo, teamInfo: TeamSelectionSimulationInfo[]): TeamSelectionSimulationInfo[] {
        const confteams = teamInfo.filter(info => info.conference === team.conference);
        const oppSeeds = this.getMatchups(team.seed)
        return confteams.filter(info => oppSeeds.includes(info.seed));
    }

    getMatchups(seed: number): number[] {
        const matchups: Record<number, number[]> = {
            1: [16], 2: [15], 3: [14], 4: [13],
            5: [12], 6: [11], 7: [10], 8: [9],
            9: [8], 10: [7], 11: [6], 12: [5],
            13: [4], 14: [3], 15: [2], 16: [1]
        };
        return matchups[seed];
    }
    
    simulateRoundBackward(nextRound: GameResult[], teamInfo: TeamSelectionSimulationInfo[]): GameResult[] {
        return simulateRoundBackwards(this,nextRound,teamInfo);
    }

    simulateRoundForward(lastRound: GameResult[], teamInfo: TeamEloSimulationInfo[]): GameResult[] {
        const results: GameResult[] = [];
        const conferences = new Set(teamInfo.map(info => info.conference));
        const nTeams = 16;

        conferences.forEach(conference => {
            const teams = teamInfo.filter(info => info.conference === conference);
            teams.sort((a, b) => a.seed - b.seed);

            for (let i = 0; i < nTeams / 2; i++) {
                const team1 = teams[i];
                const team2 = teams[nTeams - 1 - i];
                const winner = team1.simulateGame(team2,MarchMadnessRound.FirstRound).winner;
                results.push(new GameResult(team1, team2, winner, { round: MarchMadnessRound.FirstRound, gameNumber: i + 1, conference: conference }));
            }
        });

        return results;
    }

    remainingTeams(): number {
        return 64;
    }

    roundIdx(): number {
        return 0;
    }

    getSortedRoundResults(sim: MarchMadnessSimulation): GameResult[][] {
        return conferenceSortedGames(sim.round1);
    }
}

class SecondRoundWorker implements RoundWorker {
    getGameInfo(gameNumber: number, conference: Conference): GameInformation {
        return { round: MarchMadnessRound.SecondRound, gameNumber: gameNumber, conference: conference };
    }

    getPotentialOpponents(team: TeamSelectionSimulationInfo, teamInfo: TeamSelectionSimulationInfo[]): TeamSelectionSimulationInfo[] {
        const confteams = teamInfo.filter(info => info.conference === team.conference);
        const oppSeeds = this.getMatchups(team.seed);
        return confteams.filter(info => oppSeeds.includes(info.seed));
    }

    getMatchups(seed: number): number[] {
        const matchups: Record<number, number[]> = {
            1: [8,9], 2: [7,10], 3: [6,11], 4: [5,12],
            5: [4,13], 6: [3,14], 7: [2,15], 8: [1,16],
            9: [1,16], 10: [2,15], 11: [3,14], 12: [4,13],
            13: [5,12], 14: [6,11], 15: [7,10], 16: [8,9]
        };
        return matchups[seed];
    }

    simulateRoundBackward(nextRound: GameResult[], teamInfo: TeamSelectionSimulationInfo[]): GameResult[] {
        return simulateRoundBackwards(this,nextRound,teamInfo);
    }

    simulateRoundForward(lastRound: GameResult[], teamInfo: TeamEloSimulationInfo[]): GameResult[] {
        return conferenceGameSimulator(lastRound, MarchMadnessRound.SecondRound);
    }

    remainingTeams(): number {
        return 32;
    }

    roundIdx(): number {
        return 1;
    }

    getSortedRoundResults(sim: MarchMadnessSimulation): GameResult[][] {
        return conferenceSortedGames(sim.round2);
    }
}

class SweetSixteenWorker implements RoundWorker {
    getGameInfo(gameNumber: number, conference: Conference): GameInformation {
        return { round: MarchMadnessRound.SweetSixteen, gameNumber: gameNumber, conference: conference };
    }

    getPotentialOpponents(team: TeamSelectionSimulationInfo, teamInfo: TeamSelectionSimulationInfo[]): TeamSelectionSimulationInfo[] {
        const confteams = teamInfo.filter(info => info.conference === team.conference);
        const oppSeeds = this.getMatchups(team.seed)
        return confteams.filter(info => oppSeeds.includes(info.seed));
    }

    getMatchups(seed: number): number[] {
        const matchups: Record<number, number[]> = {
            1: [4,5,12,13], 2: [3,6,11,14], 3: [2,7,10,15], 4: [1,8,9,16],
            5: [1,8,9,16], 6: [2,7,10,15], 7: [3,6,11,14], 8: [4,5,12,13],
            9: [4,5,12,13], 10: [3,6,11,14], 11: [2,7,10,15], 12: [1,8,9,16],
            13: [1,8,9,16], 14: [2,7,10,15], 15: [3,6,11,14], 16: [4,5,12,13]
        };
        return matchups[seed];
    }

    simulateRoundBackward(nextRound: GameResult[], teamInfo: TeamSelectionSimulationInfo[]): GameResult[] {
        return simulateRoundBackwards(this,nextRound,teamInfo);
    }

    simulateRoundForward(lastRound: GameResult[], teamInfo: TeamEloSimulationInfo[]): GameResult[] {
        return conferenceGameSimulator(lastRound, MarchMadnessRound.SweetSixteen);
    }

    remainingTeams(): number {
        return 16;
    }

    roundIdx(): number {
        return 2;
    }

    getSortedRoundResults(sim: MarchMadnessSimulation): GameResult[][] {
        return conferenceSortedGames(sim.sweet16);
    }
}

class EliteEightWorker implements RoundWorker {
    getGameInfo(gameNumber: number, conference: Conference): GameInformation {
        return { round: MarchMadnessRound.EliteEight, gameNumber: gameNumber, conference: conference };
    }

    getPotentialOpponents(team: TeamSelectionSimulationInfo, teamInfo: TeamSelectionSimulationInfo[]): TeamSelectionSimulationInfo[] {
        const confteams = teamInfo.filter(info => info.conference === team.conference);
        const oppSeeds = this.getMatchups(team.seed)
        return confteams.filter(info => oppSeeds.includes(info.seed));
    }

    getMatchups(seed: number): number[] {
        const matchups: Record<number, number[]> = {
            1: [2,3,6,7,10,11,14,15], 2: [1,4,5,8,9,12,13,16],
            3: [1,4,5,8,9,12,13,16], 4: [2,3,6,7,10,11,14,15],
            5: [2,3,6,7,10,11,14,15], 6: [1,4,5,8,9,12,13,16],
            7: [1,4,5,8,9,12,13,16], 8: [2,3,6,7,10,11,14,15],
            9: [2,3,6,7,10,11,14,15], 10: [1,4,5,8,9,12,13,16],
            11: [1,4,5,8,9,12,13,16], 12: [2,3,6,7,10,11,14,15],
            13: [2,3,6,7,10,11,14,15], 14: [1,4,5,8,9,12,13,16],
            15: [1,4,5,8,9,12,13,16], 16: [2,3,6,7,10,11,14,15]
        }
        return matchups[seed];
    }

    simulateRoundBackward(nextRound: GameResult[], teamInfo: TeamSelectionSimulationInfo[]): GameResult[] {
        return simulateRoundBackwards(this,nextRound,teamInfo);
    }

    simulateRoundForward(lastRound: GameResult[], teamInfo: TeamEloSimulationInfo[]): GameResult[]  {
        return conferenceGameSimulator(lastRound, MarchMadnessRound.EliteEight);
    }

    remainingTeams(): number {
        return 8;
    }

    roundIdx(): number {
        return 3;
    }

    getSortedRoundResults(sim: MarchMadnessSimulation): GameResult[][] {
        return conferenceSortedGames(sim.elite8);
    }
}

class FinalFourWorker implements RoundWorker {
    getGameInfo(gameNumber: number, conference: Conference): GameInformation {
        return { round: MarchMadnessRound.FinalFour, gameNumber: gameNumber };
    }

    simulateRoundBackward(nextRound: GameResult[], teamInfo: TeamSelectionSimulationInfo[]): GameResult[] {
        return simulateRoundBackwards(this,nextRound,teamInfo);
    }

    getPotentialOpponents(team: TeamSelectionSimulationInfo, teamInfo: TeamSelectionSimulationInfo[]): TeamSelectionSimulationInfo[] {
        if (team.conference === Conference.East) {
            return teamInfo.filter(info => info.conference === Conference.Midwest);
        } else if (team.conference === Conference.Midwest) {
            return teamInfo.filter(info => info.conference === Conference.East);
        } else if (team.conference === Conference.South) {
            return teamInfo.filter(info => info.conference === Conference.West);
        } else {
            return teamInfo.filter(info => info.conference === Conference.South);
        }
    }

    simulateRoundForward(lastRound: GameResult[], teamInfo: TeamEloSimulationInfo[]): GameResult[]  {
        const results: GameResult[] = [];
        const eastWinner = lastRound.filter(result => result.gameInfo.conference === Conference.East)[0].getWinner() as TeamEloSimulationInfo;
        const westWinner = lastRound.filter(result => result.gameInfo.conference === Conference.West)[0].getWinner() as TeamEloSimulationInfo;
        const southWinner = lastRound.filter(result => result.gameInfo.conference === Conference.South)[0].getWinner() as TeamEloSimulationInfo;
        const midwestWinner = lastRound.filter(result => result.gameInfo.conference === Conference.Midwest)[0].getWinner() as TeamEloSimulationInfo;
        const eastWestGame = new GameResult(eastWinner, westWinner, eastWinner.simulateGame(westWinner,MarchMadnessRound.FinalFour).winner, { round: MarchMadnessRound.FinalFour, gameNumber: 1 });
        const southMidwestGame = new GameResult(southWinner, midwestWinner, southWinner.simulateGame(midwestWinner,MarchMadnessRound.FinalFour).winner, { round: MarchMadnessRound.FinalFour, gameNumber: 2 });
        results.push(eastWestGame, southMidwestGame);
        return results;
    }

    remainingTeams(): number {
        return 4;
    }

    roundIdx(): number {
        return 4;
    }

    getSortedRoundResults(sim: MarchMadnessSimulation): GameResult[][] {
        return [sim.final4.sort((a,b) => a.gameInfo.gameNumber - b.gameInfo.gameNumber)];
    }
}

class ChampionshipWorker implements RoundWorker {
    getGameInfo(gameNumber: number, conference: Conference): GameInformation {
        return { round: MarchMadnessRound.Championship, gameNumber: gameNumber };
    }
    
    simulateRoundForward(lastRound: GameResult[], teamInfo: TeamEloSimulationInfo[]): GameResult[]  {
        const winner1 = lastRound[0].getWinner() as TeamEloSimulationInfo;
        const winner2 = lastRound[1].getWinner() as TeamEloSimulationInfo;
        const champ = winner1.simulateGame(winner2,MarchMadnessRound.Championship).winner;
        const finalGame = new GameResult(winner1,winner2,champ,{round: MarchMadnessRound.Championship, gameNumber: 1});
        return [finalGame];
    }

    simulateRoundBackward(nextRound: GameResult[], teamInfo: TeamSelectionSimulationInfo[]): GameResult[] {
        // Get champion
        const champprobs = teamInfo.map(info => info.selectionOdds[this.roundIdx()]);
        const champIdx = getWinnerIndex(champprobs);
        const champ = teamInfo[champIdx];

        // Get championship loser
        const finalslosers = this.getPotentialOpponents(champ,teamInfo);
        const finalslosersprobs = finalslosers.map(info => info.selectionOdds[this.roundIdx()-1]);
        const loserIdx = getWinnerIndex(finalslosersprobs);
        const loser = finalslosers[loserIdx];

        const finalGame = new GameResult(champ,loser,1,{round: MarchMadnessRound.Championship, gameNumber: 1});
        return [finalGame];
    }

    getPotentialOpponents(team: TeamSelectionSimulationInfo, teamInfo: TeamSelectionSimulationInfo[]): TeamSelectionSimulationInfo[] {
        if (team.conference === Conference.East || team.conference === Conference.Midwest) {
            return teamInfo.filter(info => info.conference === Conference.West || info.conference === Conference.South);
        } else {
            return teamInfo.filter(info => info.conference === Conference.East || info.conference === Conference.Midwest);
        }
    }

    remainingTeams(): number {
        return 2;
    }

    roundIdx(): number {
        return 5;
    }

    getSortedRoundResults(sim: MarchMadnessSimulation): GameResult[][] {
        return [sim.championship];
    }
}

const getWinnerIndex = (allprobs: number[]): number => {
    let sum = 0;
    const cdf = allprobs.map(num => sum += num);
    const lastcdf = cdf[cdf.length - 1];
    const rand = Math.random();
    const randnorm = rand * lastcdf;
    for (let i = 0; i < cdf.length; i++) {
        if (cdf[i] >= randnorm) {
            return i;
        }
    }
    return cdf.length - 1;
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
            const winner1 = game1.getWinner() as TeamEloSimulationInfo;
            const winner2 = game2.getWinner() as TeamEloSimulationInfo;
            const outcome = winner1.simulateGame(winner2,round);
            results.push(new GameResult(winner1,winner2,outcome.winner,{ round: round, gameNumber: i + 1, conference: conference }))
        }
    });

    return results;
}

const conferenceSortedGames = (games: GameResult[]): GameResult[][] => {
    const conferences = new Set(games.map(game => game.gameInfo.conference));
    const sortedGames: GameResult[][] = [];
    conferences.forEach(conference => {
        const conferenceGames = games.filter(game => game.gameInfo.conference === conference).sort((a,b) => a.gameInfo.gameNumber - b.gameInfo.gameNumber);
        sortedGames.push(conferenceGames);
    });
    return sortedGames;
}

const simulateRoundBackwards = (roundWorker: RoundWorker, nextRound: GameResult[], teamInfo: TeamSelectionSimulationInfo[]): GameResult[] => {
    const results: GameResult[] = [];
    let gameNum = 0;
    for (let i = 0; i < nextRound.length; i++) {
        // For each result, create two games, one from winner and one from loser of next rounds game, who both won this round
        const g1winner = nextRound[i].getWinner() as TeamSelectionSimulationInfo;
        const g1loser = getGameLoser(roundWorker,g1winner,teamInfo);
        const game1 = new GameResult(g1winner,g1loser,1,roundWorker.getGameInfo(gameNum,g1winner.conference));
        results.push(game1);
        
        const g2winner = nextRound[i].getLoser() as TeamSelectionSimulationInfo;
        const g2loser = getGameLoser(roundWorker,g2winner,teamInfo);
        const game2 = new GameResult(g2winner,g2loser,1,roundWorker.getGameInfo(gameNum + 1,g1winner.conference));
        results.push(game2);

        // Advance gameNum by 2
        gameNum += 2;
    }
    return results;
}

const getGameLoser = (roundWorker: RoundWorker, gameWinner: TeamSelectionSimulationInfo, teamInfo: TeamSelectionSimulationInfo[]): TeamSelectionSimulationInfo => {
    const g1opponents = roundWorker.getPotentialOpponents(gameWinner,teamInfo);
    const prevRoundIdx = roundWorker.roundIdx() - 1;
    let g1loser: TeamSelectionSimulationInfo;
    if (prevRoundIdx < 0) {
            g1loser = g1opponents[0];
    } else {
        const g1OpponentProb = g1opponents.map(info => info.selectionOdds[prevRoundIdx]);
        const g1loserIdx = getWinnerIndex(g1OpponentProb);
        g1loser = g1opponents[g1loserIdx];
    }
    return g1loser;
}