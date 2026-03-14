import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore }                   from 'firebase/firestore';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            "AIzaSyDEFICdyeR0kqftRFYEYPvaQYKvPckAK48",
  authDomain:        "studybloom-ee5f0.firebaseapp.com",
  projectId:         "studybloom-ee5f0",
  storageBucket:     "studybloom-ee5f0.appspot.com",
  messagingSenderId: "3337984561",
  appId:             "1:3337984561:web:6ca33889ccb570a93c9310",
  measurementId:     "G-VLRDZC8YNW",
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export const db = getFirestore(app);
export { auth };
export default app;