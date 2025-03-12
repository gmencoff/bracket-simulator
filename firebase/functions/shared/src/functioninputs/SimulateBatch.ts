import { DocumentReferenceData } from "../dbreferences/DatabaseReferences";
import { TeamSimulationInfo, teamSimulationInfoConverterLogic } from "../datamodel/MarchMadnessSimulation";

export class SimulateBatchInput {
    requestedSimulations: number
    teamInfo: TeamSimulationInfo<any>[]
    documentReference: DocumentReferenceData

    constructor(requestedSimulations: number, teamInfo: TeamSimulationInfo<any>[], documentReference: DocumentReferenceData) {
        this.requestedSimulations = requestedSimulations;
        this.teamInfo = teamInfo;
        this.documentReference = documentReference;
    }

    data(): any {
        return {
            requestedSimulations: this.requestedSimulations,
            teamInfo: this.teamInfo.map(ti => teamSimulationInfoConverterLogic.toFireStore(ti)),
            documentReference: this.documentReference
        };
    }

    static createFromObject(data: any): SimulateBatchInput {
        const requestedSimulations = data.requestedSimulations as number;
        const teamInfo = data.teamInfo.map((ti: Object) => teamSimulationInfoConverterLogic.fromFireStore(ti));
        const documentReference = data.documentReference as DocumentReferenceData;
        return new SimulateBatchInput(requestedSimulations,teamInfo,documentReference);
    }
}