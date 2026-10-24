
"use strict";

(() => {
  const STORAGE_KEY = "lvd-tema-global";

  const temas = [
    {
      id: "imperial",
      nombre: "Azul imperial y dorado",
      colores: ["#101b30", "#d3ae70"]
    },
    {
      id: "esmeralda",
      nombre: "Verde esmeralda y champán",
      colores: ["#123d36", "#d8bb82"]
    },
    {
      id: "borgona",
      nombre: "Borgoña y oro rosa",
      colores: ["#482737", "#e2b6a5"]
    }
  ];

  function obtenerTema() {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      return temas.some(t => t.id === guardado)
        ? guardado
        : "imperial";
    } catch {
      return "imperial";
    }
  }

  function aplicarTema(id) {
    const tema = temas.find(t => t.id === id);
    if (!tema) return;

    document.documentElement.dataset.theme = tema.id;

    try {
      localStorage.setItem(STORAGE_KEY, tema.id);
    } catch {
      // La página sigue funcionando sin almacenamiento.
    }

    document.querySelectorAll(".lvd-theme-option")
      .forEach(boton => {
        const seleccionado = boton.dataset.themeId === tema.id;

        boton.setAttribute(
          "aria-pressed",
          String(seleccionado)
        );

        const marca = boton.querySelector(".lvd-theme-check");
        if (marca) {
          marca.textContent = seleccionado ? "✓" : "";
        }
      });
  }

  // Aplicar el tema guardado.
  aplicarTema(obtenerTema());

  function crearSelector() {
    const nav = document.querySelector(".nav");
    if (!nav || document.querySelector(".lvd-theme-control")) {
      return;
    }

    const control = document.createElement("div");
    control.className = "lvd-theme-control";

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "lvd-theme-trigger";
    boton.textContent = "◉ Colores";
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-haspopup", "true");

    const menu = document.createElement("div");
    menu.className = "lvd-theme-menu";
    menu.hidden = true;

    const titulo = document.createElement("strong");
    titulo.className = "lvd-theme-menu-title";
    titulo.textContent = "Elige el diseño del portal";

    menu.appendChild(titulo);

    temas.forEach(tema => {
      const opcion = document.createElement("button");
      opcion.type = "button";
      opcion.className = "lvd-theme-option";
      opcion.dataset.themeId = tema.id;

      const muestras = document.createElement("span");
      muestras.className = "lvd-theme-swatches";

      tema.colores.forEach(color => {
        const muestra = document.createElement("span");
        muestra.style.backgroundColor = color;
        muestras.appendChild(muestra);
      });

      const nombre = document.createElement("span");
      nombre.className = "lvd-theme-option-label";
      nombre.textContent = tema.nombre;

      const marca = document.createElement("span");
      marca.className = "lvd-theme-check";
      marca.setAttribute("aria-hidden", "true");

      opcion.append(muestras, nombre, marca);

      opcion.addEventListener("click", () => {
        aplicarTema(tema.id);
        cerrarMenu();
      });

      menu.appendChild(opcion);
    });

    function cerrarMenu() {
      menu.hidden = true;
      boton.setAttribute("aria-expanded", "false");
    }

    boton.addEventListener("click", () => {
      const abrir = menu.hidden;
      menu.hidden = !abrir;
      boton.setAttribute("aria-expanded", String(abrir));
    });

    document.addEventListener("click", evento => {
      if (!control.contains(evento.target)) {
        cerrarMenu();
      }
    });

    document.addEventListener("keydown", evento => {
      if (evento.key === "Escape") {
        cerrarMenu();
      }
    });

    control.append(boton, menu);
    nav.appendChild(control);

    aplicarTema(obtenerTema());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", crearSelector);
  } else {
    crearSelector();
  }
})();
