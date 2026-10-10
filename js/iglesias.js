
"use strict";

const db = typeof supabaseClient !== "undefined" ? supabaseClient : null;
const directory = document.querySelector("#directory");
const search = document.querySelector("#buscar-iglesia");
const programTitle = document.querySelector("#program-church");
const steps = document.querySelector("#program-steps");
const count = document.querySelector("#search-count");
const empty = document.querySelector("#empty-result");
const editor = document.querySelector("#program-editor");
const editorRows = document.querySelector("#editor-rows");
const status = document.querySelector("#editor-status");
const editButton = document.querySelector("#edit-program");
const cycleName = "Segunda mitad del semestre 2026";

let churches = [];
let members = [];
let current = null;
let cycleId = null;
let entries = [];
let busy = false;

const friendly = church => church.ubicacion
  ? `${church.nombre} «${church.ubicacion}»`
  : church.nombre;

function message(value, isError = false) {
  status.textContent = value;
  status.style.color = isError ? "#b42318" : "";
}

function setBusy(value) {
  busy = value;
  editor.querySelectorAll("button, input, select")
    .forEach(el => el.disabled = value);
  editButton.disabled = value;
}

async function loadEntries() {
  const { data, error } = await db
    .from("actividades_programa")
    .select("id,iglesia_id,nombre,orden,integrante_id")
    .eq("ciclo_id", cycleId)
    .eq("iglesia_id", current.id)
    .order("orden");

  if (error) throw error;
  entries = data;
}

function memberName(id) {
  return members.find(m => m.id === id)?.nombre || "Sin responsable";
}

function renderProgram() {
  programTitle.textContent = friendly(current);
  steps.replaceChildren();

  if (!entries.length) {
    const li = document.createElement("li");
    li.textContent = "No hay actividades registradas.";
    steps.append(li);
  }

  entries.forEach((entry, i) => {
    const li = document.createElement("li");
    li.className = "program-step";

    const number = document.createElement("span");
    number.className = "step-number";
    number.textContent = String(i + 1).padStart(2, "0");

    const details = document.createElement("div");
    details.className = "step-details";

    const activity = document.createElement("strong");
    activity.textContent = entry.nombre;

    const person = document.createElement("span");
    person.textContent = memberName(entry.integrante_id);

    details.append(activity, person);
    li.append(number, details);
    steps.append(li);
  });
}

function makeButton(text, handler, className = "button button-small") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", handler);
  return button;
}

function requireSuccess(result) {
  if (result.error) throw result.error;
  return result.data;
}

async function execute(action, successText) {
  if (busy) return;

  setBusy(true);
  message("Guardando cambios en Supabase…");

  try {
    await action();
    await loadEntries();
    renderProgram();
    renderEditor();
    message(successText);
  } catch (error) {
    console.error(error);
    message("Error al guardar: " + error.message, true);

    try {
      await loadEntries();
      renderProgram();
      renderEditor();
    } catch (_) {}
  } finally {
    setBusy(false);
  }
}

function renderEditor() {
  editorRows.replaceChildren();

  entries.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "editor-item";

    const heading = document.createElement("strong");
    heading.textContent = `Actividad ${index + 1}`;

    const name = document.createElement("input");
    name.type = "text";
    name.value = entry.nombre;
    name.maxLength = 160;
    name.className = "search-input";

    const person = document.createElement("select");
    person.className = "search-input";

    person.add(new Option("Sin responsable", ""));

    members.forEach(member => {
      person.add(new Option(member.nombre, String(member.id)));
    });

    person.value = entry.integrante_id == null
      ? ""
      : String(entry.integrante_id);

    const actions = document.createElement("div");
    actions.className = "editor-actions";

    const save = makeButton("Guardar actividad", () => {
      const value = name.value.trim();

      if (!value) {
        message("Escribe un nombre para la actividad.", true);
        return;
      }

      execute(async () => {
        requireSuccess(await db
          .from("actividades_programa")
          .update({
            nombre: value,
            integrante_id: person.value
              ? Number(person.value)
              : null
          })
          .eq("id", entry.id)
          .eq("ciclo_id", cycleId)
          .eq("iglesia_id", current.id));
      }, "Actividad actualizada correctamente.");
    });

    const up = makeButton("↑", () => move(entry, -1));
    const down = makeButton("↓", () => move(entry, 1));

    up.title = "Subir actividad";
    down.title = "Bajar actividad";

    up.disabled = index === 0;
    down.disabled = index === entries.length - 1;

    const remove = makeButton("Quitar", () => {
      const confirmed = window.confirm(
        `¿Quieres quitar "${entry.nombre}" de este programa?`
      );

      if (!confirmed) return;

      execute(async () => {
        requireSuccess(await db
          .from("actividades_programa")
          .delete()
          .eq("id", entry.id)
          .eq("ciclo_id", cycleId)
          .eq("iglesia_id", current.id));
      }, "Actividad eliminada correctamente.");
    });

    actions.append(save, up, down, remove);
    row.append(heading, name, person, actions);
    editorRows.append(row);
  });
}

