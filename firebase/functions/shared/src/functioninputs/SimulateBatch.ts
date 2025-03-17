import { DocumentReferenceData } from "../dbreferences/DatabaseReferences";
import { TeamSimulationInfo, teamSimulationInfoConverterLogic } from "../datamodel/MarchMadnessSimulation";

export class SimulateBatchInput {
    documentReference: DocumentReferenceData

    constructor(documentReference: DocumentReferenceData) {
        this.documentReference = documentReference;
    }

    data(): any {
        return {
            documentReference: this.documentReference
        };
    }

    static createFromObject(data: any): SimulateBatchInput {
        const documentReference = data.documentReference as DocumentReferenceData;
        return new SimulateBatchInput(documentReference);
    }
}