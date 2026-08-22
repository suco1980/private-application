import { ref, onValue, set, update, onDisconnect, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

function formatearHoraUltimaConexion(timestamp) {
  if (!timestamp) return "last seen recently";

  const fechaMs = typeof timestamp === 'number' ? timestamp : Number(timestamp);
  const fecha = isNaN(fechaMs) ? new Date() : new Date(fechaMs);
  const ahora = new Date();

  // Formato de hora exacta en 12 horas (ej: 08:35 PM)
  const hora = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const esHoy = fecha.toDateString() === ahora.toDateString();
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  const esAyer = fecha.toDateString() === ayer.toDateString();

  if (esHoy) {
    return `last seen today at ${hora}`;
  } else if (esAyer) {
    return `last seen yesterday at ${hora}`;
  } else {
    const fechaCorta = fecha.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
    return `last seen ${fechaCorta} at ${hora}`;
  }
}

export function iniciarControlPresencia(db, myUserId) {
  if (!myUserId) return;

  const myStatusRef = ref(db, `presencia/${myUserId}`);
  const connectedRef = ref(db, ".info/connected");

  // 1. Sincronizar estado con el servidor de Firebase
  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      // Programar salida exacta en el servidor al perder señal o cerrar app
      onDisconnect(myStatusRef).set({
        online: false,
        lastSeen: serverTimestamp()
      });

      // Estado en línea
      set(myStatusRef, {
        online: true,
        connectedAt: serverTimestamp(),
        lastSeen: serverTimestamp()
      });
    }
  });

  // Forzar desconexión inmediata en navegador móvil o escritorio
  const marcarOffline = () => {
    update(myStatusRef, {
      online: false,
      lastSeen: serverTimestamp()
    });
  };

  window.addEventListener("pagehide", marcarOffline);
  window.addEventListener("beforeunload", marcarOffline);

  // 2. Escuchar al otro usuario
  const presenceRef = ref(db, "presencia");
  onValue(presenceRef, (snapshot) => {
    const el = document.getElementById('user-status');
    if (!el) return;

    const data = snapshot.val();
    if (!data) return;

    const targetUid = Object.keys(data).find(uid => uid !== myUserId);
    if (!targetUid || !data[targetUid]) return;

    const targetUser = data[targetUid];

    if (targetUser.online === true) {
      el.textContent = "Online";
      el.style.color = "#00ffb7";
    } else {
      const ultimaHora = targetUser.lastSeen || targetUser.connectedAt;
      el.textContent = formatearHoraUltimaConexion(ultimaHora);
      el.style.color = "#d1d7db";
    }
  });
}