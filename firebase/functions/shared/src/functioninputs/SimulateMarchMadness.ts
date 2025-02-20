import { TeamSimulationInfo } from "../datamodel/Teams";

export class SimulateMarchMadnessInput {
    teams: TeamSimulationInfo[]
    numTournaments: number

    constructor(teams: TeamSimulationInfo[], numTournements: number) {
        this.teams = teams;
        this.numTournaments = numTournements;
    }

    data(): any {
        return {
            teams: this.teams,
            numTournaments: this.numTournaments
        };
    }

    static createFromObject(data: any): SimulateMarchMadnessInput {
        const teams = data.teams as TeamSimulationInfo[]
        const numTournaments = data.numTournaments as number
        return new SimulateMarchMadnessInput(teams,numTournaments)
    }
}