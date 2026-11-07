// DATOS EDITABLES: textos, nombres, posiciones en el mapa y orden de la aventura.
// x, y = posición del lugar en el mapa (el mapa mide 800 x 1700).
// reveal = tamaño de la zona que se ilumina al descubrirlo. etq = [dx, dy] posición del nombre.
window.DATOS = {
  portada: {
    titulo: 'CRÓNICAS DE UN PEQUEÑO VIAJERO',
    subtitulo: 'El nuevo viaje del Caballero',
    intro: 'Hay lugares que esperan ser descubiertos y recuerdos que esperan ser creados. Esta vez, el camino es nuestro. ¿Estás preparado para comenzar?',
    boton: 'COMENZAR AVENTURA',
    hornetDice: [
      'Pequeño viajero, este reino guarda muchos secretos. Permíteme acompañarte y te mostraré aquellos caminos que aún no conoces.',
      'No importa cuán lejos nos lleve el camino, siempre habrá algo especial en recorrerlo contigo.',
      'Lo mejor de un viaje es con quién se recorre.'
    ]
  },

  // Orden obligatorio de la aventura, y luego los lugares de Manizales que se pueden descubrir en cualquier orden.
  orden: ['manizales', 'otono', 'ruiz', 'aguacerales', 'arenales', 'lunar', 'tumbas'],
  libres: ['catedral', 'cable', 'caldas27', 'mallplaza'],

  regiones: [
    { id: 'manizales', real: 'Manizales', fantasia: 'La ciudad al borde del reino', titulo: 'ECOS DEL BORDE',
      pista: 'Donde la montaña se asoma al vacío, hay una ciudad de torres y luces que nunca duerme del todo. Es la primera puerta de este viaje.',
      intro: 'Ciudad de la cordillera Central, reconocida por sus montañas, arquitectura, cultura cafetera y paisajes.',
      x: 430, y: 505, reveal: 160, etq: [0, 108] },
    { id: 'otono', real: 'Termales El Otoño', fantasia: 'Las aguas del descanso eterno', titulo: 'ECOS DEL DESCANSO',
      pista: 'Sigue el rastro del vapor que se eleva entre los árboles. Allí el agua guarda su calor y el tiempo parece ir más despacio.',
      intro: 'Complejo de aguas termales rodeado de naturaleza, jardines y espacios de descanso, en el entorno de Manizales y Villamaría.',
      x: 335, y: 905, reveal: 250, etq: [0, 92] },
    { id: 'ruiz', real: 'Nevado del Ruiz', fantasia: 'El dominio de las alturas', titulo: 'ECOS DE LAS ALTURAS',
      pista: 'El siguiente destino se encuentra donde el aire se vuelve más ligero y las montañas parecen tocar el cielo. Allí, el silencio guarda secretos de un mundo que duerme bajo las rocas.',
      intro: 'Volcán de la cordillera Central, en el Parque Nacional Natural Los Nevados. Páramo, alta montaña y paisajes volcánicos.',
      x: 610, y: 1130, reveal: 250, etq: [0, 78] },
    { id: 'aguacerales', real: 'Aguacerales', fantasia: 'El jardín que bebe la niebla', titulo: 'ECOS DE LA NIEBLA',
      pista: 'La niebla baja hasta tocar el suelo y cada planta guarda gotas como pequeños tesoros. Camina despacio: este jardín no se deja ver con prisa.',
      intro: 'Sector del recorrido donde se observan elementos del ecosistema de páramo, como musgos y vegetación adaptada a la alta montaña.',
      x: 470, y: 1275, reveal: 150, etq: [0, 62] },
    { id: 'arenales', real: 'Arenales', fantasia: 'Las tierras del polvo antiguo', titulo: 'ECOS DEL POLVO',
      pista: 'El suelo cambia: ya no hay hierba, sino arena fina y viento seco. Dicen que cada grano de este lugar recuerda algo muy antiguo.',
      intro: 'Sector del recorrido de terrenos arenosos y paisajes de transición hacia el superpáramo.',
      x: 640, y: 1385, reveal: 150, etq: [0, 66] },
    { id: 'lunar', real: 'Valle Lunar', fantasia: 'Un mundo fuera de Hallownest', titulo: 'ECOS DE OTRO MUNDO',
      pista: 'Si cierras los ojos y los abres aquí, creerás haber dejado el reino. Todo es gris, silencioso y extraño, como si perteneciera a otro cielo.',
      intro: 'Paisaje de apariencia lunar, con formaciones rocosas, tonalidades particulares y escasa vegetación.',
      x: 490, y: 1500, reveal: 150, etq: [0, 62] },
    { id: 'tumbas', real: 'Valle de las Tumbas', fantasia: 'El último rincón del reino', titulo: 'ECOS DEL SILENCIO',
      pista: 'Al final del camino, las rocas se alzan como guardianas dormidas. Aquí nadie habla; solo el viento y nosotros.',
      intro: 'Sector de gran atractivo paisajístico, conocido también como Valle del Silencio o Valle de la Soledad.',
      x: 650, y: 1600, reveal: 150, etq: [0, 66] },
    { id: 'catedral', real: 'Catedral de Manizales', fantasia: 'La catedral de los ecos', titulo: 'ECOS DE LA TORRE',
      pista: 'Busca una torre que se eleva sobre los tejados. Dentro, la piedra parece repetir cada paso.',
      intro: 'Catedral Basílica de Nuestra Señora del Rosario, símbolo arquitectónico de la ciudad, de estilo neogótico y con una imponente torre.',
      x: 265, y: 440, reveal: 150, etq: [0, 168] },
    { id: 'cable', real: 'Cable Aéreo', fantasia: 'El sendero suspendido', titulo: 'ECOS SUSPENDIDOS',
      pista: 'Un camino sin suelo te espera: cables en el aire y una pequeña cabina que sube despacio. Desde arriba, la ciudad parece un reino de luces.',
      intro: 'Sistema de transporte que permite observar Manizales desde las alturas y conectar diferentes sectores de la ciudad.',
      x: 585, y: 418, reveal: 150, etq: [-6, -52] },
    { id: 'caldas27', real: 'Caldas27', fantasia: 'El taller de los sueños', titulo: 'ECOS DEL TALLER',
      pista: 'Hay un rincón donde el aroma del café se mezcla con pinceles y colores. No es un destino para mirar, sino para crear algo con las manos, juntos.',
      intro: 'Restaurante, café y repostería que además ofrece pintura de cerámica. Una parada creativa para hacer una actividad juntos.',
      x: 105, y: 512, reveal: 120, etq: [0, 98] },
    { id: 'mallplaza', real: 'Mallplaza', fantasia: 'El refugio de los viajeros', titulo: 'ECOS DEL REFUGIO',
      pista: 'Cuando el camino pide una pausa, existe un refugio de luces, aromas y mesas compartidas. Un lugar para descansar antes de seguir.',
      intro: 'Centro comercial con gastronomía, tiendas, entretenimiento y espacios para compartir.',
      x: 702, y: 512, reveal: 120, etq: [0, 98] },
    { id: 'santuario', real: 'El Reposo de Joni', fantasia: 'El santuario de las alas dormidas', titulo: 'ECOS DE LAS ALAS',
      pista: 'Más allá de las tierras recorridas y de los caminos que el Caballero ha logrado descubrir, existe un pequeño santuario donde el tiempo parece detenerse.\n\nEntre antiguas rocas, delicados cristales y mariposas que descansan en silencio, se encuentra un refugio reservado para quienes han llegado al final de su travesía.\n\nAquí no hay nuevos caminos que conquistar ni territorios que explorar. Solo un lugar donde las alas encuentran descanso y donde cada viajero puede detenerse a contemplar todo aquello que ha recorrido.\n\nPequeño Caballero, has llegado al último rincón de este mundo. Es momento de descansar y descubrir lo que este santuario guarda para ti.',
      intro: '', x: 400, y: 2165, reveal: 270, etq: [0, 128] }
  ],

  // Caminos que se encienden en dorado cuando se descubre cada lugar.
  caminos: {
    manizales: '',
    otono: 'M430 566 L430 640 C430 680 380 700 350 740 C330 790 335 840 335 905',
    ruiz: 'M335 905 C360 980 450 1010 520 1060 C560 1085 590 1105 610 1130',
    aguacerales: 'M610 1130 C580 1190 520 1230 470 1275',
    arenales: 'M470 1275 C520 1300 580 1340 640 1385',
    lunar: 'M640 1385 C590 1420 540 1450 490 1500',
    tumbas: 'M490 1500 C540 1540 600 1570 650 1600',
    catedral: 'M430 566 L265 566 L265 450',
    caldas27: 'M265 566 L105 566 L105 520',
    cable: 'M430 566 L472 520 L585 420',
    mallplaza: 'M585 566 L702 566 L702 520',
    santuario: 'M650 1600 C650 1690 620 1760 560 1840 C500 1910 440 1980 412 2050 C402 2100 400 2135 400 2160'
  },

  // Escena de Hornet y el Caballero al completar todos los destinos (se puede editar libremente).
  finalAnuncio: [
    'Pequeño Caballero, hemos recorrido juntos caminos desconocidos, atravesado tierras misteriosas y descubierto rincones que parecían existir únicamente en las leyendas.',
    'Espero que hayas disfrutado cada paso de esta travesía, porque cada lugar que hemos visitado guarda un pequeño recuerdo de nuestra aventura.',
    'Pero no creas que nuestro viaje ha terminado…',
    'Más allá de las tierras que hemos recorrido, existe un último territorio que permanece oculto, un rincón que no aparece en los mapas antiguos ni en las historias de Hallownest.',
    'Sus caminos aún esperan ser descubiertos y sus secretos permanecen bajo un velo de niebla.',
    'Ven, sígueme una vez más, pequeño Caballero. Todavía nos queda un último lugar por descubrir.'
  ],


  // Carta final de Hornet (cada elemento es un párrafo; los dos últimos forman la firma).
  carta: [
    'Pequeño Caballero…',
    'Hemos llegado al final de esta travesía. Juntos recorrimos tierras desconocidas, descubrimos rincones escondidos y seguimos caminos que nos llevaron mucho más lejos de lo que imaginábamos.',
    'Cada lugar dejó una huella, cada paisaje nos regaló un instante y cada pequeño descubrimiento se convirtió en un eco que permanecerá con nosotros incluso cuando regresemos a casa.',
    'Pero quiero que recuerdes algo…',
    'Por más grandes que sean los reinos que recorras, por más lejos que te lleven tus pasos y por más difíciles que parezcan algunos caminos, nunca olvides que no tienes que recorrerlos solo.',
    'Existen personas que te quieren, que creen en ti, que celebran tus alegrías y que desean verte alcanzar cada uno de tus sueños.',
    'Personas que estarán a tu lado cuando el camino sea tranquilo, pero también cuando lleguen las tormentas, cuando aparezcan nuevos desafíos o cuando no sepas qué dirección tomar.',
    'Quiero que nunca dudes de cuánto te aman, de cuánto te apoyan y de lo importante que eres para cada una de ellas.',
    'Y recuerda, Caballero: aquí también estará Hornet. Para acompañarte en cada paso, esperarte en cada nuevo sendero, caminar contigo por tierras desconocidas y celebrar a tu lado cada pequeña victoria.',
    'Porque si algo he aprendido durante esta aventura, es que los mejores viajes no se recuerdan únicamente por los lugares que visitamos, sino por las personas con quienes compartimos el camino.',
    'Gracias por permitirme acompañarte en este viaje.',
    'Y si alguna vez vuelves a perderte entre los caminos de este mundo, solo tendrás que recordar que siempre habrá alguien dispuesto a encontrarte y caminar a tu lado una vez más.',
    'Con cariño,',
    'Hornet'
  ],
  fraseFinal: 'La aventura termina, pero los ecos de este viaje permanecerán para siempre',
  tituloFinal: 'Crónicas de un pequeño viajero',

  dialogos: {
    intro1: 'Pequeño viajero, no todos los caminos están abiertos todavía. Sígueme y descubriremos juntos los secretos que guarda este reino.',
    intro2: 'Pequeño viajero, aún faltan caminos por abrir. Sígueme y descubriremos juntos los secretos que faltan en este reino.',
    bloqueada: 'Este camino todavía permanece oculto. Hay otros rincones del reino que esperan ser descubiertos primero.',
    descubrimiento: 'Lo has encontrado. Otro rincón del mundo ya forma parte de nuestra historia.',
    guia: 'Sigue el brillo dorado, pequeño viajero. Ese es el camino que se abre ahora.',
    fin: 'Ya recorrimos todos los caminos del reino. Cada lugar guarda ahora un eco de nosotros.',
    completada: 'Otro pequeño recuerdo que ahora pertenece a nuestra historia.'
  }
};
