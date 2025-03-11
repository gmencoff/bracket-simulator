import { TeamEloSimulationInfo, TeamSelectionSimulationInfo, TeamSimulationInfo, teamSimulationInfoConverterLogic } from "../datamodel/MarchMadnessSimulation";
import { MMOpponentBracketSimulationRequest, MMOutcomeSimulationRequest, SimulationRequest } from "../datamodel/SimulationRequest";

export const simulateMMInputFromData = (data: any): SimulateMarchMadnessInput => {
    const teams = data.teams.map((team: Object) => teamSimulationInfoConverterLogic.fromFireStore(team))
    const numTournaments = data.numTournaments as number
    if (data.type === 'SimMMOutcomeIn'){
        return new SimulateMarchMadnessOutcomeInput(teams,numTournaments)
    } else if (data.type === 'SimMMOpponentBracketIn') {
        return new SimulateMarchMadnessOpponentBracketInput(teams,numTournaments)
    } else {
        throw new Error("Do not recognize this input to simulate march madness")
    }
}

export interface SimulateMarchMadnessInput {
    teams: TeamSimulationInfo<any>[]
    numTournaments: number
    getRequest(): SimulationRequest
    data(): any
}

export class SimulateMarchMadnessOutcomeInput implements SimulateMarchMadnessInput {
    teams: TeamEloSimulationInfo[]
    numTournaments: number

    constructor(teams: TeamEloSimulationInfo[], numTournements: number) {
        this.teams = teams;
        this.numTournaments = numTournements;
    }

    getRequest(): SimulationRequest {
        return new MMOutcomeSimulationRequest(this.numTournaments, 0, Date.now(), this.teams);
    }

    data(): any {
        return {
            type: 'SimMMOutcomeIn',
            teams: this.teams.map(team => teamSimulationInfoConverterLogic.toFireStore(team)),
            numTournaments: this.numTournaments
        };
    }
}

export class SimulateMarchMadnessOpponentBracketInput implements SimulateMarchMadnessInput {
    teams: TeamSelectionSimulationInfo[]
    numTournaments: number

    constructor(teams: TeamSelectionSimulationInfo[], numTournements: number) {
        this.teams = teams;
        this.numTournaments = numTournements;
    }

    getRequest(): SimulationRequest {
        return new MMOpponentBracketSimulationRequest(this.numTournaments, 0, Date.now(), this.teams);
    }

    data(): any {
        return {
            type: 'SimMMOpponentBracketIn',
            teams: this.teams.map(team => teamSimulationInfoConverterLogic.toFireStore(team)),
            numTournaments: this.numTournaments
        };
    }
}