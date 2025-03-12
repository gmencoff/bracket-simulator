import { SimulationRequest, simulationRequestConverterLogic } from "../datamodel/SimulationRequest";

export class SimulateMarchMadnessInput {
    request: SimulationRequest

    constructor(request: SimulationRequest) {
        this.request = request;
    }

    data(): any {
        return {
            request: simulationRequestConverterLogic.toFireStore(this.request)
        }
    }

    static createFromObject(data: any): SimulateMarchMadnessInput {
        return new SimulateMarchMadnessInput(simulationRequestConverterLogic.fromFireStore(data.request));
    }
}