const socket = io();

let contadores = { A: 0, B: 0, C: 0 };
let enModoVotacion = false;
let perspectivaActual = 'Nico'; 

const chatContainer = document.getElementById('chat-container');
const overlayParada = document.getElementById('overlay-parada');
const overlayFin = document.getElementById('overlay-fin');

const guion = [
    // --- ESCENA 1: GRUPO (Perspectiva Nico) ---
    { tipo: 'cambio_escena', perspectiva: 'Nico', titulo: 'Promo 5to - Oficial 🎓🔥', subtitulo: 'Nico, Sofí, Mati, Camila, Lucas...' },
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
            A: 'La Ola: Todos mandan stickers de risa, reenvían la foto a otros grupos y ponen "Manden más contexto"', 
            B: 'El Silencio: Nadie dice nada, leen los mensajes pero dejan pasar la situación para no meterse en problemas.', 
            C: 'El Freno: Un compañero escribe en el grupo: "Pará Cami, borrá eso. No da acusar ni subir fotos sin saber, nos vamos a comer un garrón todos".' 
        },
        // NUEVO: Acá definimos qué pasa según quién gane
        ramificacion: {
            opcionA_B: [
                { tipo: 'sistema', texto: 'La foto fue reenviada 14 veces.' },
                { tipo: 'cambio_escena', perspectiva: 'Lucas', titulo: 'Número Desconocido', subtitulo: 'en línea' },
                { tipo: 'sistema', texto: '⚠️ RIESGO DETECTADO: Delito contra la Intimidad / Coacción (Apriete) / Difamación.' }
            ],
            opcionC: [
                { tipo: 'msj', emisor: 'Sofí', texto: 'Pará Cami, borrá eso. No da acusar ni subir fotos sin saber, nos vamos a comer un garrón todos.' },
                { tipo: 'msj', emisor: 'Camila', texto: 'A mí no me van a decir qué hacer.' },
                { tipo: 'sistema', texto: 'Camila manda la amenaza por un grupo paralelo. Sin intervención institucional o adulta, la presión continúa por privado.' },
                { tipo: 'cambio_escena', perspectiva: 'Lucas', titulo: 'Número Desconocido', subtitulo: 'en línea' },
                { tipo: 'sistema', texto: '⚠️ RIESGO DETECTADO: Delito contra la Intimidad / Coacción (Apriete) / Difamación.' }
            ]
        }
    },

    // --- ESCENA 2: CHAT PRIVADO (Perspectiva Lucas) ---
    // (Estos mensajes ocurren sí o sí después de la ramificación, ya que ambas ramas terminan en el chat de Lucas)
    { tipo: 'msj', emisor: 'Número Desconocido', texto: 'Tenés hasta la salida para poner los $15.000 de Nico más $10.000 "de multa" por hacerte el gil, o la foto circula por todo el colegio y les avisamos a tus viejos.' },
    { tipo: 'msj', emisor: 'Lucas', texto: 'No tengo esa plata, no fui yo. Borren eso por favor, me están arruinando.' },
    { tipo: 'sistema', texto: 'Lucas bloquea el celular, no entra a la siguiente hora de clase y se va solo a la plaza de enfrente.' },
    { 
        tipo: 'parada', numero: 2, 
        titulo: 'El punto de quiebre y la intervención',
        pregunta: 'Lucas está en la plaza desbordado y asustado. ¿Qué camino toma la situación en este momento?',
        opciones: { 
            A: 'Llegada de la Denuncia Judicial: Los padres de Lucas ven los mensajes, van directo a la comisaría y radican una denuncia por Coacción y Violencia Digital', 
            B: 'Intervención Institucional / Gabinete: Un compañero/a que vio el chat se acerca al Servicio de Orientación Escolar (SOE) / Directora y muestra las capturas antes de que explote afuera.', 
            C: 'Justicia por mano propia: Los amigos de Nico van a buscar a Lucas a la salida para sacarle las cosas de la mochila por la fuerza.' 
        }
    },

    // --- ESCENA 3: LAS CONSECUENCIAS (Perspectiva Nico) ---
    { tipo: 'cambio_escena', perspectiva: 'Nico', titulo: 'Promo 5to - Oficial 🎓🔥', subtitulo: 'Nico, Sofí, Mati, Camila, Lucas...' },
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
            A: 'Son menores de edad, no pasa nada, se resuelve con una amonestación en la escuela y fue.', 
            B: 'A los pibes los meten presos directamente en un calabozo y a los padres no les dicen nada.', 
            C: 'Se abre una causa penal juvenil (a partir de los 14 años), intervienen supervisores especializados, los padres responden económicamente por los daños y se aplican pautas de conducta o reparación comunitaria.' 
        }
    },

    // --- FIN DE LA SIMULACIÓN ---
    { tipo: 'fin_simulacion' }
];

let pasoActual = 0;

function avanzarHistoria() {
    if (enModoVotacion || pasoActual >= guion.length) return;

    const actual = guion[pasoActual];

    if (actual.tipo === 'cambio_escena') {
        chatContainer.innerHTML = '';
        perspectivaActual = actual.perspectiva;
        document.getElementById('chat-titulo').innerText = actual.titulo;
        document.getElementById('chat-subtitulo').innerText = actual.subtitulo;
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
        
        // --- LÓGICA PARA EVALUAR QUIÉN GANÓ LA VOTACIÓN ---
        let ganador = 'A'; // Por defecto
        let maxVotos = contadores.A;
        if (contadores.B > maxVotos) { ganador = 'B'; maxVotos = contadores.B; }
        if (contadores.C > maxVotos) { ganador = 'C'; maxVotos = contadores.C; }

        // Verificamos si la parada que acabamos de cerrar tenía ramas programadas
        let paradaActual = guion[pasoActual - 1];
        if (paradaActual.ramificacion) {
            let ramaElegida = [];
            if (ganador === 'A' || ganador === 'B') {
                ramaElegida = paradaActual.ramificacion.opcionA_B;
            } else if (ganador === 'C') {
                ramaElegida = paradaActual.ramificacion.opcionC;
            }
            // Insertamos la rama ganadora en el guion para que sea lo próximo en aparecer
            guion.splice(pasoActual, 0, ...ramaElegida);
        }
        // ----------------------------------------------------

        // Reiniciamos contadores en pantalla
        contadores = { A: 0, B: 0, C: 0 };
        document.getElementById('votos-A').innerText = '0';
        document.getElementById('votos-B').innerText = '0';
        document.getElementById('votos-C').innerText = '0';
        
        // Le avisamos al servidor que cierre los celulares
        socket.emit('cerrar_votacion'); 
        
        avanzarHistoria();
    }
});

// Iniciamos la simulación
avanzarHistoria();