import { SimulateMarchMadnessInput } from "./SimulateMarchMadness";
import { CollectionReferenceData } from "../dbreferences/DatabaseReferences";

export class SimulateBatchInput {
    specification: SimulateMarchMadnessInput
    collectionReference: CollectionReferenceData

    constructor(specification: SimulateMarchMadnessInput, collectionReference: CollectionReferenceData) {
        this.specification = specification;
        this.collectionReference = collectionReference;
    }

    data(): any {
        return {
            specification: this.specification.data(),
            collectionReference: this.collectionReference
        };
    }

    static createFromObject(data: any): SimulateBatchInput {
        const teams = SimulateMarchMadnessInput.createFromObject(data.specification)
        const collectionReference = data.collectionReference as CollectionReferenceData
        return new SimulateBatchInput(teams,collectionReference)
    }
}