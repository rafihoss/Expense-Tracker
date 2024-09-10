// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAkYIOzpjdG8FYZH65cwLM4Jv74UcYIovM",
  authDomain: "expense-tracker-970b0.firebaseapp.com",
  projectId: "expense-tracker-970b0",
  storageBucket: "expense-tracker-970b0.appspot.com",
  messagingSenderId: "635183064543",
  appId: "1:635183064543:web:917880bc9b831efbfa906a",
  measurementId: "G-LJKN5HFSSC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase app initialized:", app);


export {db}