async function move(entry, direction) {
  const index = entries.findIndex(e => e.id === entry.id);
  const other = entries[index + direction];

  if (!other) return;

  execute(async () => {
    const temporary =
      Math.max(0, ...entries.map(e => e.orden)) + 1000;

    requireSuccess(await db
      .from("actividades_programa")
      .update({ orden: temporary })
      .eq("id", entry.id));

    requireSuccess(await db
      .from("actividades_programa")
      .update({ orden: entry.orden })
      .eq("id", other.id));

    requireSuccess(await db
      .from("actividades_programa")
      .update({ orden: other.orden })
      .eq("id", entry.id));
  }, "Orden de actividades actualizado.");
}

async function selectChurch(church, scroll = true) {
  if (busy) return;

  current = church;
  editor.hidden = true;
  editButton.textContent = "Editar orden de culto";
  message("");

  programTitle.textContent = friendly(church);
  steps.replaceChildren();

  const loading = document.createElement("li");
  loading.textContent = "Cargando programa…";
  steps.append(loading);

  try {
    await loadEntries();
    renderProgram();
    renderEditor();
  } catch (error) {
    console.error(error);
    steps.replaceChildren();

    const li = document.createElement("li");
    li.textContent = "No se pudo cargar el programa.";
    steps.append(li);
  }

  document.querySelectorAll(".church-card").forEach(card => {
    const selected = Number(card.dataset.id) === church.id;

    card.classList.toggle("is-selected", selected);
    card.querySelector("button")
      .setAttribute("aria-pressed", String(selected));
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
    number.textContent =
      `CONGREGACIÓN ${String(church.position).padStart(2, "0")}`;

    const title = document.createElement("h3");
    title.textContent = friendly(church);

    const button = makeButton(
      "Ver orden de culto →",
      () => selectChurch(church),
      "card-link card-button"
    );

    button.setAttribute("aria-pressed", "false");

    card.append(number, title, button);
    directory.append(card);
  });

  count.textContent =
    `${found.length} iglesias encontradas`;

  empty.hidden = found.length !== 0;
}

editButton.addEventListener("click", () => {
  editor.hidden = !editor.hidden;

  editButton.textContent = editor.hidden
    ? "Editar orden de culto"
    : "Cerrar editor";

  if (!editor.hidden) renderEditor();
});

document.querySelector("#add-activity")
  .addEventListener("click", () => {
    const nameInput =
      document.querySelector("#new-activity-name");

    const memberSelect =
      document.querySelector("#new-activity-person");

    const name = nameInput.value.trim();

    if (!name) {
      message("Escribe el nombre de la nueva actividad.", true);
      return;
    }

    execute(async () => {
      const nextOrder =
        Math.max(0, ...entries.map(e => e.orden)) + 1;

      requireSuccess(await db
        .from("actividades_programa")
        .insert({
          ciclo_id: cycleId,
          iglesia_id: current.id,
          nombre: name,
          orden: nextOrder,
          integrante_id: memberSelect.value
            ? Number(memberSelect.value)
            : null
        }));

      nameInput.value = "";
    }, "Nueva actividad agregada correctamente.");
  });

search.addEventListener("input", renderDirectory);

document.querySelector("#print-program")
  .addEventListener("click", () => window.print());

document.querySelector("#year").textContent =
  new Date().getFullYear();

async function init() {
  count.textContent = "Cargando congregaciones…";

  try {
    if (!db) {
      throw new Error("No se cargó Supabase.");
    }

    const [churchResult, cycleResult, memberResult] =
      await Promise.all([
        db.from("iglesias")
          .select("id,nombre,ubicacion")
          .order("id"),

        db.from("ciclos")
          .select("id")
          .eq("nombre", cycleName)
          .limit(1),

        db.from("integrantes")
          .select("id,nombre,cargo")
          .order("id")
      ]);

    requireSuccess(churchResult);
    requireSuccess(cycleResult);
    requireSuccess(memberResult);

    if (!cycleResult.data.length) {
      throw new Error("No se encontró el ciclo.");
    }

    cycleId = cycleResult.data[0].id;
    members = memberResult.data;

    churches = churchResult.data.map((c, i) => ({
      ...c,
      position: i + 1
    }));

    renderDirectory();

    const addPerson =
      document.querySelector("#new-activity-person");

    addPerson.add(new Option("Sin responsable", ""));

    members.forEach(member => {
      addPerson.add(
        new Option(member.nombre, String(member.id))
      );
    });

    if (!churches.length) {
      throw new Error("No hay iglesias registradas.");
    }

    const param =
      new URLSearchParams(location.search).get("iglesia");

    const initial = churches.find(c =>
      (c.ubicacion || c.nombre).toLocaleLowerCase("es") ===
      param?.toLocaleLowerCase("es")
    ) || churches[0];

    await selectChurch(initial, false);

  } catch (error) {
    console.error(error);

    count.textContent =
      "Error al cargar: " + error.message;

    programTitle.textContent = "Datos no disponibles";
  }
}

init();
