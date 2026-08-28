import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, browserSessionPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsIkAvtS-NnQEfJ3jVx8qAAybbEFT0akE",
  authDomain: "private-chat-app-b20d7.firebaseapp.com",
  databaseURL: "https://private-chat-app-b20d7-default-rtdb.firebaseio.com",
  projectId: "private-chat-app-b20d7",
  storageBucket: "private-chat-app-b20d7.firebasestorage.app",
  messagingSenderId: "103055895240",
  appId: "1:103055895240:web:8026365dbeb9236a6453fd"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

setPersistence(auth, browserSessionPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });