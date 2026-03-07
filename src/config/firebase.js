import { initializeApp } from 'firebase/app';
import { getFirestore }  from 'firebase/firestore';

import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDEFICdyeR0kqftRFYEYPvaQYKvPckAK48",
  authDomain: "studybloom-ee5f0.firebaseapp.com",
  projectId: "studybloom-ee5f0",
  storageBucket: "studybloom-ee5f0.firebasestorage.app",
  messagingSenderId: "3337984561",
  appId: "1:3337984561:web:6ca33889ccb570a93c9310",
  measurementId: "G-VLRDZC8YNW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth with persistent login (React Native fix)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Database
export const db = getFirestore(app);

export default app;