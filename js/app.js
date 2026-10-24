
"use strict";

// Conexión a Supabase
const db = typeof supabaseClient !== "undefined"
  ? supabaseClient
  : null;

// Elementos de la página
const churchList = document.querySelector("#church-list");
const visitList = document.querySelector("#visit-list");
const memberList = document.querySelector("#member-list");

// Ciclo que actualmente mostramos en Inicio
const cycleName = "Segunda mitad del semestre 2026";

// Mostrar el nombre completo de una congregación
function churchName(church) {
  return church.ubicacion
    ? `${church.nombre} «${church.ubicacion}»`
    : church.nombre;
}

// Crear tarjetas de iglesias
function renderChurches(churches) {
  churchList.replaceChildren();

  churches.forEach((church, index) => {
    const card = document.createElement("article");
    card.className = "card";

    const number = document.createElement("span");
    number.className = "card-number";
    number.textContent =
      `CONGREGACIÓN ${String(index + 1).padStart(2, "0")}`;

    const heading = document.createElement("h3");
    heading.textContent = churchName(church);

    const link = document.createElement("a");
    link.className = "card-link";

    const identifier = church.ubicacion || church.nombre;

    link.href =
      `iglesias.html?iglesia=${encodeURIComponent(identifier)}`;

    link.textContent = "Ver orden de culto →";

    card.append(number, heading, link);
    churchList.append(card);
  });
}

// Crear tarjetas de integrantes
function renderMembers(members) {
  memberList.replaceChildren();

  members.forEach(member => {
    const card = document.createElement("article");
    card.className = "card";

    const label = document.createElement("span");
    label.className = "card-number";
    label.textContent = member.cargo.toUpperCase();

    const heading = document.createElement("h3");
    heading.textContent = member.nombre;

    card.append(label, heading);
    memberList.append(card);
  });
}

// Mostrar únicamente las visitas pendientes
function renderVisits(visits, churches) {
  visitList.replaceChildren();

  const pendingVisits = visits
    .filter(visit => visit.estado === "pending")
    .sort((a, b) => a.orden - b.orden);

  if (pendingVisits.length === 0) {
    const message = document.createElement("p");
    message.className = "note";
    message.textContent =
      "¡Todas las visitas de este ciclo están completadas!";

    visitList.append(message);
    return;
  }

  pendingVisits.forEach((visit, index) => {
    const church = churches.find(
      item => item.id === visit.iglesia_id
    );

    if (!church) return;

    const row = document.createElement("div");
    row.className = "visit";

    const number = document.createElement("span");
    number.className = "visit-index";
    number.textContent =
      String(index + 1).padStart(2, "0");

    const title = document.createElement("strong");
    title.textContent = churchName(church);

    const status = document.createElement("span");
    status.className = "status";
    status.textContent = "Pendiente";

    row.append(number, title, status);
    visitList.append(row);
  });
}

// Comprobar los resultados de Supabase
function checkResult(result) {
  if (result.error) {
    throw result.error;
  }

  return result.data;
}

// Cargar la información compartida
async function loadHome() {
  churchList.textContent = "Cargando iglesias...";
  memberList.textContent = "Cargando integrantes...";
  visitList.textContent = "Cargando visitas...";

  try {
    if (!db) {
      throw new Error(
        "No se pudo conectar con Supabase."
      );
    }

    // Consultar iglesias, integrantes y ciclo
    const [
      churchesResult,
      membersResult,
      cyclesResult
    ] = await Promise.all([
      db.from("iglesias")
        .select("id,nombre,ubicacion")
        .order("id"),

      db.from("integrantes")
        .select("id,nombre,cargo")
        .order("id"),

      db.from("ciclos")
        .select("id,nombre")
        .eq("nombre", cycleName)
        .limit(1)
    ]);

    const churches = checkResult(churchesResult);
    const members = checkResult(membersResult);
    const cycles = checkResult(cyclesResult);

    renderChurches(churches);
    renderMembers(members);

    if (!cycles.length) {
      throw new Error(
        "No se encontró el ciclo de visitas."
      );
    }

    // Consultar visitas guardadas en Supabase
    const visitsResult = await db
      .from("visitas_ciclo")
      .select("iglesia_id,orden,estado,fecha,hora")
      .eq("ciclo_id", cycles[0].id)
      .order("orden");

    const visits = checkResult(visitsResult);

    renderVisits(visits, churches);

  } catch (error) {
    console.error("Error al cargar Inicio:", error);

    const message =
      "No se pudieron cargar los datos: " +
      (error.message || "Error desconocido");

    if (churchList.textContent === "Cargando iglesias...") {
      churchList.textContent = message;
    }

    if (memberList.textContent === "Cargando integrantes...") {
      memberList.textContent = message;
    }

    visitList.textContent = message;
  }
}

// Año del pie de página
document.querySelector("#year").textContent =
  new Date().getFullYear();

// Iniciar
loadHome();
