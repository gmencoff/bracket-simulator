import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { SimulationRequest, simulationRequestConverterLogic } from "shared";


export const SimulationRequestConverter: FirestoreDataConverter<SimulationRequest> = {
  toFirestore: function(request: SimulationRequest): DocumentData {
    return simulationRequestConverterLogic.toFireStore(request);
  },
  
  fromFirestore(docSnap: QueryDocumentSnapshot): SimulationRequest {
    const data = docSnap.data() as Object;
    return simulationRequestConverterLogic.fromFireStore(data);
  },
};