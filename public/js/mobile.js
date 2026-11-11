const socket = io();

// 1. Generamos o recuperamos el ID único del celular
let deviceId = localStorage.getItem('deviceId');
if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
}

// 2. LA SOLUCIÓN AL CONTADOR: Avisamos que somos participantes apenas conecta el socket
socket.on('connect', () => {
    socket.emit('soy_participante', deviceId);
});

// --- FASE 1: SIMULADOR ---
function votar(opcion) {
    socket.emit('voto_enviado', opcion);
    document.getElementById('opciones-container').innerHTML = `
        <div class="mensaje-exito">
            <h2>✅ ¡Voto registrado!</h2>
            <p>Mira la pantalla del proyector</p>
        </div>
    `;
}

// Resetea los botones cuando se abre una nueva parada
socket.on('votacion_abierta', () => {
    document.getElementById('opciones-container').innerHTML = `
        <button class="btn-voto" data-opcion="A" onclick="votar('A')">Opción A</button>
        <button class="btn-voto" data-opcion="B" onclick="votar('B')">Opción B</button>
        <button class="btn-voto" data-opcion="C" onclick="votar('C')">Opción C</button>
    `;
});

socket.on('votacion_cerrada', () => {
    document.getElementById('opciones-container').innerHTML = `
        <div class="mensaje-exito">
            <h2 style="color: #ffeb3b !important;">⏳ Votación Cerrada</h2>
            <p>Atento a la historia...</p>
        </div>
    `;
});

socket.on('expulsar_clientes', () => {
    location.reload();
});

// --- FASE 2: TRIBUNAL ---
function cambiarFaseMovil(fase) {
    if (fase === 'tribunal') {
        document.getElementById('pantalla-celular').style.display = 'none';
        document.getElementById('pantalla-tribunal').style.display = 'flex';
    } else {
        document.getElementById('pantalla-celular').style.display = 'flex';
        document.getElementById('pantalla-tribunal').style.display = 'none';
    }
}

socket.on('estado_fase', cambiarFaseMovil);
socket.on('cambio_fase', cambiarFaseMovil);

socket.on('votacion_tribunal_abierta', () => {
    document.getElementById('titulo-tribunal').innerText = '¿Mito o Realidad?';
    document.getElementById('opciones-tribunal').style.display = 'flex';
});

socket.on('votacion_tribunal_cerrada', () => {
    document.getElementById('opciones-tribunal').style.display = 'none';
    document.getElementById('titulo-tribunal').innerText = 'Atento al proyector...';
});

function votarTribunal(opcion) {
    socket.emit('voto_tribunal', opcion);
    document.getElementById('opciones-tribunal').style.display = 'none';
    document.getElementById('titulo-tribunal').innerText = '✅ Voto enviado';
}