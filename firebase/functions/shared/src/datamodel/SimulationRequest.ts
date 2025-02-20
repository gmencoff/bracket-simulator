import { TeamSimulationInfo } from "./Teams";
import { StorageReferenceData } from "../dbreferences/DatabaseReferences";

export interface SimulationRequestVisitor<T, U> {
    visitMarchMadnessSimRequest(req: MarchMadnessSimulationRequest, optionalInput?: U): T;
}

export interface SimulationRequest {
    requestTime: number;
    storageReferenceData: StorageReferenceData | null;
    accept<T,U>(visitor: SimulationRequestVisitor<T,U>, optionalInput?: U): T;
}

export class MarchMadnessSimulationRequest implements SimulationRequest {
    requestedSimulations: number;
    completedSimulations: number;
    requestTime: number;
    teamInfo: TeamSimulationInfo[];
    storageReferenceData: StorageReferenceData | null;

    constructor(requestedSimulations: number, completedSimulations: number, requestTime: number, teamInfo: TeamSimulationInfo[], storageReferenceData?: StorageReferenceData) {
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
            teamInfo: req.teamInfo,
            storageReferenceData: req.storageReferenceData
        };
    }
    
    toEvent(event: any): SimulationRequest {
        switch (event.type) {
            case 'SimMarchMadness':
                return new MarchMadnessSimulationRequest(event.requestedSimulations, event.completedSimulations, event.requestTime, event.teamInfo, event.storageReferenceData);
            default:
                throw new Error('Unknown event type');
        }
    }
}
