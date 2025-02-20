// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import { connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDF6XhedLrMHYY7Ms55t56Nhp6sBuJXcMI",
  authDomain: "bracket-simulator-4c62e.firebaseapp.com",
  projectId: "bracket-simulator-4c62e",
  storageBucket: "bracket-simulator-4c62e.firebasestorage.app",
  messagingSenderId: "505785486365",
  appId: "1:505785486365:web:38463e56ac07bd21658af4",
  measurementId: "G-785E2Z7HKZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Use emulators if running on localhost
if (window.location.hostname === "localhost") {
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(firestore,"localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
}

export { app, auth, functions, firestore, storage }