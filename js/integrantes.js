
"use strict";

// Funciones oficiales del departamento.
const funcionesLVD = {
  "Líder": {
    nombre: "Aarón Israel Sánchez",
    funciones: `Supervisar las actividades del comité territorial y el desempeño de los líderes locales bajo su responsabilidad, lo que implica realizar visitas a las iglesias y mantener una comunicación constante con los líderes locales y el líder nacional. Durante las reuniones territoriales, será el responsable principal de presentar los planes de trabajo y los informes previos; en caso de requerirse, gestionará los permisos ante las autoridades correspondientes, asumiendo la responsabilidad principal.`
  },

  "Sublíder": {
    nombre: "Rut Geraldine Vega",
    funciones: `Como sublíder y colaborador directo del líder territorial, tiene facultades para asumir sus responsabilidades en caso de ausencia, por lo que se convierte en el segundo responsable inmediato. Sus funciones incluyen la supervisión operativa, las visitas a las iglesias y la comunicación con los líderes locales.`
  },

  "Secretaria": {
    nombre: "Elizabeth Ramírez Bautista",
    funciones: `Programar visitas, gestionar el control operativo y administrar la agenda del comité, lo cual comprende la supervisión de calendarios, planificadores y recordatorios de citas y reuniones; el registro de asistencia de líderes locales a reuniones y eventos; el control de datos personales (altas y bajas); la coordinación de reuniones virtuales (generación de formularios, encuestas, proyección de pantalla, entre otros), así como la administración de los comités. Es la responsable principal del correo del comité territorial, con la obligación de organizar la información en carpetas específicas; se encargará de mantener el orden en los reportes de visitas y actividades para elaborar el informe correspondiente; además, administrará los datos de las cooperaciones, el control de formularios y los reportes mediante Google Forms de los líderes locales, así como el llenado del reporte territorial.

Otra de sus funciones clave es el control de gestión: definición de objetivos, establecimiento de estándares, diseño de programas de acción (presupuestos), uso de recursos, medición de resultados (verificación), análisis de desviaciones y corrección del desempeño o mejora continua.`
  },

  "Tesorera": {
    nombre: "Abigail Reyes Santiago",
    funciones: `Responsable de la administración de ingresos y egresos, con atribuciones para elaborar y entregar reportes de tesorería, así como informes y análisis del estado financiero. Recauda los recursos proporcionados por los líderes locales y, en caso de ser necesario, los entrega al tesorero nacional. Optimiza los costos de financiamiento, previene desequilibrios presupuestales y asegura la disponibilidad de fondos; supervisa el efectivo disponible y proyecta las necesidades futuras de liquidez, además de gestionar y medir riesgos. Crea y administra la cuenta bancaria del territorio central, controla y ejecuta las transacciones monetarias, recibe facturas, boletas de venta y comprobantes para pago con cheque, prepara las autorizaciones de pago emitidas por el líder y la secretaría, y expide recibos y cheques según se requiera.`
  },

  "Medios digitales": {
    nombre: "Yair Tereso Ramírez",
    funciones: `Responsable de elaborar los listados para la publicación de las fotografías del comité, así como de la difusión de eventos, anuncios de reuniones y recordatorios en redes sociales. Encargado del control de las páginas web y de la generación de formularios relacionados con los eventos (encuestas). Una vez editadas las imágenes, se encargará de su publicación en las redes sociales disponibles.

Diseñará y difundirá mensajes mediante recursos gráficos y digitales: infografías, trípticos, revistas, folletos, presentaciones, videos (promocionales e informativos), animaciones, collages, periódicos murales, distintivos (pines, gafetes), pancartas, carteles, logotipos representativos de los eventos y talones de tesorería. Durante los eventos, será el responsable de la captura de fotografía y video, así como de su edición correspondiente.`
  }
};

const listaIntegrantes = document.querySelector("#member-list");
const seccionIntegrantes = document.querySelector("#integrantes");

function decorarIntegrantes() {
  if (!listaIntegrantes) return;

  const tarjetas = listaIntegrantes.querySelectorAll(".card");

  tarjetas.forEach((tarjeta) => {
    if (tarjeta.dataset.decorada === "true") return;

    const cargoOriginal = tarjeta.querySelector(".card-number");
    const nombreOriginal = tarjeta.querySelector("h3");

    if (!cargoOriginal || !nombreOriginal) return;

    const cargo = Object.keys(funcionesLVD).find(
      clave => clave.toLowerCase() ===
        cargoOriginal.textContent.trim().toLowerCase()
    );

    if (!cargo) return;

    const informacion = funcionesLVD[cargo];

    tarjeta.dataset.decorada = "true";
    tarjeta.classList.add("lvd-member-card");

    cargoOriginal.textContent = cargo;
    nombreOriginal.textContent = informacion.nombre;

    const detalles = document.createElement("details");
    detalles.className = "lvd-member-details";

    const resumen = document.createElement("summary");
    resumen.textContent = "Ver funciones y responsabilidades";

    const contenido = document.createElement("div");
    contenido.className = "lvd-member-functions";

    informacion.funciones.split(/\n\s*\n/).forEach(parrafo => {
      const p = document.createElement("p");
      p.textContent = parrafo.trim();
      contenido.appendChild(p);
    });

    detalles.append(resumen, contenido);
    tarjeta.appendChild(detalles);
  });
}

// El archivo app.js carga los integrantes de forma asíncrona.
// Este observador permite decorar las tarjetas cuando aparezcan.
if (listaIntegrantes) {
  const observador = new MutationObserver(() => {
    observador.disconnect();
    decorarIntegrantes();
    observador.observe(listaIntegrantes, { childList: true });
  });

  observador.observe(listaIntegrantes, { childList: true });
  decorarIntegrantes();
}

// Botón para cambiar la combinación de colores.
if (seccionIntegrantes) {
  const encabezado = seccionIntegrantes.querySelector(".section-heading");

  if (encabezado) {
    const botonTema = document.createElement("button");
    botonTema.type = "button";
    botonTema.className = "button button-small lvd-theme-button";

    const temaGuardado = localStorage.getItem("lvd-tema-integrantes");
    if (temaGuardado === "colorido") {
      seccionIntegrantes.classList.add("lvd-colorido");
    }

    function actualizarBoton() {
      botonTema.textContent =
        seccionIntegrantes.classList.contains("lvd-colorido")
          ? "✦ Volver a colores clásicos"
          : "✦ Activar colores vivos";
    }

    botonTema.addEventListener("click", () => {
      seccionIntegrantes.classList.toggle("lvd-colorido");

      localStorage.setItem(
        "lvd-tema-integrantes",
        seccionIntegrantes.classList.contains("lvd-colorido")
          ? "colorido"
          : "clasico"
      );

      actualizarBoton();
    });

    actualizarBoton();
    encabezado.appendChild(botonTema);
  }
}
