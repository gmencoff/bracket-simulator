import { TeamEloSimulationInfo, TeamSimulationInfo, teamSimulationInfoConverterLogic } from "../datamodel/MarchMadnessSimulation";

export class SimulateMarchMadnessInput {
    teams: TeamSimulationInfo<any>[]
    numTournaments: number

    constructor(teams: TeamSimulationInfo<any>[], numTournements: number) {
        this.teams = teams;
        this.numTournaments = numTournements;
    }

    data(): any {
        return {
            teams: this.teams.map(team => teamSimulationInfoConverterLogic.toFireStore(team)),
            numTournaments: this.numTournaments
        };
    }

    static createFromObject(data: any): SimulateMarchMadnessInput {
        const teams = data.teams.map((team: Object) => teamSimulationInfoConverterLogic.fromFireStore(team))
        const numTournaments = data.numTournaments as number
        return new SimulateMarchMadnessInput(teams,numTournaments)
    }
}