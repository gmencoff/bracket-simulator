export interface StorageReferenceData {
    bucket: string
    fullPath: string
}

export interface DocumentReferenceData {
    documentId: string
    collectionReference: CollectionReferenceData
}

export interface CollectionReferenceData {
    collectionId: string
    documentReference?: DocumentReferenceData
}