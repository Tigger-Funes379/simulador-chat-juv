const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let estadoVotacion = {
    activa: false,
    opciones: null,
    fin: false 
};

let participantesConectados = 0; 
let dispositivosUnicos = {}; // Diccionario para rastrear los IDs de los celulares

io.on('connection', (socket) => {
    socket.emit('estado_actual', estadoVotacion);

    socket.on('soy_participante', (deviceId) => {
        socket.isParticipante = true;
        socket.deviceId = deviceId; // Guardamos el ID en la conexión actual

        // Si es la primera vez que vemos este celular (o no tiene pestañas abiertas)
        if (!dispositivosUnicos[deviceId]) {
            dispositivosUnicos[deviceId] = 1; // Registramos que tiene 1 pestaña
            participantesConectados++;
        } else {
            // Si ya existe, solo sumamos una pestaña más a la cuenta interna de ese dispositivo
            dispositivosUnicos[deviceId]++;
        }
        
        io.emit('actualizar_participantes', participantesConectados);
    });

    socket.on('abrir_votacion', (opciones) => {
        estadoVotacion = { activa: true, opciones: opciones, fin: false };
        io.emit('votacion_abierta', opciones);
    });

    socket.on('cerrar_votacion', () => {
        estadoVotacion = { activa: false, opciones: null, fin: false };
        io.emit('votacion_cerrada');
    });

    socket.on('fin_simulacion', () => {
        estadoVotacion = { activa: false, opciones: null, fin: true };
        io.emit('simulacion_finalizada');
    });

    socket.on('voto_enviado', (opcion) => {
        io.emit('actualizar_votos', opcion);
    });

    socket.on('reiniciar_taller', () => {
        estadoVotacion = { activa: false, opciones: null, fin: false };
        participantesConectados = 0; 
        dispositivosUnicos = {}; // Vaciamos el registro de celulares
        io.emit('expulsar_clientes'); 
        io.emit('actualizar_participantes', participantesConectados);
    });

    socket.on('disconnect', () => {
        // Al desconectarse, verificamos si era un celular con ID registrado
        if (socket.isParticipante && socket.deviceId) {
            dispositivosUnicos[socket.deviceId]--;
            
            // Si el dispositivo ya no tiene NINGUNA pestaña abierta, restamos del contador general
            if (dispositivosUnicos[socket.deviceId] <= 0) {
                participantesConectados--;
                delete dispositivosUnicos[socket.deviceId]; // Lo borramos del registro
            }
            
            io.emit('actualizar_participantes', participantesConectados);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});