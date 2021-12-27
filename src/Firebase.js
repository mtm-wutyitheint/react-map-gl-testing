import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBDVViK4-9uatIN_ORMggzqXcvtZYwcuYk",
  authDomain: "location-tracker-63fca.firebaseapp.com",
  databaseURL: "https://location-tracker-63fca-default-rtdb.firebaseio.com",
  projectId: "location-tracker-63fca",
  storageBucket: "location-tracker-63fca.appspot.com",
  messagingSenderId: "1031131353933",
  appId: "1:1031131353933:web:7c52889fb676c27509dd04"
};

firebase.initializeApp(firebaseConfig);

export const db = getFirestore();

export default firebase;