import { TeamEloSimulationInfo } from "./MarchMadnessSimulation";
import { StorageReferenceData } from "../dbreferences/DatabaseReferences";
import { TeamSimulationInfo, teamSimulationInfoConverterLogic } from "./MarchMadnessSimulation";

export interface SimulationRequestVisitor<T, U> {
    visitMarchMadnessSimRequest(req: MarchMadnessSimulationRequest, optionalInput?: U): T;
}

export interface SimulationRequest {
    requestTime: number;
    storageReferenceData: StorageReferenceData | null;
    isComplete(): boolean;
    accept<T,U>(visitor: SimulationRequestVisitor<T,U>, optionalInput?: U): T;
}

export class MarchMadnessSimulationRequest implements SimulationRequest {
    requestedSimulations: number;
    completedSimulations: number;
    requestTime: number;
    teamInfo: TeamEloSimulationInfo[];
    storageReferenceData: StorageReferenceData | null;

    constructor(requestedSimulations: number, completedSimulations: number, requestTime: number, teamInfo: TeamEloSimulationInfo[], storageReferenceData?: StorageReferenceData) {
        this.requestedSimulations = requestedSimulations;
        this.completedSimulations = completedSimulations;
        this.requestTime = requestTime;
        this.teamInfo = teamInfo;
        if (storageReferenceData) {
            this.storageReferenceData = storageReferenceData;
        } else {
            this.storageReferenceData = null;
        }
    }

    isComplete(): boolean {
        return this.completedSimulations >= this.requestedSimulations;
    }

    accept<T, U>(visitor: SimulationRequestVisitor<T, U>, optionalInput?: U): T {
        return visitor.visitMarchMadnessSimRequest(this, optionalInput);
    }
}

// Firebase converter Logic
export const simulationRequestConverterLogic = {
  toFireStore: function(simulationRequest: SimulationRequest): Object {
    const converter = new RequestConverter();
    return simulationRequest.accept(converter);
  },

  fromFireStore: function(document: Object): SimulationRequest {
    const converter = new RequestConverter();
    return converter.toEvent(document);
  }
}

class RequestConverter implements SimulationRequestVisitor<Object, null> {
    
    visitMarchMadnessSimRequest(req: MarchMadnessSimulationRequest, optionalInput?: null | undefined): Object {
        return {
            type: 'SimMarchMadness',
            requestedSimulations: req.requestedSimulations,
            completedSimulations: req.completedSimulations,
            requestTime: req.requestTime,
            teamInfo: req.teamInfo.map(ti => teamSimulationInfoConverterLogic.toFireStore(ti)),
            storageReferenceData: req.storageReferenceData
        };
    }
    
    toEvent(event: any): SimulationRequest {
        switch (event.type) {
            case 'SimMarchMadness':
                return new MarchMadnessSimulationRequest(event.requestedSimulations, event.completedSimulations, event.requestTime, event.teamInfo.map((ti: Object) => teamSimulationInfoConverterLogic.fromFireStore(ti)), event.storageReferenceData);
            default:
                throw new Error('Unknown event type');
        }
    }
}
