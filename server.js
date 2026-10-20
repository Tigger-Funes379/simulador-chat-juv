const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// === URL DE TU GOOGLE APPS SCRIPT ===
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxm-x3So3Bm56eVBDmv_cIqlJsvsMT6q-dCCCzljwCcEJRBmnjpoisN_2tdCN86O41HRQ/exec'; 

// Función para enviar los datos a tu API de Sheets
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

// Variable que acumula los datos del colegio actual
let tallerActual = {
    marcaTemporal: null,
    totalParticipantes: 0,
    votos: {}
};

io.on('connection', (socket) => {
    socket.emit('estado_actual', estadoVotacion);

    socket.on('soy_participante', (deviceId) => {
        socket.isParticipante = true;
        socket.deviceId = deviceId;

        if (!dispositivosUnicos[deviceId]) {
            dispositivosUnicos[deviceId] = 1; 
            participantesConectados++;
            
            // Guardamos la marca temporal en el primer escaneo
            if (participantesConectados === 1 && !tallerActual.marcaTemporal) {
                const ahora = new Date();
                tallerActual.marcaTemporal = ahora.toLocaleDateString('es-AR') + ' ' + ahora.toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});
            }
            
            // Registramos el pico máximo de alumnos conectados
            if (participantesConectados > tallerActual.totalParticipantes) {
                tallerActual.totalParticipantes = participantesConectados;
            }
        } else {
            dispositivosUnicos[deviceId]++;
        }
        
        io.emit('actualizar_participantes', participantesConectados);
    });

    socket.on('abrir_votacion', (opciones) => {
        estadoVotacion = { activa: true, opciones: opciones, fin: false };
        io.emit('votacion_abierta', opciones);
    });

    socket.on('cerrar_votacion', (datosParada) => {
        estadoVotacion = { activa: false, opciones: null, fin: false };
        io.emit('votacion_cerrada');
        
        // Acumulamos los votos recibidos desde el main.js
        tallerActual.votos[`${datosParada.parada}A`] = datosParada.A;
        tallerActual.votos[`${datosParada.parada}B`] = datosParada.B;
        tallerActual.votos[`${datosParada.parada}C`] = datosParada.C;
    });

    socket.on('fin_simulacion', () => {
        estadoVotacion = { activa: false, opciones: null, fin: true };
        io.emit('simulacion_finalizada');
    });

    socket.on('voto_enviado', (opcion) => {
        io.emit('actualizar_votos', opcion);
    });

    // CUANDO SE APRIETA LA TECLA "R" PARA REINICIAR:
    socket.on('reiniciar_taller', () => {
        
        // 1. Mandamos el balance a Sheets si hubo al menos un participante
        if (tallerActual.marcaTemporal) {
            guardarEnSheets(tallerActual);
        }

        // 2. Reseteamos todo para el próximo colegio
        estadoVotacion = { activa: false, opciones: null, fin: false };
        participantesConectados = 0; 
        dispositivosUnicos = {}; 
        tallerActual = { marcaTemporal: null, totalParticipantes: 0, votos: {} };
        
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