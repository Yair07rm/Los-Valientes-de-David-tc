"use strict";
// Calendario compartido de Los Valientes de David (Supabase).
const $ = id => document.getElementById(id);
const db = typeof supabaseClient !== "undefined" ? supabaseClient : null;
const churchNames = [
  "Casa de Oración Monte de los Olivos «Tlalpizáhuac»",
  "Casa de Oración Topacio",
  "Casa de Oración Zafiro «Mazapil»",
  "Casa de Oración Bethesda «Cuautepec»",
  "Casa de Oración Bethel «Xalpa»",
  "Casa de Oración Bethel «Tepojaco»",
  "Casa de Oración La Nueva Jerusalén",
  "Casa de Oración Restauración «Xico»",
  "Casa de Oración Dios es Amor",
  "Casa de Oración «Ecatepec»"
];
const churchKeys = ["tlalpizahuac", "topacio", "mazapil", "cuautepec", "xalpa", "tepojaco", "nueva jerusalen", "xico", "dios es amor", "ecatepec"];
const baseOrder = [1,2,5,6,7,4,8,9,3,0];
const normalize = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]);
const today = new Date();
let shownYear = today.getFullYear(), shownMonth = today.getMonth();
let selectedDate = `${shownYear}-${String(shownMonth+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
let cycles = [], activeCycleId = null, churches = [], visits = [], busy = false;
const notice = $("storage-notice");
const report = (msg, error = false) => { notice.textContent = msg; notice.style.color = error ? "#b91c1c" : ""; };
function check(result) { if (result.error) throw result.error; return result.data; }
function churchIndex(row) {
  const full = normalize(`${row.nombre || ""} ${row.ubicacion || ""}`);
  return churchKeys.findIndex(k => full.includes(k));
}
function getCycle() { return cycles.find(c => String(c.id) === String(activeCycleId)); }
function dateOnly(v) { return v ? String(v).slice(0,10) : ""; }
function timeOnly(v) { return v ? String(v).slice(0,5) : ""; }
function displayVisits() {
  return visits.map(v => ({ ...v, church: churchIndex(churches.find(c => c.id === v.iglesia_id) || {}), date: dateOnly(v.fecha), time: timeOnly(v.hora), status: v.estado }));
}
async function reloadCycles() {
  cycles = check(await db.from("ciclos").select("id,nombre").order("id", {ascending:true}));
  if (!cycles.some(c => String(c.id) === String(activeCycleId))) {
    const initial = cycles.find(c => c.nombre === "Segunda mitad del semestre 2026");
    activeCycleId = initial?.id ?? cycles[0]?.id ?? null;
  }
}
async function reloadVisits() {
  visits = activeCycleId == null ? [] : check(await db.from("visitas_ciclo")
    .select("id,ciclo_id,iglesia_id,orden,estado,fecha,hora")
    .eq("ciclo_id",activeCycleId).order("orden",{ascending:true}));
  render();
}
function render() {
  const current = getCycle();
  $("cycle-select").innerHTML = cycles.map(c => `<option value="${esc(c.id)}">${esc(c.nombre)}</option>`).join("");
  if (current) $("cycle-select").value = String(current.id);
  const items = displayVisits();
  const done = items.filter(v => v.status === "completed").length;
  $("stats").innerHTML = `<div class="stat"><strong>${items.length}</strong><span>Congregaciones</span></div><div class="stat"><strong>${done}</strong><span>Completadas</span></div><div class="stat"><strong>${items.length-done}</strong><span>Pendientes</span></div>`;
  $("cycle-visits").innerHTML = items.map((v,i) => `<div class="cycle-row"><span class="visit-index">${String(i+1).padStart(2,"0")}</span><div class="row-title"><strong>${esc(churchNames[v.church] || "Congregación desconocida")}</strong><small>${v.date ? esc(v.date)+(v.time ? " · "+esc(v.time) : "") : "Sin fecha asignada"}</small></div><div class="cycle-actions"><button data-move="up" data-index="${i}" ${i===0||busy?"disabled":""} aria-label="Subir visita">↑</button><button data-move="down" data-index="${i}" ${i===items.length-1||busy?"disabled":""} aria-label="Bajar visita">↓</button><button class="${v.status === "completed" ? "done" : "pending"}" data-toggle="${i}" ${busy?"disabled":""}>${v.status === "completed" ? "✓ Completado" : "○ Pendiente"}</button></div></div>`).join("");
  renderCalendar(); renderDay();
}
function renderCalendar() {
  const title = new Date(shownYear,shownMonth,1).toLocaleDateString("es-MX",{month:"long",year:"numeric"});
  $("month-title").textContent = title[0].toUpperCase()+title.slice(1);
  const first = (new Date(shownYear,shownMonth,1).getDay()+6)%7;
  const count = new Date(shownYear,shownMonth+1,0).getDate();
  let html = ["L","M","M","J","V","S","D"].map(d => `<div class="weekday">${d}</div>`).join("");
  html += '<div class="calendar-blank"></div>'.repeat(first);
  for(let day=1;day<=count;day++) {
    const date = `${shownYear}-${String(shownMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const has = visits.some(v => dateOnly(v.fecha) === date);
    html += `<button type="button" class="calendar-day ${date===selectedDate?"selected":""} ${has?"has-visit":""}" data-day="${date}" aria-label="${date}${has?", visita programada":""}"><span class="day-number">${day}</span>${has?'<span class="day-dot"></span>':''}</button>`;
  }
  $("calendar-grid").innerHTML = html;
}
function renderDay() {
  $("day-title").textContent = new Date(selectedDate+"T12:00:00").toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  $("date-input").value = selectedDate;
  const events = displayVisits().filter(v => v.date === selectedDate);
  $("day-events").innerHTML = events.length ? events.map(v => `<div class="day-event"><strong>${esc(churchNames[v.church] || "Congregación")}</strong><small>${esc(v.time || "Hora por definir")} · ${v.status === "completed" ? "Completado" : "Pendiente"}</small><div><button type="button" data-remove="${v.id}" ${busy?"disabled":""}>Quitar fecha</button></div></div>`).join("") : '<p class="note">No hay visitas programadas para este día.</p>';
}
async function execute(action) {
  if (busy) return;
  busy = true;
  for (const el of document.querySelectorAll("#visit-form button, #new-cycle, #cycle-select, #cycle-visits button, #day-events button")) el.disabled = true;
  try {
    await action();
    await reloadCycles();
    await reloadVisits();
    report("Cambios guardados en Supabase. Actualiza el otro dispositivo para verlos.");
  } catch(err) {
    console.error("Error calendario Supabase:",err);
    report("No se pudo guardar: "+(err.message || String(err)),true);
    try { await reloadVisits(); } catch {}
  } finally {
    busy = false;
    render();
    $("new-cycle").disabled = false;
    $("cycle-select").disabled = false;
    $("visit-form").querySelector('button[type="submit"]').disabled = false;
  }
}
$("church-input").innerHTML = churchNames.map((n,i) => `<option value="${i}">${esc(n)}</option>`).join("");
$("cycle-select").addEventListener("change", async e => {
  activeCycleId = e.target.value;
  try { await reloadVisits(); report("Ciclo cargado desde Supabase."); }
  catch(err) { report("No se pudo cargar el ciclo: "+err.message,true); }
});
$("prev-month").addEventListener("click",() => moveMonth(-1));
$("next-month").addEventListener("click",() => moveMonth(1));
function moveMonth(delta) { const d = new Date(shownYear,shownMonth+delta,1); shownYear=d.getFullYear(); shownMonth=d.getMonth(); renderCalendar(); }
$("calendar-grid").addEventListener("click",e => { const b=e.target.closest("[data-day]"); if(!b)return; selectedDate=b.dataset.day; renderCalendar(); renderDay(); });
$("visit-form").addEventListener("submit",e => {
  e.preventDefault();
  const index=Number($("church-input").value), date=$("date-input").value, time=$("time-input").value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const church=churches.find(c => churchIndex(c) === index);
  const v=visits.find(v => v.iglesia_id === church?.id);
  if (!v) { report("No se encontró esa congregación en el ciclo.",true); return; }
  execute(async () => {
    check(await db.from("visitas_ciclo").update({fecha:date,hora:time||null,fecha_actualizacion:new Date().toISOString()}).eq("id",v.id).select("id").single());
    selectedDate=date;
    const [y,m]=date.split("-").map(Number); shownYear=y; shownMonth=m-1;
  });
});
$("day-events").addEventListener("click",e => {
  const b=e.target.closest("[data-remove]"); if(!b || !confirm("¿Quitar esta fecha de visita?"))return;
  execute(async () => { check(await db.from("visitas_ciclo").update({fecha:null,hora:null}).eq("id",Number(b.dataset.remove)).select("id").single()); });
});
$("cycle-visits").addEventListener("click",e => {
  const b=e.target.closest("button"); if(!b || busy)return;
  if(b.dataset.toggle!==undefined) {
    const v=visits[Number(b.dataset.toggle)]; if(!v)return;
    execute(async () => { check(await db.from("visitas_ciclo").update({estado:v.estado === "completed" ? "pending" : "completed"}).eq("id",v.id).select("id").single()); });
  } else if(b.dataset.move) {
    const i=Number(b.dataset.index), j=i+(b.dataset.move === "up" ? -1 : 1);
    if(j<0||j>=visits.length)return;
    const a=visits[i], other=visits[j];
    execute(async () => {
      // La columna (ciclo_id, orden) es única: usar una posición temporal libre.
      const temp=Math.max(1000,...visits.map(v=>v.orden))+1;
      check(await db.from("visitas_ciclo").update({orden:temp}).eq("id",a.id).select("id").single());
      check(await db.from("visitas_ciclo").update({orden:a.orden}).eq("id",other.id).select("id").single());
      check(await db.from("visitas_ciclo").update({orden:other.orden}).eq("id",a.id).select("id").single());
    });
  }
});
$("new-cycle").addEventListener("click",() => {
  const name=prompt("Nombre del nuevo ciclo (por ejemplo: Primer semestre 2027):");
  if(!name?.trim())return;
  execute(async () => {
    const created=check(await db.from("ciclos").insert({nombre:name.trim().slice(0,100)}).select("id").single());
    const order=visits.length===10 ? visits.map(v=>v.iglesia_id) : baseOrder.map(i=>churches.find(c=>churchIndex(c)===i)?.id);
    if(order.length!==10 || order.some(id=>id==null)) throw Error("No se pudieron identificar las diez congregaciones.");
    const rows=order.map((iglesia_id,i)=>({ciclo_id:created.id,iglesia_id,orden:i+1,estado:"pending",fecha:null,hora:null}));
    check(await db.from("visitas_ciclo").insert(rows).select("id"));
    activeCycleId=created.id;
  });
});
$("export-data").addEventListener("click", async () => {
  try {
    const all=check(await db.from("visitas_ciclo").select("ciclo_id,iglesia_id,orden,estado,fecha,hora").order("orden"));
    const data={cycles:cycles.map(c=>({id:String(c.id),name:c.nombre,visits:all.filter(v=>String(v.ciclo_id)===String(c.id)).map(v=>({church:churchIndex(churches.find(ch=>ch.id===v.iglesia_id)||{}),status:v.estado,date:dateOnly(v.fecha),time:timeOnly(v.hora)}))})),active:String(activeCycleId)};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="respaldo-valientes-de-david.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  } catch(err) { report("No se pudo exportar: "+err.message,true); }
});
$("import-data").addEventListener("change",e => {
  e.target.value="";
  alert("Para evitar sobrescribir las fechas compartidas, la importación directa está deshabilitada. Conserva tu respaldo JSON y solicita ayuda para restaurarlo en Supabase.");
});
$("year").textContent=new Date().getFullYear();
(async function init() {
  if(!db) { report("No se encontró la conexión con Supabase. Revisa los scripts de calendario.html.",true); return; }
  try {
    churches=check(await db.from("iglesias").select("id,nombre,ubicacion"));
    const matched=churches.map(churchIndex);
    if(churches.length!==10 || new Set(matched).size!==10 || matched.some(i=>i<0)) throw Error("No se pudieron relacionar las diez congregaciones con Supabase.");
    await reloadCycles();
    await reloadVisits();
    report("Calendario conectado a Supabase. Los cambios se comparten entre dispositivos.");
  } catch(err) { console.error(err); report("No se pudo cargar el calendario: "+err.message,true); }
})();
