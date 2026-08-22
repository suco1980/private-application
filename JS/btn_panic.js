import { ref, remove, push, onChildAdded, onDisconnect, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

// ✉️ CORREO DEL LADO A (Única persona que recibirá la notificación)
const CORREO_LADO_A = "suco@gmail.com"; 

export function activarBotonPanico(db, auth) {
  const panicBtn = document.getElementById('btn-panico');
  const horaInicioApp = Date.now();

  // 1. ESCUCHAR ALERTAS DE PÁNICO EN TIEMPO REAL (SOLO LADO A)
  const panicRef = ref(db, "alertas_panico");

  onChildAdded(panicRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const user = auth.currentUser;
    if (!user) return;

    const esLadoA = user.email && user.email.toLowerCase() === CORREO_LADO_A.toLowerCase();
    if (!esLadoA) return; // Si es Lado B, no muestra nada (silencio total)

    const fechaAlerta = data.timestamp || Date.now();

    if (fechaAlerta >= horaInicioApp - 3000) {
      const esMiAlerta = data.senderId === user.uid;
      const titulo = esMiAlerta ? "Alerta Activada" : "Notificación de Seguridad";
      const mensaje = esMiAlerta ? "Has enviado una señal de alerta." : "Se ha presionado el botón de pánico.";

      mostrarNotificacionSutil(titulo, mensaje);
      reproducirSonidoSuave();
    }
  });

  if (!panicBtn) return;

  // 2. ACCIÓN DEL BOTÓN (1 CLIC VS 2 CLICS)
  let clickTimeout = null;

  panicBtn.addEventListener('click', (e) => {
    const user = auth.currentUser;
    if (!user) return;

    // === PRIMER CLIC: Solo envía notificación (Conserva mensajes) ===
    if (e.detail === 1) {
      clickTimeout = setTimeout(async () => {
        try {
          await push(ref(db, "alertas_panico"), {
            senderId: user.uid,
            timestamp: serverTimestamp()
          });
        } catch (error) {
          console.error("Error al enviar alerta:", error);
        }
      }, 300);
    }

    // === SEGUNDO CLIC (DOBLE CLIC): Borrado + Cierre + Salida ===
    if (e.detail === 2) {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }

      (async () => {
        try {
          await push(ref(db, "alertas_panico"), {
            senderId: user.uid,
            timestamp: serverTimestamp()
          }).catch(() => {});

          const presenceRef = ref(db, `presencia/${user.uid}`);
          await onDisconnect(presenceRef).cancel().catch(() => {});

          // 1. Eliminar mensajes
          await remove(ref(db, "mensajes"));

          // 2. Cerrar sesión
          await signOut(auth);

          // 3. Limpiar almacenamiento local
          localStorage.clear();
          sessionStorage.clear();

          // 4. Salir a Google exigiendo credenciales al volver
          window.location.replace("https://www.google.com");

        } catch (error) {
          console.error("Error en salida de emergencia:", error);
          localStorage.clear();
          sessionStorage.clear();
          signOut(auth).finally(() => {
            window.location.replace("https://www.google.com");
          });
        }
      })();
    }
  });
}

// -------------------------------------------------------------
// NOTIFICACIÓN DISCRETA Y SUTIL (ESTILO TOAST / BANNER)
// -------------------------------------------------------------
function mostrarNotificacionSutil(titulo, mensaje) {
  let toast = document.getElementById("panic-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "panic-toast";
    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.backgroundColor = "#1e293b"; // Tono oscuro discreto (Slate)
    toast.style.color = "#f8fafc";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "10px";
    toast.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.25)";
    toast.style.zIndex = "999999";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "12px";
    toast.style.fontFamily = "system-ui, -apple-system, sans-serif";
    toast.style.fontSize = "14px";
    toast.style.maxWidth = "90vw";
    toast.style.transition = "opacity 0.3s ease";

    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <span style="font-size: 18px;">🔔</span>
    <div>
      <strong style="display: block; font-size: 14px; margin-bottom: 2px;">${titulo}</strong>
      <span style="color: #cbd5e1; font-size: 13px;">${mensaje}</span>
    </div>
  `;

  toast.style.opacity = "1";

  // Se oculta automáticamente tras 4 segundos
  setTimeout(() => {
    if (toast) {
      toast.style.opacity = "0";
    }
  }, 4000);
}

// Sonido tipo "Ding" discreto
function reproducirSonidoSuave() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine'; // Onda suave
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Nota D5
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime); // Volumen bajo

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3); // Sonido corto de 0.3s
  } catch (e) {
    console.log("Audio no permitido sin interacción previa.");
  }
}