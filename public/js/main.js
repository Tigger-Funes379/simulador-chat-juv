const socket = io();

let contadores = { A: 0, B: 0, C: 0 };
let enModoVotacion = false;
let perspectivaActual = 'Nico'; 

const chatContainer = document.getElementById('chat-container');
const overlayParada = document.getElementById('overlay-parada');
const overlayFin = document.getElementById('overlay-fin');

// 1. Cargamos las imágenes correspondientes a cada escena
const guion = [
    // --- ESCENA 1: GRUPO (Perspectiva Nico) ---
    { 
        tipo: 'cambio_escena', 
        perspectiva: 'Nico', 
        titulo: 'Promo 5to - Oficial 🎓🔥', 
        subtitulo: 'Nico, Sofí, Mati, Camila, Lucas...',
        avatar: 'https://lh3.googleusercontent.com/d/1X5Xb1bL717-E5-fIAn509R8rS3L9yDnG' // Avatar grupal interactivo
    },
    { tipo: 'msj', emisor: 'Nico', texto: 'Che, ¿alguien vio el buzo que dejé en el banco de atrás? Tenía $15.000 adentro para la fotocopiadora.' },
    { tipo: 'msj', emisor: 'Sofí', texto: 'Yo no vi nada.' },
    { tipo: 'msj', emisor: 'Mati', texto: 'Yo tampoco, pero recién lo vi a Lucas guardando algo rápido en la mochila antes de salir al recreo 👀.' },
    { tipo: 'msj', emisor: 'Nico', texto: 'Naaa, ¿posta? Lucas no seas careta, devolveme la plata loco.' },
    { tipo: 'msj', emisor: 'Lucas', texto: '¿Qué flashan? Yo guardé mi botellita de agua. No toqué la plata de nadie, dejen de acusar sin saber.' },
    { tipo: 'msj', emisor: 'Camila', texto: '📷 (Foto de Lucas editada con sticker de "CHORRO")' },
    { tipo: 'msj', emisor: 'Mati', texto: 'JAAAAJAJAJA 💀💀💀' },
    { tipo: 'msj', emisor: 'Camila', texto: 'Si no aparece la plata, esta foto va directo al perfil del colegio o a un sticker para todos los grupos.' },
    { 
        tipo: 'parada', numero: 1, 
        titulo: 'La decisión del grupo ante la difamación',
        pregunta: '¿Qué hace el resto del grupo de WhatsApp ante la foto y el mensaje de Camila?',
        opciones: { 
            A: 'La Ola: Mandan stickers y reenvían', 
            B: 'El Silencio: Ignoran el tema', 
            C: 'El Freno: Piden que borren la foto' 
        },
        ramificacion: {
            opcionA_B: [
                { tipo: 'sistema', texto: 'La foto fue reenviada 14 veces.' },
                { 
                    tipo: 'cambio_escena', 
                    perspectiva: 'Lucas', 
                    titulo: 'Número Desconocido', 
                    subtitulo: 'en línea',
                    avatar: 'https://lh3.googleusercontent.com/d/1X6Yc2cL718-F6-gJBo619S9tT4Mz0eHh' // Avatar de número incógnito misterioso
                },
                { tipo: 'sistema', texto: '⚠️ RIESGO DETECTADO: Delito contra la Intimidad / Coacción (Apriete) / Difamación.' }
            ],
            opcionC: [
                { tipo: 'msj', emisor: 'Sofí', texto: 'Pará Cami, borrá eso. No da acusar ni subir fotos sin saber, nos vamos a comer un garrón todos.' },
                { tipo: 'msj', emisor: 'Camila', texto: 'A mí no me van a decir qué hacer.' },
                { tipo: 'sistema', texto: 'Camila manda la amenaza por un grupo paralelo. Sin intervención institucional o adulta, la presión continúa por privado.' },
                { 
                    tipo: 'cambio_escena', 
                    perspectiva: 'Lucas', 
                    titulo: 'Número Desconocido', 
                    subtitulo: 'en línea',
                    avatar: 'https://lh3.googleusercontent.com/d/1X6Yc2cL718-F6-gJBo619S9tT4Mz0eHh' // Avatar de número incógnito misterioso
                },
                { tipo: 'sistema', texto: '⚠️ RIESGO DETECTADO: Delito contra la Intimidad / Coacción (Apriete) / Difamación.' }
            ]
        }
    },

    // --- ESCENA 2: CHAT PRIVADO (Perspectiva Lucas) ---
    { tipo: 'msj', emisor: 'Número Desconocido', texto: 'Tenés hasta la salida para poner los $15.000 de Nico más $10.000 "de multa" por hacerte el gil, o la foto circula por todo el colegio y les avisamos a tus viejos.' },
    { tipo: 'msj', emisor: 'Lucas', texto: 'No tengo esa plata, no fui yo. Borren eso por favor, me están arruinando.' },
    { tipo: 'sistema', texto: 'Lucas bloquea el celular, no entra a la siguiente hora de clase y se va solo a la plaza de enfrente.' },
    { 
        tipo: 'parada', numero: 2, 
        titulo: 'El punto de quiebre y la intervención',
        pregunta: 'Lucas está en la plaza desbordado y asustado. ¿Qué camino toma la situación en este momento?',
        opciones: { 
            A: 'Llegada de la Denuncia Judicial', 
            B: 'Intervención Institucional / Gabinete', 
            C: 'Justicia por mano propia' 
        }
    },

    // --- ESCENA 3: LAS CONSECUENCIAS (Perspectiva Nico) ---
    { 
        tipo: 'cambio_escena', 
        perspectiva: 'Nico', 
        titulo: 'Promo 5to - Oficial 🎓🔥', 
        subtitulo: 'Nico, Sofí, Mati, Camila, Lucas...',
        avatar: 'https://lh3.googleusercontent.com/d/1X5Xb1bL717-E5-fIAn509R8rS3L9yDnG' // De vuelta al avatar grupal interactivo
    },
    { tipo: 'sistema', texto: 'Lunes, 10:30 AM. Tres días después.' },
    { tipo: 'msj', emisor: 'Nico', texto: 'Gente, me llegó una citación de la fiscalía a mi casa. Mis viejos me quieren matar.' },
    { tipo: 'msj', emisor: 'Camila', texto: 'A mí también... dicen que la directora presentó capturas de pantalla y la justicia intervino.' },
    { tipo: 'msj', emisor: 'Mati', texto: 'Pero pará, ¡si era una joda! No hicimos nada grave, somos menores de edad.' },
    { tipo: 'sistema', texto: 'Llegó la notificación formal de la Fiscalía Penal Juvenil al colegio y a las familias de Camila, Mati y Nico.' },
    { 
        tipo: 'parada', numero: 3, 
        titulo: 'Resolución y consecuencias (Empalme Teórico)',
        pregunta: '¿Qué creen que pasa ahora según la Ley 27.801?',
        opciones: { 
            A: 'Son menores: amonestación en la escuela y no pasa nada más.', 
            B: 'Prisión directa en un calabozo y a los padres no les dicen nada.', 
            C: 'Causa penal juvenil, reparación y los padres responden económicamente.' 
        }
    },

    // --- FIN DE LA SIMULACIÓN ---
    { tipo: 'fin_simulacion' }
];

