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

  function finish(value) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    cube.removeEventListener('transitionend', onTransitionEnd);
    rolling = false;
    button.disabled = false;
    announce(value);
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
