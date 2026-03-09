import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          const initialData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'Student',
            education: 'Year 10-11',
            score: 0,
            dailyGoal: 100,
            streak: 0,
            totalSessions: 0,
            totalMinutes: 0,
            createdAt: serverTimestamp(),
          };
          await setDoc(userDocRef, initialData);
          setUserData(initialData);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setUser(firebaseUser);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function login(email, password) {
    setError(null);
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      return res.user;
    } catch (err) {
      const msg = getErrorMessage(err.code);
      setError(msg);
      throw new Error(msg);
    }
  }

  async function register(email, password, name, education) {
    setError(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = res.user;

      const newUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name,
        education,
        score: 0,
        dailyGoal: 100,
        streak: 0,
        totalSessions: 0,
        totalMinutes: 0,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      setUserData(newUser);
      return firebaseUser;
    } catch (err) {
      const msg = getErrorMessage(err.code);
      setError(msg);
      throw new Error(msg);
    }
  }

  async function googleLogin() {
  setError(null);

  try {
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });

    const result = await AuthSession.startAsync({
      authUrl:
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=YOUR_GOOGLE_CLIENT_ID` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=id_token` +
        `&scope=openid%20profile%20email`,
    });

    if (result.type === "success") {
      const { id_token } = result.params;

      const credential = GoogleAuthProvider.credential(id_token);

      const res = await signInWithCredential(auth, credential);

      return res.user;
    }

  } catch (err) {
    console.error(err);
    setError("Google login failed");
    throw err;
  }
}

  async function logout() {
    try {
      await signOut(auth);
    } catch (err) {
      setError('Logout failed');
    }
  }

  function getErrorMessage(code) {
    switch (code) {
      case 'auth/email-already-in-use': return 'This email is already registered.';
      case 'auth/invalid-email': return 'Enter a valid email address.';
      case 'auth/weak-password': return 'Password must be 6+ characters.';
      case 'auth/user-not-found': return 'No account found.';
      case 'auth/wrong-password': return 'Incorrect password.';
      default: return 'An error occurred. Try again.';
    }
  }

  // FIXED: Added googleLogin to the value object
  const value = { 
    user, 
    userData, 
    loading, 
    error, 
    login, 
    register, 
    googleLogin, 
    logout 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}