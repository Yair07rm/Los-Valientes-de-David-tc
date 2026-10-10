
"use strict";

const directory = document.querySelector("#directory");
const search = document.querySelector("#buscar-iglesia");
const programTitle = document.querySelector("#program-church");
const steps = document.querySelector("#program-steps");
const count = document.querySelector("#search-count");
const empty = document.querySelector("#empty-result");

const cycleName = "Segunda mitad del semestre 2026";

let churches = [];
let current = null;
let programs = [];

const friendly = (church) => church.ubicacion
  ? `${church.nombre} «${church.ubicacion}»`
  : church.nombre;

function selectChurch(church, scroll = true) {
  current = church;
  programTitle.textContent = friendly(church);
  steps.replaceChildren();

  const assigned = programs
    .filter(p => p.iglesia_id === church.id)
    .sort((a, b) => a.actividades.orden - b.actividades.orden);

  if (!assigned.length) {
    const li = document.createElement("li");
    li.textContent = "Todavía no hay un programa registrado para este ciclo.";
    steps.append(li);
  }

  assigned.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "program-step";

    const number = document.createElement("span");
    number.className = "step-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const details = document.createElement("div");
    details.className = "step-details";

    const activity = document.createElement("strong");
    activity.textContent = item.actividades.nombre;

    const person = document.createElement("span");
    person.textContent = item.integrantes.nombre;

    details.append(activity, person);
    li.append(number, details);
    steps.append(li);
  });

  document.querySelectorAll(".church-card").forEach(card => {
    const selected = Number(card.dataset.id) === church.id;
    card.classList.toggle("is-selected", selected);
    card.querySelector("button").setAttribute("aria-pressed", String(selected));
  });

  const slug = church.ubicacion || church.nombre;
  history.replaceState(
    null,
    "",
    `${location.pathname}?iglesia=${encodeURIComponent(slug)}${scroll ? "#orden-culto" : ""}`
  );

  if (scroll) {
    document.querySelector("#orden-culto").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function renderDirectory() {
  directory.replaceChildren();

  const query = search.value.trim().toLocaleLowerCase("es");
  const found = churches.filter(c =>
    friendly(c).toLocaleLowerCase("es").includes(query)
  );

  found.forEach(church => {
    const card = document.createElement("article");
    card.className = "card church-card";
    card.dataset.id = church.id;

    const number = document.createElement("span");
    number.className = "card-number";
    number.textContent = `CONGREGACIÓN ${String(church.position).padStart(2, "0")}`;

    const title = document.createElement("h3");
    title.textContent = friendly(church);

    const button = document.createElement("button");
    button.className = "card-link card-button";
    button.type = "button";
    button.textContent = "Ver orden de culto →";
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => selectChurch(church));

    card.append(number, title, button);
    directory.append(card);
  });

  count.textContent = `${found.length} ${found.length === 1 ? "iglesia encontrada" : "iglesias encontradas"}`;
  empty.hidden = found.length !== 0;

  if (current) {
    document.querySelectorAll(".church-card").forEach(card => {
      const chosen = Number(card.dataset.id) === current.id;
      card.classList.toggle("is-selected", chosen);
      card.querySelector("button").setAttribute("aria-pressed", String(chosen));
    });
  }
}

async function init() {
  count.textContent = "Cargando congregaciones…";

  try {
    if (typeof supabaseClient === "undefined") {
      throw new Error("No se cargó la configuración de Supabase.");
    }

    const [churchResult, cycleResult] = await Promise.all([
      supabaseClient.from("iglesias")
        .select("id,nombre,ubicacion")
        .order("id"),
      supabaseClient.from("ciclos")
        .select("id")
        .eq("nombre", cycleName)
        .limit(1)
    ]);

    if (churchResult.error) throw churchResult.error;
    if (cycleResult.error) throw cycleResult.error;

    if (!cycleResult.data.length) {
      throw new Error("No se encontró el ciclo seleccionado.");
    }

    churches = churchResult.data.map((c, i) => ({
      ...c,
      position: i + 1
    }));

    const programResult = await supabaseClient
      .from("programas_culto")
      .select("iglesia_id, actividades(nombre,orden), integrantes(nombre)")
      .eq("ciclo_id", cycleResult.data[0].id);

    if (programResult.error) throw programResult.error;

    programs = programResult.data;
    renderDirectory();

    if (!churches.length) {
      throw new Error("No hay iglesias registradas.");
    }

    const param = new URLSearchParams(location.search).get("iglesia");

    const initial = churches.find(c =>
      (c.ubicacion || c.nombre).toLocaleLowerCase("es") ===
      param?.toLocaleLowerCase("es")
    ) || churches[0];

    selectChurch(initial, false);
  } catch (error) {
    console.error("Error al consultar Supabase:", error);
    count.textContent = "No se pudieron cargar los datos. Comprueba la conexión y las políticas de Supabase.";
    programTitle.textContent = "Datos no disponibles";
  }
}

search.addEventListener("input", renderDirectory);

document.querySelector("#print-program")
  .addEventListener("click", () => window.print());

document.querySelector("#year").textContent = new Date().getFullYear();

init();
