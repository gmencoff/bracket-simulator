import { SimulateMarchMadnessInput } from "./SimulateMarchMadness";
import { DocumentReferenceData } from "../dbreferences/DatabaseReferences";

export class SimulateBatchInput {
    specification: SimulateMarchMadnessInput
    documentReference: DocumentReferenceData

    constructor(specification: SimulateMarchMadnessInput, documentReference: DocumentReferenceData) {
        this.specification = specification;
        this.documentReference = documentReference;
    }

    data(): any {
        return {
            specification: this.specification.data(),
            documentReference: this.documentReference
        };
    }

    static createFromObject(data: any): SimulateBatchInput {
        const teams = SimulateMarchMadnessInput.createFromObject(data.specification)
        const documentReference = data.documentReference as DocumentReferenceData
        return new SimulateBatchInput(teams,documentReference)
    }
}