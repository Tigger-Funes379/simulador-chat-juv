const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// === URL DE TU GOOGLE APPS SCRIPT ===
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxm-x3So3Bm56eVBDmv_cIqlJsvsMT6q-dCCCzljwCcEJRBmnjpoisN_2tdCN86O41HRQ/exec'; 

async function guardarEnSheets(datosTaller) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(datosTaller),
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        
        if(result.resultado === 'exito') {
            console.log('✅ Balance guardado en Google Sheets con éxito.');
        } else {
            console.error('❌ Error en el Script:', result.error);
        }
    } catch (error) {
        console.error('❌ Error de conexión con Sheets:', error);
    }
}

let estadoVotacion = { activa: false, opciones: null, fin: false };
let participantesConectados = 0; 
let dispositivosUnicos = {}; 

let tallerActual = {
    marcaTemporal: null,
    totalParticipantes: 0,
    votos: {},
    guardado: false // NUEVO: Bandera para saber si ya se mandó a Sheets
};

// --- NUEVAS VARIABLES PARA EL TRIBUNAL ---
let faseActual = 'simulador'; // Puede ser 'simulador' o 'tribunal'
let contadoresTribunal = { mito: 0, realidad: 0 };

io.on('connection', (socket) => {
    socket.emit('estado_actual', estadoVotacion);
    socket.emit('estado_fase', faseActual); // Le avisa al celular en qué fase estamos apenas se conecta

    socket.on('soy_participante', (deviceId) => {
        socket.isParticipante = true;
        socket.deviceId = deviceId;

        if (!dispositivosUnicos[deviceId]) {
            dispositivosUnicos[deviceId] = 1; 
            participantesConectados++;
            
            // Guardamos la marca temporal en el primer escaneo
            if (participantesConectados === 1 && !tallerActual.marcaTemporal) {
                const ahora = new Date();
                // Forzamos la zona horaria a Argentina sin importar dónde esté el servidor
                tallerActual.marcaTemporal = ahora.toLocaleString('es-AR', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            if (participantesConectados > tallerActual.totalParticipantes) {
                tallerActual.totalParticipantes = participantesConectados;
            }
        } else {
            dispositivosUnicos[deviceId]++;
        }
        
        io.emit('actualizar_participantes', participantesConectados);
    });

    // --- EVENTOS DEL SIMULADOR ---
    socket.on('abrir_votacion', (opciones) => {
        estadoVotacion = { activa: true, opciones: opciones, fin: false };
        io.emit('votacion_abierta', opciones);
    });

    socket.on('cerrar_votacion', (datosParada) => {
        estadoVotacion = { activa: false, opciones: null, fin: false };
        io.emit('votacion_cerrada');
        
        tallerActual.votos[`${datosParada.parada}A`] = datosParada.A;
        tallerActual.votos[`${datosParada.parada}B`] = datosParada.B;
        tallerActual.votos[`${datosParada.parada}C`] = datosParada.C;
    });

    socket.on('fin_simulacion', () => {
        estadoVotacion = { activa: false, opciones: null, fin: true };
        io.emit('simulacion_finalizada');

        // Disparamos el guardado automático de inmediato
        if (tallerActual.marcaTemporal && !tallerActual.guardado) {
            guardarEnSheets(tallerActual);
            tallerActual.guardado = true; // Marcamos como guardado
        }
    });

    socket.on('voto_enviado', (opcion) => {
        io.emit('actualizar_votos', opcion);
    });

    // --- EVENTOS DEL TRIBUNAL ---
    socket.on('iniciar_tribunal', () => {
        faseActual = 'tribunal';
        io.emit('cambio_fase', 'tribunal');
    });

    socket.on('abrir_votacion_tribunal', () => {
        contadoresTribunal = { mito: 0, realidad: 0 }; // Limpiamos la cuenta para la nueva frase
        io.emit('votacion_tribunal_abierta');
    });

    socket.on('cerrar_votacion_tribunal', () => {
        io.emit('votacion_tribunal_cerrada');
    });

    socket.on('voto_tribunal', (opcion) => { // Recibe 'mito' o 'realidad'
        contadoresTribunal[opcion]++;
        io.emit('actualizar_votos_tribunal', contadoresTribunal);
    });

    // --- REINICIAR TALLER (Tecla R) ---
    socket.on('reiniciar_taller', () => {
        // Por las dudas: si apretaste "R" por accidente ANTES de terminar, guarda los datos parciales
        if (tallerActual.marcaTemporal && !tallerActual.guardado) {
            guardarEnSheets(tallerActual);
        }

        // Reseteamos el Simulador
        estadoVotacion = { activa: false, opciones: null, fin: false };
        participantesConectados = 0; 
        dispositivosUnicos = {}; 
        tallerActual = { marcaTemporal: null, totalParticipantes: 0, votos: {}, guardado: false };
        
        // Reseteamos el Tribunal
        faseActual = 'simulador';
        contadoresTribunal = { mito: 0, realidad: 0 };
        io.emit('cambio_fase', 'simulador');
        
        io.emit('expulsar_clientes'); 
        io.emit('actualizar_participantes', participantesConectados);
    });

    socket.on('disconnect', () => {
        if (socket.isParticipante && socket.deviceId) {
            dispositivosUnicos[socket.deviceId]--;
            if (dispositivosUnicos[socket.deviceId] <= 0) {
                participantesConectados--;
                delete dispositivosUnicos[socket.deviceId]; 
            }
            io.emit('actualizar_participantes', participantesConectados);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});