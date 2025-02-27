import { DocumentReferenceData } from "../dbreferences/DatabaseReferences";

export class SimulationComplete {
    documentReference: DocumentReferenceData

    constructor(documentReference: DocumentReferenceData) {
        this.documentReference = documentReference;
    }

    data(): any {
        return {
            documentReference: this.documentReference
        };
    }

    static createFromObject(data: any): SimulationComplete {
        const documentReference = data.documentReference as DocumentReferenceData
        return new SimulationComplete(documentReference)
    }
}