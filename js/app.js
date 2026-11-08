(function () {
  "use strict";

  // Los datos se editan desde el panel /admin (guardados en /content/*.json)
  function getJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }
  Promise.all([getJSON("/content/negocio.json"), getJSON("/content/coches.json")])
    .then(function (d) { run(d[0] || {}, (d[1] && d[1].coches) || []); })
    .catch(function (err) {
      console.error(err);
      run({}, []);
    });

function run(N, TODOS) {
  // Los vendidos no se muestran; se normalizan campos vacíos que deja el panel
  var COCHES = TODOS.filter(function (c) { return c && c.id && c.estado !== "Vendido"; }).map(function (c) {
    var o = {};
    Object.keys(c).forEach(function (k) { o[k] = c[k] === "" ? null : c[k]; });
    o.fotos = (o.fotos || []).filter(Boolean);
    if (!o.fotos.length) o.fotos = ["/img/sin-foto.svg"];
    if (o.etiqueta === "Sin etiqueta") o.etiqueta = null;
    return o;
  });

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function precioTxt(c) { return c.precio ? fmt(c.precio) + " €" : "Consultar"; }
  function specLine(c) {
    var p = [];
    if (c.anio) p.push(c.anio);
    if (c.km) p.push(fmt(c.km) + " km");
    p.push(c.combustible);
    if (c.cv) p.push(c.cv + " CV");
    return p.join(" · ");
  }
  function waLink(texto) {
    var base = N.whatsapp ? "https://wa.me/" + N.whatsapp : "#contacto";
    return N.whatsapp && texto ? base + "?text=" + encodeURIComponent(texto) : base;
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- datos del negocio en toda la web ---------- */
  $all("[data-negocio]").forEach(function (el) {
    var k = el.getAttribute("data-negocio");
    if (N[k] != null && N[k] !== "") el.textContent = N[k];
  });
  $all("[data-tel]").forEach(function (el) {
    if (N.telefonoLink) el.setAttribute("href", "tel:" + N.telefonoLink);
  });
  $all("[data-wa]").forEach(function (el) { el.setAttribute("href", waLink(el.getAttribute("data-wa"))); });
  $all("[data-social]").forEach(function (el) {
    var k = el.getAttribute("data-social");
    if (N[k]) el.setAttribute("href", N[k]);
  });
  $all("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- menú móvil ---------- */
  var toggle = $(".nav__toggle"), menu = $(".nav__menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    $all("a", menu).forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- tarjeta de coche ---------- */
  function card(c) {
    return (
      '<a class="car-card" href="/coche?id=' + encodeURIComponent(c.id) + '">' +
        '<div class="car-card__media">' +
          '<img src="' + esc(c.fotos[0]) + '" alt="' + esc(c.nombre) + '" loading="lazy" width="1290" height="695">' +
          (c.etiqueta ? '<span class="badge" title="Etiqueta DGT">' + esc(c.etiqueta) + "</span>" : "") +
          (c.estado === "Reservado" ? '<span class="tag">Reservado</span>' : "") +
        "</div>" +
        '<span class="label label-muted">' + esc(c.cat) + "</span>" +
        '<span class="title-lg car-card__name">' + esc(c.nombre) + "</span>" +
        '<span class="body-sm">' + esc(specLine(c)) + "</span>" +
        '<div class="car-card__foot">' +
          '<span class="price">' + esc(precioTxt(c)) + "</span>" +
          '<span class="label">Ver coche →</span>' +
        "</div>" +
      "</a>"
    );
  }

  var page = document.body.getAttribute("data-page");

  /* ---------- INICIO ---------- */
  if (page === "inicio") {
    var dest = $("#destacados");
    var destacados = COCHES.filter(function (c) { return c.destacado; });
    if (!destacados.length) destacados = COCHES.slice(0, 3);
    if (dest) dest.innerHTML = destacados.slice(0, 3).map(card).join("");
    // la foto de portada y la de "vende tu coche" salen de los coches en venta
    var conFoto = destacados.concat(COCHES).filter(function (c) { return c.fotos[0].indexOf("sin-foto") < 0; });
    var hero = $(".hero__img"), band = $(".photo-band__img");
    if (hero && conFoto[0]) { hero.src = conFoto[0].fotos[0]; hero.alt = conFoto[0].nombre; }
    if (band && conFoto[1]) band.src = conFoto[1].fotos[0];

    // opciones de marca según el stock
    var selMarca = $("#f-marca");
    if (selMarca) {
      COCHES.map(function (c) { return c.marca; })
        .filter(function (m, i, a) { return a.indexOf(m) === i; })
        .sort()
        .forEach(function (m) {
          var o = document.createElement("option"); o.value = m; o.textContent = m; selMarca.appendChild(o);
        });
    }
    var mapa = $("#mapa");
    if (mapa && N.mapaEmbed) {
      mapa.innerHTML = '<iframe src="' + esc(N.mapaEmbed) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Ubicación en el mapa"></iframe>';
    }
  }

  /* ---------- STOCK ---------- */
  if (page === "stock") {
    var params = new URLSearchParams(location.search);
    var state = {
      cat: "TODOS",
      orden: "reciente",
      marca: params.get("marca") || "",
      max: Number(params.get("max")) || 0,
      comb: params.get("comb") || ""
    };
    var cats = ["TODOS"].concat(
      COCHES.map(function (c) { return c.cat; }).filter(function (v, i, a) { return a.indexOf(v) === i; })
    );
    var tabsEl = $("#tabs"), gridEl = $("#grid"), countEl = $("#count"), totalEl = $("#total"), sortEl = $("#orden"), activeEl = $("#filtros-activos");
    if (totalEl) totalEl.textContent = COCHES.length;

    function renderTabs() {
      tabsEl.innerHTML = cats.map(function (c) {
        return '<button class="tab" role="tab" type="button" aria-selected="' + (c === state.cat) + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
      }).join("");
    }
    function render() {
      var big = 1e12;
      var list = COCHES.filter(function (c) {
        return (state.cat === "TODOS" || c.cat === state.cat) &&
          (!state.marca || c.marca === state.marca) &&
          (!state.comb || c.combustible === state.comb) &&
          (!state.max || (c.precio && c.precio <= state.max));
      });
      if (state.orden === "precio-asc") list.sort(function (a, b) { return (a.precio || big) - (b.precio || big); });
      if (state.orden === "precio-desc") list.sort(function (a, b) { return (b.precio || 0) - (a.precio || 0); });
      if (state.orden === "km") list.sort(function (a, b) { return (a.km || big) - (b.km || big); });
      countEl.textContent = list.length + (list.length === 1 ? " resultado" : " resultados");
      gridEl.innerHTML = list.length ? list.map(card).join("") :
        '<p class="empty">No hay coches con esos filtros ahora mismo. <a href="/stock" style="text-decoration:underline">Ver todo el stock</a></p>';

      var activos = [];
      if (state.marca) activos.push(state.marca);
      if (state.comb) activos.push(state.comb);
      if (state.max) activos.push("hasta " + fmt(state.max) + " €");
      if (activeEl) {
        activeEl.innerHTML = activos.length
          ? "Filtrando: " + esc(activos.join(" · ")) + ' · <a href="/stock" style="text-decoration:underline">Quitar filtros</a>'
          : "";
      }
    }
    tabsEl.addEventListener("click", function (e) {
      var b = e.target.closest(".tab"); if (!b) return;
      state.cat = b.getAttribute("data-cat"); renderTabs(); render();
    });
    sortEl.addEventListener("change", function () { state.orden = sortEl.value; render(); });
    renderTabs(); render();
  }

  /* ---------- FICHA ---------- */
  if (page === "coche") {
    var id = new URLSearchParams(location.search).get("id");
    var c = COCHES.filter(function (x) { return x.id === id; })[0] || COCHES[0];
    if (!c) { $("#c-nombre").textContent = "Coche no encontrado"; return; }

    document.title = c.nombre + " · " + (N.nombre || "Compraventa de coches");
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", c.nombre + " — " + specLine(c) + ". " + precioTxt(c) + ".");

    $("#c-crumb").textContent = c.nombre;
    $("#c-cat").textContent = c.cat + (c.estado === "Reservado" ? " · RESERVADO" : "");
    $("#c-nombre").textContent = c.nombre;
    $("#c-sub").textContent = specLine(c) + (c.itv ? " · ITV " + (/^\d/.test(c.itv) ? "hasta " + c.itv : String(c.itv).charAt(0).toLowerCase() + String(c.itv).slice(1)) : "");
    $("#c-precio").textContent = precioTxt(c);
    $("#c-resumen").textContent = c.resumen || "";
    $("#c-wa").setAttribute("href", waLink("Hola, me interesa el " + c.nombre + ". ¿Sigue disponible?"));
    $("#c-msg").value = "Hola, me interesa el " + c.nombre + ".";

    // galería
    var idx = 0, fotos = c.fotos || [];
    var mainImg = $("#g-img"), thumbs = $("#g-thumbs"), prev = $("#g-prev"), next = $("#g-next");
    function show(i) {
      idx = (i + fotos.length) % fotos.length;
      mainImg.src = fotos[idx];
      mainImg.alt = c.nombre + " — foto " + (idx + 1) + " de " + fotos.length;
      $all(".thumb", thumbs).forEach(function (t, k) { t.setAttribute("aria-pressed", k === idx ? "true" : "false"); });
    }
    if (fotos.length > 1) {
      thumbs.innerHTML = fotos.map(function (f, k) {
        return '<button class="thumb" type="button" aria-label="Ver foto ' + (k + 1) + '" aria-pressed="false" data-i="' + k + '"><img src="' + esc(f) + '" alt=""></button>';
      }).join("");
      thumbs.addEventListener("click", function (e) { var t = e.target.closest(".thumb"); if (t) show(Number(t.getAttribute("data-i"))); });
      prev.addEventListener("click", function () { show(idx - 1); });
      next.addEventListener("click", function () { show(idx + 1); });
    } else {
      thumbs.hidden = true; prev.hidden = true; next.hidden = true;
    }
    show(0);

    // ficha técnica
    var specs = [
      [c.anio, "Año"],
      [c.km ? fmt(c.km) : null, "Kilómetros"],
      [c.motor, "Motor"],
      [c.cv ? c.cv + " CV" : null, "Potencia"],
      [c.combustible, "Combustible"],
      [c.cambio, "Cambio"],
      [c.etiqueta, "Etiqueta DGT"],
      [c.itv, "ITV"],
      [c.llaves, "Llaves"],
      [c.color, "Color"]
    ].filter(function (s) { return s[0] != null && s[0] !== ""; });
    $("#c-specs").innerHTML = specs.map(function (s) {
      return '<div class="cell cell--compact"><span class="display-sm">' + esc(String(s[0]).toUpperCase()) + '</span><span class="label label-muted">' + esc(s[1]) + "</span></div>";
    }).join("");

    $("#c-equipo").innerHTML = (c.equipo || []).map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("");

    // calculadora (solo si hay precio)
    var calc = $("#calc");
    if (!c.precio) {
      calc.innerHTML = '<h2 class="display-sm">Precio a consultar.</h2><p class="body">Pregúntanos por este coche y te damos precio y cuota de financiación.</p><a class="btn" data-wa href="' + esc(waLink("Hola, ¿qué precio tiene el " + c.nombre + "?")) + '">Preguntar precio</a>';
      $("#c-desde").hidden = true;
    } else {
      var tin = Number(N.tin) || 0;
      var range = $("#entrada"), entradaTxt = $("#entrada-txt"), cuotaEl = $("#cuota"), desde = $("#c-cuota"), plazosEl = $("#plazos");
      var maxEntrada = Math.max(250, Math.floor(c.precio * 0.6 / 250) * 250);
      range.max = maxEntrada; range.step = 250;
      range.value = Math.min(1000, maxEntrada);
      var plazo = 48;
      $("#tin").textContent = String(tin).replace(".", ",");
      plazosEl.innerHTML = [12, 24, 36, 48, 60].map(function (m) {
        return '<button class="plazo" type="button" aria-pressed="' + (m === plazo) + '" data-m="' + m + '">' + m + "</button>";
      }).join("");
      function cuota(entrada, n) {
        var cap = Math.max(c.precio - entrada, 0), r = tin / 100 / 12;
        return r > 0 ? cap * r / (1 - Math.pow(1 + r, -n)) : cap / n;
      }
      function upd() {
        entradaTxt.textContent = fmt(range.value) + " €";
        cuotaEl.textContent = fmt(cuota(Number(range.value), plazo)) + " €";
        $all(".plazo", plazosEl).forEach(function (b) { b.setAttribute("aria-pressed", Number(b.getAttribute("data-m")) === plazo ? "true" : "false"); });
      }
      range.addEventListener("input", upd);
      plazosEl.addEventListener("click", function (e) { var b = e.target.closest(".plazo"); if (b) { plazo = Number(b.getAttribute("data-m")); upd(); } });
      desde.textContent = fmt(cuota(0, 60)) + " €/mes";
      upd();
    }
  }

  /* ---------- formularios → WhatsApp (sin servidor) ---------- */
  $all("form[data-wa-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form), lines = [];
      d.forEach(function (v, k) { if (k !== "privacidad" && v) lines.push(k.charAt(0).toUpperCase() + k.slice(1) + ": " + v); });
      var text = lines.join("\n");
      if (N.whatsapp) {
        window.open("https://wa.me/" + N.whatsapp + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      } else if (N.email && N.email.indexOf("@") > 0) {
        location.href = "mailto:" + N.email + "?subject=" + encodeURIComponent("Contacto web") + "&body=" + encodeURIComponent(text);
      }
      var ok = form.querySelector(".form-ok");
      if (ok) ok.hidden = false;
    });
  });
}
})();
