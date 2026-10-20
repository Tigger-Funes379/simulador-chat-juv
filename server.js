const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// === URL DE TU GOOGLE APPS SCRIPT ===
const SCRIPT_URL = 'PEGÁ_ACÁ_TU_URL_DE_APPS_SCRIPT'; 

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
                // NUEVO: Forzamos la zona horaria a Argentina sin importar dónde esté el servidor
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

    // NUEVO: CUANDO SE LLEGA A LA PANTALLA DE FIN DE SIMULACIÓN
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

    // CUANDO SE APRIETA LA TECLA "R"
    socket.on('reiniciar_taller', () => {
        // Por las dudas: si apretaste "R" por accidente ANTES de terminar, guarda los datos parciales
        if (tallerActual.marcaTemporal && !tallerActual.guardado) {
            guardarEnSheets(tallerActual);
        }

        estadoVotacion = { activa: false, opciones: null, fin: false };
        participantesConectados = 0; 
        dispositivosUnicos = {}; 
        tallerActual = { marcaTemporal: null, totalParticipantes: 0, votos: {}, guardado: false };
        
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