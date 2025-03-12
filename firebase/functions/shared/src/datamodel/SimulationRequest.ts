import { StorageReferenceData } from "../dbreferences/DatabaseReferences";
import { TeamEloSimulationInfo, TeamSelectionSimulationInfo, TeamSimulationInfo, teamSimulationInfoConverterLogic } from "./MarchMadnessSimulation";

export interface SimulationRequestVisitor<T, U> {
    visitMMOutcomeSimulationRequest(req: MMOutcomeSimulationRequest, optionalInput?: U): T;
    visitMMOpponentBracketSimulationRequest(req: MMOpponentBracketSimulationRequest, optionalInput?: U): T
}

export interface SimulationRequest {
    requestTime: number;
    storageReferenceData: StorageReferenceData | null;
    isComplete(): boolean;
    accept<T,U>(visitor: SimulationRequestVisitor<T,U>, optionalInput?: U): T;
}

export class MMOutcomeSimulationRequest implements SimulationRequest {
    requestedSimulations: number;
    completedSimulations: number;
    requestTime: number;
    teamInfo: TeamEloSimulationInfo[];
    storageReferenceData: StorageReferenceData | null;

    constructor(requestedSimulations: number, teamInfo: TeamEloSimulationInfo[], completedSimulations: number = 0, requestTime: number = Date.now(), storageReferenceData: StorageReferenceData | null = null) {
        this.requestedSimulations = requestedSimulations;
        this.teamInfo = teamInfo;
        this.completedSimulations = completedSimulations;
        this.requestTime = requestTime;
        this.storageReferenceData = storageReferenceData;
    }

    isComplete(): boolean {
        return this.completedSimulations >= this.requestedSimulations;
    }

    accept<T, U>(visitor: SimulationRequestVisitor<T, U>, optionalInput?: U): T {
        return visitor.visitMMOutcomeSimulationRequest(this, optionalInput);
    }
}

export class MMOpponentBracketSimulationRequest implements SimulationRequest {
    requestedSimulations: number;
    completedSimulations: number;
    requestTime: number;
    teamInfo: TeamSelectionSimulationInfo[];
    storageReferenceData: StorageReferenceData | null;

    constructor(requestedSimulations: number, teamInfo: TeamSelectionSimulationInfo[], completedSimulations: number = 0, requestTime: number = Date.now(), storageReferenceData: StorageReferenceData | null = null) {
        this.requestedSimulations = requestedSimulations;
        this.teamInfo = teamInfo;
        this.completedSimulations = completedSimulations;
        this.requestTime = requestTime;
        this.storageReferenceData = storageReferenceData;
    }

    isComplete(): boolean {
        return this.completedSimulations >= this.requestedSimulations;
    }

    accept<T, U>(visitor: SimulationRequestVisitor<T, U>, optionalInput?: U): T {
        return visitor.visitMMOpponentBracketSimulationRequest(this, optionalInput);
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
    visitMMOutcomeSimulationRequest(req: MMOutcomeSimulationRequest, optionalInput?: null | undefined): Object {
        return {
            type: 'SimMarchMadnessOutcomes',
            requestedSimulations: req.requestedSimulations,
            completedSimulations: req.completedSimulations,
            requestTime: req.requestTime,
            teamInfo: req.teamInfo.map(ti => teamSimulationInfoConverterLogic.toFireStore(ti)),
            storageReferenceData: req.storageReferenceData
        };
    }
    
    visitMMOpponentBracketSimulationRequest(req: MMOpponentBracketSimulationRequest, optionalInput?: null | undefined): Object {
        return {
            type: 'SimMarchMadnessOpponentBracket',
            requestedSimulations: req.requestedSimulations,
            completedSimulations: req.completedSimulations,
            requestTime: req.requestTime,
            teamInfo: req.teamInfo.map(ti => teamSimulationInfoConverterLogic.toFireStore(ti)),
            storageReferenceData: req.storageReferenceData
        };
    }
    
    toEvent(event: any): SimulationRequest {
        switch (event.type) {
            case 'SimMarchMadnessOutcomes':
                return new MMOutcomeSimulationRequest(event.requestedSimulations, event.teamInfo.map((ti: Object) => teamSimulationInfoConverterLogic.fromFireStore(ti)), event.completedSimulations, event.requestTime, event.storageReferenceData);
            case 'SimMarchMadnessOpponentBracket':
                return new MMOpponentBracketSimulationRequest(event.requestedSimulations, event.teamInfo.map((ti: Object) => teamSimulationInfoConverterLogic.fromFireStore(ti)), event.completedSimulations, event.requestTime, event.storageReferenceData);
            default:
                throw new Error('Unknown event type');
        }
    }
}
