// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyBr3sUVppJe5NN8ndl8Hy-xFt7ObEdty0U',
  authDomain: 'rtas-backend.firebaseapp.com',
  projectId: 'rtas-backend',
  storageBucket: 'rtas-backend.appspot.com',
  messagingSenderId: '985294248106',
  appId: '1:985294248106:web:68de709abfcae548e3d8d3',
  measurementId: 'G-TEYGCZRN6N',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
