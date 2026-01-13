import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 🔴 IMPORTANT: paste REAL values here (no XXX, no ...)
const firebaseConfig = {
  apiKey: "AIzaSyDNERTfRdJR9OmqdNG0il_lbKUxlM_x2T4",
  authDomain: "mytradejournel.firebaseapp.com",
  projectId: "mytradejournel",
  storageBucket: "mytradejournel.firebasestorage.app",
  messagingSenderId: "851370067474",
  appId: "1:851370067474:web:1a8b11e4050f728fcc7acb",
  measurementId: "G-FNJ9KNJV7L"
};


const app = initializeApp(firebaseConfig);

// ✅ THESE EXPORTS MUST EXIST
export const auth = getAuth(app);
export const db = getFirestore(app);
