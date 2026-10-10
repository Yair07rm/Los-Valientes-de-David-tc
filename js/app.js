"use strict";
// Etapa 1: datos públicos de ejemplo. En una etapa posterior se conectarán a Supabase.
const churches = [
  ["Casa de Oración Monte de los Olivos «Tlalpizáhuac»","Tlalpizáhuac"],
  ["Casa de Oración Topacio","Topacio"],
  ["Casa de Oración Zafiro «Mazapil»","Mazapil"],
  ["Casa de Oración Bethesda «Cuautepec»","Cuautepec"],
  ["Casa de Oración Bethel «Xalpa»","Xalpa"],
  ["Casa de Oración Bethel «Tepojaco»","Tepojaco"],
  ["Casa de Oración La Nueva Jerusalén","La Nueva Jerusalén"],
  ["Casa de Oración Restauración «Xico»","Xico"],
  ["Casa de Oración Dios es Amor","Dios es Amor"],
  ["Casa de Oración «Ecatepec»","Ecatepec"]
];
const members = [
  ["Aarón Israel Sánchez","Líder"],
  ["Ruth Geraldine Vega","Sublíder"],
  ["Elizabeth Ramírez","Secretaria"],
  ["Abigail Reyes","Tesorera"],
  ["Yair Tereso","Medios digitales"]
];
const visitOrder = ["Xalpa","Dios es Amor","Ecatepec","Cuautepec","Tlalpizáhuac"];
const churchList = document.querySelector("#church-list");
churches.forEach(([name],i)=>{
  const card=document.createElement("article");card.className="card";
  const number=document.createElement("span");number.className="card-number";number.textContent=`CONGREGACIÓN ${String(i+1).padStart(2,"0")}`;
  const heading=document.createElement("h3");heading.textContent=name;
  const link=document.createElement("a");link.className="card-link";link.href=`iglesias.html?iglesia=${encodeURIComponent(churches[i][1])}`;link.textContent="Ver orden de culto →";card.append(number,heading,link);churchList.append(card);
});
const visitList=document.querySelector("#visit-list");
visitOrder.forEach((name,i)=>{
  const row=document.createElement("div");row.className="visit";
  const index=document.createElement("span");index.className="visit-index";index.textContent=String(i+1).padStart(2,"0");
  const title=document.createElement("strong");title.textContent=churches.find(c=>c[1]===name)?.[0]||name;
  const status=document.createElement("span");status.className="status";status.textContent="Pendiente";
  row.append(index,title,status);visitList.append(row);
});
const memberList=document.querySelector("#member-list");
members.forEach(([name,role])=>{
  const card=document.createElement("article");card.className="card";
  const label=document.createElement("span");label.className="card-number";label.textContent=role.toUpperCase();
  const heading=document.createElement("h3");heading.textContent=name;
  card.append(label,heading);memberList.append(card);
});
document.querySelector("#year").textContent=new Date().getFullYear();
