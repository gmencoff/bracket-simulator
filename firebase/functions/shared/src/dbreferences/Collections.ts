import { CollectionReferenceData } from "./DatabaseReferences"

export const COLLECTIONS = {
    SimulationRequests: "SimulationRequests",
}

export const getSimulationRequests = function(uid: string): CollectionReferenceData {
    const topref: CollectionReferenceData = {
        collectionId: COLLECTIONS.SimulationRequests
    }
    const childref: CollectionReferenceData = {
        collectionId: COLLECTIONS.SimulationRequests,
        documentReference: {
            documentId: uid,
            collectionReference: topref
        }
    }
    return childref
}