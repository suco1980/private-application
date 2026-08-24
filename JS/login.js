import { auth } from './Firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (loginError) loginError.textContent = '';

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // 1. Ocultar Login
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.style.display = 'none';

        // 2. Mostrar Chat (ID exacto de tu HTML)
        const chatApp = document.getElementById('chat-app');
        if (chatApp) {
          chatApp.style.display = 'flex';
        }

        // 3. Ejecutar función global del chat
        if (typeof window.iniciarChat === "function") {
          window.iniciarChat(userCredential.user.uid);
        } else {
          console.error("La función iniciarChat no está disponible en window.");
        }
      })
      .catch((error) => {
        console.error("Error al iniciar sesión:", error);
        if (loginError) loginError.textContent = "Correo o contraseña incorrectos.";
      });
  });
}