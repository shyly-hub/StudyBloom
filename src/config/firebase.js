

import { initializeApp } from 'firebase/app';
import { getAuth }       from 'firebase/auth';
import { getFirestore }  from 'firebase/firestore';


const firebaseConfig = {
  apiKey:            "AIzaSyDEFICdyeR0kqftRFYEYPvaQYKvPckAK48",
  authDomain:        "studybloom-ee5f0.firebaseapp.com",
  projectId:         "studybloom-ee5f0",
  storageBucket:     "studybloom-ee5f0.firebasestorage.app",
  messagingSenderId: "3337984561",
  appId:             "1:3337984561:web:6ca33889ccb570a93c9310",
  measurementId:     "G-VLRDZC8YNW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth — used for login, register, logout
export const auth = getAuth(app);

// Database — used for saving sessions, user data
export const db = getFirestore(app);

export default app;