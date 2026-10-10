"use strict";
// Programa 2: datos de consulta. La persistencia compartida llegará con Supabase.
const members=["Aarón Israel Sánchez","Ruth Geraldine Vega","Elizabeth Ramírez","Abigail Reyes","Yair Tereso"];
const tasks=["Presentación + oración de invocación","Moderación del servicio","Introducción / dinámica","Prédica","Dinámicas"];
const churches=[
 {id:"tlalpizahuac",short:"Tlalpizáhuac",name:"Casa de Oración Monte de los Olivos «Tlalpizáhuac»",base:0},
 {id:"topacio",short:"Topacio",name:"Casa de Oración Topacio",base:1},
 {id:"mazapil",short:"Mazapil",name:"Casa de Oración Zafiro «Mazapil»",base:2},
 {id:"cuautepec",short:"Cuautepec",name:"Casa de Oración Bethesda «Cuautepec»",base:3},
 {id:"xalpa",short:"Xalpa",name:"Casa de Oración Bethel «Xalpa»",base:4},
 {id:"tepojaco",short:"Tepojaco",name:"Casa de Oración Bethel «Tepojaco»",base:5},
 {id:"jerusalen",short:"La Nueva Jerusalén",name:"Casa de Oración La Nueva Jerusalén",base:6},
 {id:"xico",short:"Xico",name:"Casa de Oración Restauración «Xico»",base:7},
 {id:"dios-es-amor",short:"Dios es Amor",name:"Casa de Oración Dios es Amor",base:8},
 {id:"ecatepec",short:"Ecatepec",name:"Casa de Oración «Ecatepec»",base:9}
];
const directory=document.querySelector("#directory");
const search=document.querySelector("#buscar-iglesia");
const programTitle=document.querySelector("#program-church");
const steps=document.querySelector("#program-steps");
let current=churches[0];
function assignments(church){
 const assigned=tasks.map((_,i)=>members[(i+church.base)%5]);
 // Mazapil: Ruth predica, Aarón dirige dinámicas (intercambio de funciones).
 if(church.id==="mazapil"){assigned[3]=members[1];assigned[4]=members[0];}
 return assigned;
}
function selectChurch(church,scroll=true){
 current=church;programTitle.textContent=church.name;steps.replaceChildren();
 assignments(church).forEach((person,i)=>{
  const li=document.createElement("li");li.className="program-step";
  const number=document.createElement("span");number.className="step-number";number.textContent=String(i+1).padStart(2,"0");
  const details=document.createElement("div");details.className="step-details";
  const title=document.createElement("strong");title.textContent=tasks[i];
  const name=document.createElement("span");name.textContent=person;
  details.append(title,name);li.append(number,details);steps.append(li);
 });
 document.querySelectorAll(".church-card").forEach(card=>{
  const selected=card.dataset.id===church.id;
  card.classList.toggle("is-selected",selected);
  card.querySelector("button").setAttribute("aria-pressed",String(selected));
 });
 history.replaceState(null,"",`${location.pathname}?iglesia=${encodeURIComponent(church.short)}${scroll?"#orden-culto":""}`);
 if(scroll)document.querySelector("#orden-culto").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderDirectory(){
 directory.replaceChildren();const query=search.value.trim().toLocaleLowerCase("es");
 const found=churches.filter(c=>`${c.name} ${c.short}`.toLocaleLowerCase("es").includes(query));
 found.forEach((church,i)=>{
  const card=document.createElement("article");card.className="card church-card";card.dataset.id=church.id;
  const number=document.createElement("span");number.className="card-number";number.textContent=`CONGREGACIÓN ${String(church.base+1).padStart(2,"0")}`;
  const title=document.createElement("h3");title.textContent=church.name;
  const button=document.createElement("button");button.className="card-link card-button";button.type="button";button.textContent="Ver orden de culto →";button.setAttribute("aria-pressed","false");button.addEventListener("click",()=>selectChurch(church));
  card.append(number,title,button);directory.append(card);
 });
 document.querySelector("#search-count").textContent=`${found.length} ${found.length===1?"iglesia encontrada":"iglesias encontradas"}`;
 document.querySelector("#empty-result").hidden=found.length!==0;
 document.querySelectorAll(".church-card").forEach(card=>{const chosen=card.dataset.id===current.id;card.classList.toggle("is-selected",chosen);card.querySelector("button").setAttribute("aria-pressed",String(chosen));});
}
search.addEventListener("input",renderDirectory);
document.querySelector("#print-program").addEventListener("click",()=>window.print());
document.querySelector("#year").textContent=new Date().getFullYear();
renderDirectory();
const param=new URLSearchParams(location.search).get("iglesia");
const initial=churches.find(c=>c.short.toLocaleLowerCase("es")===param?.toLocaleLowerCase("es")||c.id===param)||churches[0];
selectChurch(initial,false);
