(function () {
  'use strict';

  var cube = document.getElementById('cube');
  var button = document.getElementById('roll');
  var result = document.getElementById('result');

  // Rotación (X, Y) que deja cada cara mirando al frente, según cómo está
  // montado el cubo en styles.css.
  var ORIENTATIONS = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: -90 },
    3: { x: -90, y: 0 },
    4: { x: 90, y: 0 },
    5: { x: 0, y: 90 },
    6: { x: 0, y: 180 }
  };

  // Inclinación de reposo: el dado se queda ligeramente girado para que se siga
  // viendo como un cubo y no como un cuadrado plano. Al ser menor de 45° la cara
  // sorteada sigue siendo claramente la que mira al espectador.
  //
  // Se aplica por delante de la rotación objetivo, es decir en el marco del
  // espectador y no en el del cubo: así todas las caras quedan igual de
  // inclinadas. Si se sumara a los ángulos objetivo, en las caras superior e
  // inferior el giro en Y se convertiría en un giro dentro del propio plano de
  // la cara y el dado quedaría torcido.
  var TILT = 'rotateX(-15deg) rotateY(-20deg) ';

  function transformFor(x, y) {
    return TILT + 'rotateX(' + x + 'deg) rotateY(' + y + 'deg)';
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Vueltas completas acumuladas: el cubo siempre gira hacia delante y nunca
  // "retrocede" hasta la orientación de la nueva cara.
  var spinsX = 0;
  var spinsY = 0;
  var rolling = false;
  var timeoutId = null;

  /**
   * Devuelve un entero de 1 a 6 sin sesgo. Usa la fuente criptográfica del
   * navegador y descarta los valores que no caben en un múltiplo exacto de 6.
   */
  function rollValue() {
    if (window.crypto && window.crypto.getRandomValues) {
      var bytes = new Uint8Array(1);
      var limit = 256 - (256 % 6); // 252
      for (var attempt = 0; attempt < 64; attempt++) {
        window.crypto.getRandomValues(bytes);
        if (bytes[0] < limit) {
          return (bytes[0] % 6) + 1;
        }
      }
    }
    return Math.floor(Math.random() * 6) + 1;
  }

  function announce(value) {
    result.innerHTML = 'Has sacado un <strong>' + value + '</strong>';
  }

  // --- Histograma ---------------------------------------------------------

  var STORAGE_KEY = 'dado:counts';
  var plot = document.getElementById('plot');
  var expected = document.getElementById('expected');
  var totalText = document.getElementById('total');
  var bars = plot.querySelectorAll('.chart__bar');
  var countTexts = plot.querySelectorAll('.chart__count');

  // Las tiradas se acumulan entre visitas; el botón "Reiniciar" las borra.
  function loadCounts() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (Object.prototype.toString.call(saved) === '[object Array]' && saved.length === 6) {
        var clean = [];
        for (var i = 0; i < 6; i++) {
          var n = saved[i];
          if (typeof n !== 'number' || !isFinite(n) || n < 0) {
            return [0, 0, 0, 0, 0, 0];
          }
          clean.push(Math.floor(n));
        }
        return clean;
      }
    } catch (e) {
      // JSON corrupto o localStorage no disponible (modo privado, cookies bloqueadas).
    }
    return [0, 0, 0, 0, 0, 0];
  }

  function saveCounts() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
    } catch (e) {
      // Sin persistencia: el histograma sigue funcionando en esta sesión.
    }
  }

  var counts = loadCounts();

  function renderChart() {
    var total = 0;
    var max = 0;
    var i;
    for (i = 0; i < 6; i++) {
      total += counts[i];
      if (counts[i] > max) {
        max = counts[i];
      }
    }

    // Las barras se escalan al valor más alto, así siempre caben; la línea del
    // valor esperado se coloca en la misma escala.
    var summary = [];
    for (i = 0; i < 6; i++) {
      bars[i].style.height = (max ? (counts[i] / max) * 100 : 0) + '%';
      countTexts[i].textContent = counts[i];
      summary.push((i + 1) + ': ' + counts[i]);
    }

    if (total) {
      expected.hidden = false;
      expected.style.bottom = (total / 6 / max) * 100 + '%';
    } else {
      expected.hidden = true;
    }

    totalText.textContent = total === 1 ? '1 tirada' : total + ' tiradas';
    plot.setAttribute('aria-label', total
      ? 'Distribución de ' + total + ' tiradas — ' + summary.join(', ')
      : 'Aún no hay tiradas.');
  }

  function record(value) {
    counts[value - 1]++;
    saveCounts();
    renderChart();
  }

  document.getElementById('reset').addEventListener('click', function () {
    counts = [0, 0, 0, 0, 0, 0];
    saveCounts();
    renderChart();
  });

  renderChart();

  // ------------------------------------------------------------------------

  function finish(value) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    cube.removeEventListener('transitionend', onTransitionEnd);
    rolling = false;
    button.disabled = false;
    announce(value);
    record(value);
  }

  var pendingValue = null;

  function onTransitionEnd(event) {
    if (event.target === cube && event.propertyName === 'transform') {
      finish(pendingValue);
    }
  }

  function roll() {
    if (rolling) {
      return;
    }

    var value = rollValue();
    var target = ORIENTATIONS[value];

    if (reducedMotion.matches) {
      cube.style.transform = transformFor(target.x, target.y);
      announce(value);
      record(value);
      return;
    }

    rolling = true;
    pendingValue = value;
    button.disabled = true;
    result.textContent = 'Tirando…';

    spinsX += 360 * (1 + Math.floor(Math.random() * 2));
    spinsY += 360 * (2 + Math.floor(Math.random() * 2));
    cube.style.transform = transformFor(target.x + spinsX, target.y + spinsY);

    cube.addEventListener('transitionend', onTransitionEnd);
    // Red de seguridad por si el navegador no dispara transitionend.
    timeoutId = setTimeout(function () {
      finish(value);
    }, 2000);
  }

  button.addEventListener('click', roll);
  document.getElementById('dice').addEventListener('click', roll);

  // Barra espaciadora como atajo cuando el foco no está ya en el botón
  // (ahí el propio <button> se encarga).
  document.addEventListener('keydown', function (event) {
    if (event.code === 'Space' && document.activeElement !== button) {
      event.preventDefault();
      roll();
    }
  });
})();
