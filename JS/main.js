import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  ref, push, onChildAdded, onChildChanged, update 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

import { db, auth } from './Firebase.js';
import { iniciarControlPresencia } from './presence.js';
import { activarBotonPanico } from './btn_panic.js';

// Selección segura de elementos del DOM
const loginScreen = document.getElementById("login-screen");
const chatApp = document.getElementById("chat-app");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");

// Activación segura del botón de pánico
try {
  if (typeof activarBotonPanico === "function" && db && auth) {
    activarBotonPanico(db, auth);
  }
} catch (e) {
  console.warn("No se pudo inicializar el botón de pánico:", e);
}

// Control del estado de autenticación
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (loginScreen) loginScreen.style.display = "none";
    if (chatApp) {
      chatApp.style.display = "flex";
      chatApp.classList.add("activo");
    }

    registrarAcceso(user.uid);
    escucharIngresoDePersona(user.uid);
    iniciarChat(user.uid);
  } else {
    if (loginScreen) loginScreen.style.display = "block";
    if (chatApp) {
      chatApp.style.display = "none";
      chatApp.classList.remove("activo");
    }

    if (loginForm) loginForm.reset();
    if (loginError) loginError.textContent = "";
  }
});

function registrarAcceso(uid) {
  const accesosRef = ref(db, "registros_ingreso");
  push(accesosRef, {
    usuarioId: uid,
    fecha: Date.now()
  }).catch((err) => console.error("Error al registrar acceso:", err));
}

function escucharIngresoDePersona(currentUid) {
  const accesosRef = ref(db, "registros_ingreso");
  const horaInicio = Date.now();

  onChildAdded(accesosRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (data.usuarioId !== currentUid) {
      const fechaAcceso = data.fecha || Date.now();

      if (fechaAcceso >= horaInicio - 2000) {
        const hora = new Date(fechaAcceso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        mostrarAlertaPantalla(`🚨 The other person joined the chat at ${hora}`);
      }
    }
  });
}

function mostrarAlertaPantalla(mensaje) {
  let alertDiv = document.getElementById("app-alert-banner");
  if (!alertDiv) {
    alertDiv = document.createElement("div");
    alertDiv.id = "app-alert-banner";
    alertDiv.style.position = "fixed";
    alertDiv.style.top = "15px";
    alertDiv.style.left = "50%";
    alertDiv.style.transform = "translateX(-50%)";
    alertDiv.style.backgroundColor = "#ff4757";
    alertDiv.style.color = "#ffffff";
    alertDiv.style.padding = "12px 24px";
    alertDiv.style.borderRadius = "25px";
    alertDiv.style.fontWeight = "bold";
    alertDiv.style.fontSize = "14px";
    alertDiv.style.zIndex = "99999";
    document.body.appendChild(alertDiv);
  }

  alertDiv.textContent = mensaje;
  alertDiv.style.display = "block";

  setTimeout(() => {
    alertDiv.style.display = "none";
  }, 6000);
}

// Formulario de inicio de sesión
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (loginError) loginError.textContent = "";

    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");

    if (!emailInput || !passwordInput) return;

    signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
      .then(() => loginForm.reset())
      .catch(() => {
        if (loginError) {
          loginError.textContent = "Access denied: Incorrect email or password.";
        }
      });
  });
}

// Cierre de sesión
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    const user = auth.currentUser;
    if (user) {
      update(ref(db, `presencia/${user.uid}`), {
        online: false,
        lastSeen: Date.now()
      }).finally(() => signOut(auth));
    } else {
      signOut(auth);
    }
  });
}

// Lógica principal del Chat
function iniciarChat(myUserId) {
  const mensajesRef = ref(db, "mensajes");
  const chatbox = document.getElementById('chat-box');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');

  if (chatbox) chatbox.innerHTML = '';

  try {
    if (typeof iniciarControlPresencia === "function") {
      iniciarControlPresencia(db, myUserId);
    }
  } catch (e) {
    console.warn("No se pudo iniciar control de presencia:", e);
  }

  if (chatForm && messageInput) {
    chatForm.onsubmit = function(e) {
      e.preventDefault();
      const text = messageInput.value.trim();
      if (text !== "") {
        push(mensajesRef, {
          senderId: myUserId,
          text: text,
          timestamp: Date.now(),
          leido: false
        });
        messageInput.value = '';
      }
    };
  }

  onChildAdded(mensajesRef, (snapshot) => {
    const msgKey = snapshot.key;
    const data = snapshot.val();
    if (!data) return;

    const isMe = data.senderId === myUserId;
    const date = new Date(data.timestamp || Date.now());
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (document.querySelector(`[data-id="${msgKey}"]`)) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', isMe ? 'sent' : 'received');
    messageDiv.setAttribute('data-id', msgKey);

    if (isMe) {
      const tickClass = data.leido ? 'ticks blue' : 'ticks grey';
      messageDiv.innerHTML = `
        <span class="text">${data.text || data.texto || ""}</span>
        <span class="msg-meta">${time} <span class="${tickClass}">✓✓</span></span>
      `;
    } else {
      messageDiv.innerHTML = `
        <span class="text">${data.text || data.texto || ""}</span>
        <span class="msg-meta">${time}</span>
      `;
      
      if (data.leido !== true) {
        update(ref(db, `mensajes/${msgKey}`), { leido: true });
      }
    }

    if (chatbox) {
      chatbox.appendChild(messageDiv);
      chatbox.scrollTop = chatbox.scrollHeight;
    }
  });

  onChildChanged(mensajesRef, (snapshot) => {
    const msgKey = snapshot.key;
    const data = snapshot.val();

    if (data && data.leido === true) {
      const msgElement = document.querySelector(`[data-id="${msgKey}"]`);
      if (msgElement) {
        const ticks = msgElement.querySelector('.ticks');
        if (ticks) {
          ticks.classList.remove('grey');
          ticks.classList.add('blue');
        }
      }
    }
  });
}