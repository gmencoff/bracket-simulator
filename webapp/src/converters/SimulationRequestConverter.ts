import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from "firebase/firestore";
import { SimulationRequest, simulationRequestConverterLogic } from "shared";


export const SimulationRequestConverter: FirestoreDataConverter<SimulationRequest> = {
  toFirestore: function(info: SimulationRequest): DocumentData {
    return simulationRequestConverterLogic.toFireStore(info);
  },
  
  fromFirestore(docSnap: QueryDocumentSnapshot): SimulationRequest {
    const data = docSnap.data() as Object;
    return simulationRequestConverterLogic.fromFireStore(data);
  },
};