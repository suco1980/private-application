import { db } from './Firebase.js';
import { 
  ref, 
  push, 
  onChildAdded, 
  onChildChanged, 
  update,
  off 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

function iniciarChat(myUserId) {
  const mensajesRef = ref(db, "mensajes");
  const chatbox = document.getElementById('chat-box') || document.querySelector('.chat-box');
  const chatForm = document.getElementById('chat-form') || document.querySelector('.chat-input-area');
  const messageInput = document.getElementById('message-input') || document.querySelector('.chat-input-area input');

  // Limpiar listeners antiguos para evitar ejecuciones duplicadas
  off(mensajesRef);

  if (chatbox) chatbox.innerHTML = '';

  // Activar funciones auxiliares
  try {
    if (typeof iniciarControlPresencia === "function") iniciarControlPresencia(db, myUserId);
    if (typeof manejarIndicadorEscribiendo === "function") manejarIndicadorEscribiendo(myUserId);
    if (typeof escucharOtroUsuarioEscribiendo === "function") escucharOtroUsuarioEscribiendo(myUserId);
  } catch (e) {
    console.warn("Error en funciones auxiliares:", e);
  }

  // Envío de mensaje
  if (chatForm && messageInput) {
    chatForm.onsubmit = (e) => {
      if (e) e.preventDefault();
      const text = messageInput.value.trim();

      if (text !== "") {
        push(mensajesRef, {
          senderId: myUserId,
          text: text,
          timestamp: Date.now(),
          leido: false
        })
        .then(() => {
          messageInput.value = '';
        })
        .catch((err) => console.error("Error enviando:", err));
      }
    };
  }

  // Recepción de mensajes en tiempo real
  onChildAdded(mensajesRef, (snapshot) => {
    const msgKey = snapshot.key;
    const data = snapshot.val();
    if (!data) return;

    if (document.getElementById(`msg-${msgKey}`)) return;

    const isMe = data.senderId === myUserId;
    const date = new Date(data.timestamp || Date.now());
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const messageDiv = document.createElement('div');
    messageDiv.id = `msg-${msgKey}`;
    messageDiv.classList.add('message', isMe ? 'sent' : 'received');

    if (isMe) {
      const tickClass = data.leido ? 'ticks blue' : 'ticks grey';
      messageDiv.innerHTML = `
        <span class="text">${data.text || ""}</span>
        <span class="msg-meta">${time} <span class="ticks ${tickClass}">✓✓</span></span>
      `;
    } else {
      messageDiv.innerHTML = `
        <span class="text">${data.text || ""}</span>
        <span class="msg-meta">${time}</span>
      `;

      // Solo marcar como leído si el mensaje NO es mío y aún NO está leído
      if (!data.leido) {
        update(ref(db, `mensajes/${msgKey}`), { leido: true }).catch(() => {});
      }
    }

    if (chatbox) {
      chatbox.appendChild(messageDiv);
      chatbox.scrollTop = chatbox.scrollHeight;
    }
  });

  // Actualizar Ticks cuando el otro usuario lee tu mensaje
  onChildChanged(mensajesRef, (snapshot) => {
    const msgKey = snapshot.key;
    const data = snapshot.val();

    if (data && data.leido) {
      const msgElement = document.getElementById(`msg-${msgKey}`);
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

window.iniciarChat = iniciarChat;