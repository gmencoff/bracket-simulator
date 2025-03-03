import { gameResultConverterLogic, MarchMadnessSimulation } from "./MarchMadnessSimulation";

export interface Simulation {
    tCreated: number
    accept<T,U>(visitor: SimulationVisitor<T,U>, optionalInput?: U): T;
}

export interface SimulationVisitor<T, U> {
    visitMarchMadnessSimulation(req: MarchMadnessSimulation, optionalInput?: U): T;
}

// Firebase converter Logic
export const simulationConverterLogic = {
  toFireStore: function(simulationRequest: Simulation): Object {
    const converter = new SimulationConverter();
    return simulationRequest.accept(converter);
  },

  fromFireStore: function(document: Object): Simulation {
    const converter = new SimulationConverter();
    return converter.fromDocument(document);
  }
}

class SimulationConverter implements SimulationVisitor<Object, null> {
    
    visitMarchMadnessSimulation(req: MarchMadnessSimulation, optionalInput?: null | undefined): Object {
        return {
            type: 'MarchMadnessSimulation',
            round1: req.round1.map(game => gameResultConverterLogic.toFireStore(game)),
            round2: req.round2.map(game => gameResultConverterLogic.toFireStore(game)),
            sweet16: req.sweet16.map(game => gameResultConverterLogic.toFireStore(game)),
            elite8: req.elite8.map(game => gameResultConverterLogic.toFireStore(game)),
            final4: req.final4.map(game => gameResultConverterLogic.toFireStore(game)),
            championship: req.championship.map(game => gameResultConverterLogic.toFireStore(game)),
            tCreated: req.tCreated
        };
    }
    
    fromDocument(event: any): Simulation {
        switch (event.type) {
            case 'MarchMadnessSimulation':
                return new MarchMadnessSimulation(
                event.round1.map((game: Object) => gameResultConverterLogic.fromFireStore(game)),
                event.round2.map((game: Object) => gameResultConverterLogic.fromFireStore(game)),
                event.sweet16.map((game: Object) => gameResultConverterLogic.fromFireStore(game)),
                event.elite8.map((game: Object) => gameResultConverterLogic.fromFireStore(game)),
                event.final4.map((game: Object) => gameResultConverterLogic.fromFireStore(game)),
                event.championship.map((game: Object) => gameResultConverterLogic.fromFireStore(game)),
                event.tCreated
            );
            default:
                throw new Error('Unknown event type');
        }
    }
}

export { MarchMadnessSimulation };

