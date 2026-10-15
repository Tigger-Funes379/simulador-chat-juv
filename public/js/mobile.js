const socket = io();

// Creamos un ID único para el celular y lo guardamos en la memoria del navegador
let deviceId = localStorage.getItem('simulador_device_id');
if (!deviceId) {
    deviceId = 'celular_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('simulador_device_id', deviceId);
}

// Le avisamos al servidor que somos un participante y le pasamos nuestro ID
socket.emit('soy_participante', deviceId);

const pantallaCelular = document.getElementById('pantalla-celular');
let votoEnviado = false;

function renderizarEspera() {
    pantallaCelular.innerHTML = `
        <div class="mensaje-exito" style="border-color: #ffeb3b;">
            <h2 style="color: #ffeb3b;">⏳ Esperando...</h2>
            <p>Mirá la pantalla principal.</p>
            <p>Las opciones aparecerán acá cuando lleguemos a una Parada Dilemática.</p>
        </div>
    `;
}

function renderizarBotones() {
    pantallaCelular.innerHTML = `
        <h2>Elige tu opción</h2>
        <button class="btn-voto" data-opcion="A">Opción A</button>
        <button class="btn-voto" data-opcion="B">Opción B</button>
        <button class="btn-voto" data-opcion="C">Opción C</button>
    `;

    const botones = document.querySelectorAll('.btn-voto');
    botones.forEach(boton => {
        boton.addEventListener('click', (e) => {
            if (votoEnviado) return;
            const opcion = e.target.getAttribute('data-opcion');
            socket.emit('voto_enviado', opcion);
            votoEnviado = true;
            
            pantallaCelular.innerHTML = `
                <div class="mensaje-exito">
                    <h2>¡Voto enviado! 🚀</h2>
                    <p>Elegiste la Opción ${opcion}.</p>
                    <p>Esperá a que el facilitador continúe la historia.</p>
                </div>
            `;
        });
    });
}

function renderizarFin() {
    pantallaCelular.innerHTML = `
        <div class="mensaje-exito" style="border-color: #ff5252;">
            <h2 style="color: #ff5252;">🛑 FIN 🛑</h2>
            <p>La simulación ha terminado.</p>
            <p>Mirá la pantalla para el debate final.</p>
        </div>
    `;
}

socket.on('estado_actual', (estado) => {
    if (estado.fin) {
        renderizarFin();
    } else if (estado.activa && !votoEnviado) {
        renderizarBotones();
    } else if (!votoEnviado) {
        renderizarEspera();
    }
});

socket.on('votacion_abierta', () => {
    votoEnviado = false;
    renderizarBotones();
});

socket.on('votacion_cerrada', () => {
    renderizarEspera();
});

socket.on('simulacion_finalizada', () => {
    renderizarFin();
});

socket.on('expulsar_clientes', () => {
    pantallaCelular.innerHTML = `
        <div class="mensaje-exito">
            <h2>Taller finalizado 🔄</h2>
            <p>La sesión ha sido cerrada.</p>
            <p>Si estás en un nuevo taller, volvé a escanear el QR.</p>
        </div>
    `;
    socket.disconnect(); 
});