import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAGUwHCTWdfsX8v7t3mWTOwC6RbPAWyTo",
  authDomain: "todolist-2dece.firebaseapp.com",
  projectId: "todolist-2dece",
  storageBucket: "todolist-2dece.firebasestorage.app",
  messagingSenderId: "305322956961",
  appId: "1:305322956961:web:d4f55122f6b0f2a08e78e0",
  measurementId: "G-0LW5HVQP08"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
