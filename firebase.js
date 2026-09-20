import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";


// ========================================
// إعدادات Firebase
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyAix5FXyBfTxRkOob-oD5NXjqHise_EvZA",
    authDomain: "mydiscord2026-960b7.firebaseapp.com",
    projectId: "mydiscord2026-960b7",
    storageBucket: "mydiscord2026-960b7.firebasestorage.app",
    messagingSenderId: "636310300965",
    appId: "1:636310300965:web:a49292f0364356789c52cc",
    measurementId: "G-Y99PVRCSTM"
};


// ========================================
// تشغيل Firebase
// ========================================

const app = initializeApp(firebaseConfig);


// ========================================
// Authentication
// ========================================

window.auth = getAuth(app);

window.createUserWithEmailAndPassword =
    createUserWithEmailAndPassword;

window.signInWithEmailAndPassword =
    signInWithEmailAndPassword;

window.onAuthStateChanged =
    onAuthStateChanged;

window.signOut =
    signOut;


// ========================================
// Firestore
// ========================================

window.db = getFirestore(app);

window.collection =
    collection;

window.addDoc =
    addDoc;

window.onSnapshot =
    onSnapshot;

window.query =
    query;

window.orderBy =
    orderBy;

window.doc =
    doc;

window.setDoc =
    setDoc;

window.getDoc =
    getDoc;


// ========================================
// Firebase Storage
// ========================================

window.storage =
    getStorage(app);


console.log(
    "Firebase + Authentication + Firestore + Storage متصل بنجاح 🚀"
);