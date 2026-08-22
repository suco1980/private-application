import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { 
  getAuth, 
  setPersistence, 
  inMemoryPersistence 
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsIkAvtS-NnQEfJ3jVx8qAAybbEFT0akE",
  authDomain: "private-chat-app-b20d7.firebaseapp.com",
  databaseURL: "https://private-chat-app-b20d7-default-rtdb.firebaseio.com",
  projectId: "private-chat-app-b20d7",
  storageBucket: "private-chat-app-b20d7.firebasestorage.app",
  messagingSenderId: "103055895240",
  appId: "1:103055895240:web:94feb68a2c1c5d756453fd"
};

const app = initializeApp(firebaseConfig);

// EXPORTAR para que main.js y btn_panic.js los reconozcan
export const auth = getAuth(app);
export const db = getDatabase(app);

// Configuración para no recordar la sesión
setPersistence(auth, inMemoryPersistence);