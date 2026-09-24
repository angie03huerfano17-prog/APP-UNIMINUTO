// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCtscS9VLR4mQ3VT64jXPOy1oDO9Ndu7p8",
  authDomain: "registro-activos.firebaseapp.com",
  projectId: "registro-activos",
  storageBucket: "registro-activos.firebasestorage.app",
  messagingSenderId: "395797920202",
  appId: "1:395797920202:web:48fce6932149bda0d47733",
  measurementId: "G-92DXYSSB6B"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);