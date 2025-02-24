import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Simulation, simulationConverterLogic } from "shared";


export const SimulationConverter: FirestoreDataConverter<Simulation> = {
  toFirestore: function(request: Simulation): DocumentData {
    return simulationConverterLogic.toFireStore(request);
  },
  
  fromFirestore(docSnap: QueryDocumentSnapshot): Simulation {
    const data = docSnap.data() as Object;
    return simulationConverterLogic.fromFireStore(data);
  },
};