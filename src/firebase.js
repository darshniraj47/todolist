import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Replace these placeholders with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCh4yRn7DR_Jhap04vR_xS6DlbzDo6Shec",
    authDomain: "todolist-4b308.firebaseapp.com",
    projectId: "todolist-4b308",
    storageBucket: "todolist-4b308.firebasestorage.app",
    messagingSenderId: "616999908643",
    appId: "1:616999908643:web:dd5cbcbed98edc83428896"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const analytics = getAnalytics(app);
