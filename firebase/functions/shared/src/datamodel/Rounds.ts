import { Conference } from "./Conference";
import { GameResult, MarchMadnessSimulation, TeamSimulationInfo } from "./MarchMadnessSimulation";

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
    simulateRound: (lastRound: GameResult[], teamInfo: TeamSimulationInfo<any>[]) => GameResult[];
    remainingTeams(): number;
    roundIdx(): number
    getSortedRoundResults: (sim: MarchMadnessSimulation) => GameResult[][];
}

class FirstRoundWorker implements RoundWorker {
    simulateRound(lastRound: GameResult[], teamInfo: TeamSimulationInfo<any>[]): GameResult[] {
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
    simulateRound(lastRound: GameResult[], teamInfo: TeamSimulationInfo<any>[]): GameResult[] {
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
    simulateRound(lastRound: GameResult[], teamInfo: TeamSimulationInfo<any>[]): GameResult[] {
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
    simulateRound(lastRound: GameResult[], teamInfo: TeamSimulationInfo<any>[]): GameResult[] {
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
    simulateRound(currentResults: GameResult[], teamInfo: TeamSimulationInfo<any>[]): GameResult[] {
        const results: GameResult[] = [];
        const eastWinner = currentResults.filter(result => result.gameInfo.conference === Conference.East)[0].getWinner();
        const westWinner = currentResults.filter(result => result.gameInfo.conference === Conference.West)[0].getWinner();
        const southWinner = currentResults.filter(result => result.gameInfo.conference === Conference.South)[0].getWinner();
        const midwestWinner = currentResults.filter(result => result.gameInfo.conference === Conference.Midwest)[0].getWinner();
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
    simulateRound(currentResults: GameResult[], teamInfo: TeamSimulationInfo<any>[]): GameResult[] {
        const winner1 = currentResults[0].getWinner();
        const winner2 = currentResults[1].getWinner();
        const champ = winner1.simulateGame(winner2,MarchMadnessRound.Championship).winner;
        const finalGame = new GameResult(winner1,winner2,champ,{round: MarchMadnessRound.Championship, gameNumber: 1});
        return [finalGame];
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