import { collection, CollectionReference, doc, DocumentReference } from "firebase/firestore";
import { firestore } from "./firebase";
import { CollectionReferenceData, DocumentReferenceData } from "shared"

// }
export const getCollection = function (collectionRef: CollectionReferenceData): CollectionReference {
    if (collectionRef.documentReference) {
        const parentDoc = getDocument(collectionRef.documentReference);
        return collection(parentDoc, collectionRef.collectionId)
    } else {
        return collection(firestore, collectionRef.collectionId)
    }
}

export const getDocument = function (documentRef: DocumentReferenceData): DocumentReference {
    const parentCollection = getCollection(documentRef.collectionReference);
    return doc(parentCollection, documentRef.documentId)
}