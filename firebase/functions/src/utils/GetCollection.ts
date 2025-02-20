import * as admin from 'firebase-admin';
import { CollectionReference, DocumentReference } from 'firebase-admin/firestore';
import { CollectionReferenceData, DocumentReferenceData } from "shared"

export const getCollection = function (collectionRef: CollectionReferenceData): CollectionReference {
    if (collectionRef.documentReference) {
        const parentDoc = getDocument(collectionRef.documentReference);
        return parentDoc.collection(collectionRef.collectionId)
    } else {
        return admin.firestore().collection(collectionRef.collectionId)
    }
}

export const getDocument = function (documentRef: DocumentReferenceData): DocumentReference {
    const parentCollection = getCollection(documentRef.collectionReference);
    return parentCollection.doc(documentRef.documentId)
}