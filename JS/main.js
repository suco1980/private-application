import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { 
  ref, push, onChildAdded, onChildChanged, update, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db, auth } from './Firebase.js';
import { iniciarControlPresencia } from './presence.js';
import { activarBotonPanico } from './btn_panic.js';

activarBotonPanico(db, auth);

const loginScreen = document.getElementById("login-screen");
const chatApp = document.getElementById("chat-app");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginScreen.style.display = "none";
    chatApp.style.display = "block";

    // 1. Registrar acceso en Firebase
    registrarAcceso(user.uid);

    // 2. Escuchar cuando la otra persona ingresa
    escucharIngresoDePersona(user.uid);

    // 3. Iniciar el chat
    iniciarChat(user.uid);
  } else {
    loginScreen.style.display = "block";
    chatApp.style.display = "none";

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

// ALERTA DE INGRESO VISIBLE EN PANTALLA
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

        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("🚨 Access Alert", {
              body: `The other person joined the chat at ${hora}`,
              icon: "https://cdn-icons-png.flaticon.com/512/1827/1827504.png"
            });
          } catch (e) {
            console.log("Notificaciones nativas bloqueadas en HTTP local");
          }
        }
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
    alertDiv.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
    document.body.appendChild(alertDiv);
  }

  alertDiv.textContent = mensaje;
  alertDiv.style.display = "block";

  setTimeout(() => {
    alertDiv.style.display = "none";
  }, 6000);
}

// Evento Login
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (loginError) loginError.textContent = "";

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => loginForm.reset())
      .catch(() => {
        if (loginError) {
          loginError.textContent = "Access denied: Incorrect email or password.";
        }
      });
  });
}

// Logout limpio
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

// LÓGICA DE CHAT Y TICKS AZULES
function iniciarChat(myUserId) {
  const mensajesRef = ref(db, "mensajes");
  const chatbox = document.getElementById('chat-box');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');

  if (chatbox) chatbox.innerHTML = '';

  // LLAMADA ÚNICA Y CORRECTA A LA PRESENCIA
  iniciarControlPresencia(db, myUserId);

  if (chatForm) {
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

  // Cargar y recibir mensajes
  onChildAdded(mensajesRef, (snapshot) => {
    const msgKey = snapshot.key;
    const data = snapshot.val();
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
      
      // Marca como leído cuando el receptor abre el mensaje
      if (data.leido !== true) {
        update(ref(db, `mensajes/${msgKey}`), { leido: true });
      }
    }

    if (chatbox) {
      chatbox.appendChild(messageDiv);
      chatbox.scrollTop = chatbox.scrollHeight;
    }
  });

  // Cambio de palomitas a azul en tiempo real
  onChildChanged(mensajesRef, (snapshot) => {
    const msgKey = snapshot.key;
    const data = snapshot.val();

    if (data.leido === true) {
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