let pasoActual = 0;

// 2. Hacemos que "cambio_escena" actualice el avatar de forma interactiva
function avanzarHistoria() {
    if (enModoVotacion || pasoActual >= guion.length) return;

    const actual = guion[pasoActual];

    if (actual.tipo === 'cambio_escena') {
        chatContainer.innerHTML = '';
        perspectivaActual = actual.perspectiva;
        document.getElementById('chat-titulo').innerText = actual.titulo;
        document.getElementById('chat-subtitulo').innerText = actual.subtitulo;
        
        // Actualizamos la foto de perfil en el avatar si existe en el objeto
        if (actual.avatar) {
            document.getElementById('chat-avatar').src = actual.avatar;
        }
        
        pasoActual++;
        avanzarHistoria(); 
        return;
    }

    if (actual.tipo === 'msj') {
        const alineacion = (actual.emisor === perspectivaActual) ? 'der' : 'izq';
        chatContainer.innerHTML += `
            <div class="mensaje ${alineacion}">
                <span class="emisor emisor-${actual.emisor}">${actual.emisor}</span> 
                <span class="texto">${actual.texto}</span>
            </div>
        `;
    } else if (actual.tipo === 'sistema') {
        chatContainer.innerHTML += `<div class="mensaje-sistema"><span>${actual.texto}</span></div>`;
    } else if (actual.tipo === 'parada') {
        enModoVotacion = true;
        document.getElementById('overlay-titulo').innerText = `🛑 PARADA ${actual.numero}: ${actual.titulo}`;
        document.getElementById('overlay-pregunta').innerText = actual.pregunta;
        document.getElementById('texto-A').innerText = actual.opciones.A;
        document.getElementById('texto-B').innerText = actual.opciones.B;
        document.getElementById('texto-C').innerText = actual.opciones.C;
        overlayParada.style.display = 'flex';

        socket.emit('abrir_votacion', actual.opciones);
        
    } else if (actual.tipo === 'fin_simulacion') {
        overlayFin.style.display = 'flex';
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
    pasoActual++;
}

socket.on('actualizar_votos', (opcion) => {
    if (enModoVotacion && contadores[opcion] !== undefined) {
        contadores[opcion]++;
        document.getElementById(`votos-${opcion}`).innerText = contadores[opcion];
    }
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        avanzarHistoria();
    } else if (e.code === 'Enter' && enModoVotacion) {
        enModoVotacion = false;
        overlayParada.style.display = 'none';
        
        let ganador = 'A'; 
        let maxVotos = contadores.A;
        if (contadores.B > maxVotos) { ganador = 'B'; maxVotos = contadores.B; }
        if (contadores.C > maxVotos) { ganador = 'C'; maxVotos = contadores.C; }

        let paradaActual = guion[pasoActual - 1];
        if (paradaActual.ramificacion) {
            let ramaElegida = [];
            if (ganador === 'A' || ganador === 'B') {
                ramaElegida = paradaActual.ramificacion.opcionA_B;
            } else if (ganador === 'C') {
                ramaElegida = paradaActual.ramificacion.opcionC;
            }
            guion.splice(pasoActual, 0, ...ramaElegida);
        }

        contadores = { A: 0, B: 0, C: 0 };
        document.getElementById('votos-A').innerText = '0';
        document.getElementById('votos-B').innerText = '0';
        document.getElementById('votos-C').innerText = '0';
        
        socket.emit('cerrar_votacion'); 
        
        avanzarHistoria();
    }
});

avanzarHistoria();