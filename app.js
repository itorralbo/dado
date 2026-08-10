(function () {
  'use strict';

  var cube = document.getElementById('cube');
  var button = document.getElementById('roll');
  var result = document.getElementById('result');

  // Rotation (X, Y) that leaves each face pointing at the viewer, given how the
  // cube is assembled in styles.css.
  var ORIENTATIONS = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: -90 },
    3: { x: -90, y: 0 },
    4: { x: 90, y: 0 },
    5: { x: 0, y: 90 },
    6: { x: 0, y: 180 }
  };

  // Resting tilt: the die stays slightly turned so it still reads as a cube and
  // not as a flat square. Because it is under 45°, the rolled face is still
  // clearly the one facing the viewer.
  //
  // It is applied ahead of the target rotation, i.e. in the viewer's frame and
  // not the cube's: that way every face is tilted the same. If it were added to
  // the target angles, on the top and bottom faces the Y rotation would turn
  // into a spin within the face's own plane and the die would look crooked.
  var TILT = 'rotateX(-15deg) rotateY(-20deg) ';

  function transformFor(x, y) {
    return TILT + 'rotateX(' + x + 'deg) rotateY(' + y + 'deg)';
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Accumulated full turns: the cube always spins forward and never "rewinds"
  // to the orientation of the new face.
  var spinsX = 0;
  var spinsY = 0;
  var rolling = false;
  var timeoutId = null;

  /**
   * Returns an unbiased integer from 1 to 6. Uses the browser's cryptographic
   * source and discards the values that don't fit in an exact multiple of 6.
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
    result.innerHTML = 'You rolled a <strong>' + value + '</strong>';
  }

  // --- Histogram ----------------------------------------------------------

  // The key keeps its original name so histograms saved before the app was
  // translated are still picked up.
  var STORAGE_KEY = 'dado:counts';
  var plot = document.getElementById('plot');
  var expected = document.getElementById('expected');
  var totalText = document.getElementById('total');
  var bars = plot.querySelectorAll('.chart__bar');
  var countTexts = plot.querySelectorAll('.chart__count');

  // Rolls add up across visits; the "Reset" button clears them.
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
      // Corrupt JSON or localStorage unavailable (private mode, cookies blocked).
    }
    return [0, 0, 0, 0, 0, 0];
  }

  function saveCounts() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
    } catch (e) {
      // No persistence: the histogram still works for this session.
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

    // Bars are scaled to the highest value, so they always fit; the expected
    // value line is placed on the same scale.
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

    var label = total === 1 ? '1 roll' : total + ' rolls';
    totalText.textContent = label;
    plot.setAttribute('aria-label', total
      ? 'Distribution of ' + label + ' — ' + summary.join(', ')
      : 'No rolls yet.');
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
    result.textContent = 'Rolling…';

    spinsX += 360 * (1 + Math.floor(Math.random() * 2));
    spinsY += 360 * (2 + Math.floor(Math.random() * 2));
    cube.style.transform = transformFor(target.x + spinsX, target.y + spinsY);

    cube.addEventListener('transitionend', onTransitionEnd);
    // Safety net in case the browser doesn't fire transitionend.
    timeoutId = setTimeout(function () {
      finish(value);
    }, 2000);
  }

  button.addEventListener('click', roll);
  document.getElementById('dice').addEventListener('click', roll);

  // Spacebar as a shortcut when focus isn't already on the button (there the
  // <button> itself handles it).
  document.addEventListener('keydown', function (event) {
    if (event.code === 'Space' && document.activeElement !== button) {
      event.preventDefault();
      roll();
    }
  });
})();
