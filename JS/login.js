import { auth } from './Firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. Capturar elementos del DOM
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginScreen = document.getElementById('login-screen');
const chatApp = document.getElementById('chat-app');

// 2. Escuchar el evento de envío (submit)
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (loginError) loginError.textContent = '';

    // 3. Autenticar con Firebase
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Ocultar pantalla de Login
        if (loginScreen) loginScreen.style.display = 'none';

        // Mostrar pantalla de Chat
        if (chatApp) chatApp.style.display = 'flex';

        // Iniciar la lógica de mensajes pasando el ID del usuario
        if (typeof window.iniciarChat === "function") {
          window.iniciarChat(userCredential.user.uid);
        }
      })
      .catch((error) => {
        console.error("Error al iniciar sesión:", error);
        if (loginError) {
          loginError.textContent = "Correo o contraseña incorrectos.";
        }
      });
  });
}