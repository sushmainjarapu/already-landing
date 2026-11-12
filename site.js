// Already landing. Progressive enhancement only: the page works without this file.
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var wide = window.matchMedia('(min-width: 960px)');

  // Minute track ---------------------------------------------------------
  // Mirrors the app's morning plan (App/src/lib/protocol.ts sessionPlan):
  // Breathe 60 s, Affirm 120 s, See 120 s, Act 120 s.
  var PHASES = [
    { id: 'breathe', start: 0, len: 1 },
    { id: 'affirm', start: 1, len: 2 },
    { id: 'see', start: 3, len: 2 },
    { id: 'act', start: 5, len: 2 }
  ];
  var track = document.getElementById('track');
  if (track) {
    var items = track.querySelectorAll('.track-list > li');
    var links = track.querySelectorAll('.track-list a');
    var dot = document.getElementById('track-dot');
    var fill = document.getElementById('track-fill');
    var clock = document.getElementById('clock');
    var sections = PHASES.map(function (p) { return document.getElementById(p.id); });
    var done = document.getElementById('done');
    var lastActive = -2;
    var lastClock = '';
    var queued = false;

    var update = function () {
      queued = false;
      var anchor = window.innerHeight * 0.4;
      var t = 0, active = -1, frac = 0, idx = 0;
      for (var i = 0; i < sections.length; i++) {
        var r = sections[i].getBoundingClientRect();
        if (anchor < r.top) { if (i === 0) { t = 0; idx = 0; frac = 0; } break; }
        if (anchor < r.bottom) {
          frac = (anchor - r.top) / r.height;
          t = PHASES[i].start + PHASES[i].len * frac;
          active = i; idx = i;
          break;
        }
        t = 7; idx = 4; frac = 0;
        active = done && done.getBoundingClientRect().top <= anchor ? 4 : i;
      }

      var vertical = wide.matches;
      var li = items[idx];
      var first = items[0];
      var x, y;
      if (vertical) {
        x = li.offsetLeft;
        y = li.offsetTop + (idx < 4 ? frac * li.offsetHeight : 0);
        fill.style.left = x + 'px';
        fill.style.top = first.offsetTop + 'px';
        fill.style.width = '1px';
        fill.style.height = Math.max(0, y - first.offsetTop) + 'px';
        x += 0.5;
      } else {
        x = li.offsetLeft + (idx < 4 ? frac * li.offsetWidth : 0);
        y = first.offsetTop + first.offsetHeight - 1;
        fill.style.left = first.offsetLeft + 'px';
        fill.style.top = (y - 1) + 'px';
        fill.style.height = '2px';
        fill.style.width = Math.max(0, x - first.offsetLeft) + 'px';
      }
      dot.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';

      var secs = Math.min(420, Math.round(t * 60));
      var c = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
      if (c !== lastClock && clock) { clock.textContent = c; lastClock = c; }

      if (active !== lastActive) {
        for (var k = 0; k < links.length; k++) {
          var on = k === active;
          links[k].classList.toggle('is-on', on);
          if (on) links[k].setAttribute('aria-current', 'location');
          else links[k].removeAttribute('aria-current');
        }
        lastActive = active;
      }
    };
    var queue = function () { if (!queued) { queued = true; window.requestAnimationFrame(update); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
    window.addEventListener('load', queue);
    update();
  }

  // Breathing ring pause -------------------------------------------------
  var ring = document.getElementById('ring');
  var ringBtn = document.getElementById('ring-toggle');
  if (ring && ringBtn) {
    ringBtn.hidden = false;
    ringBtn.addEventListener('click', function () {
      var paused = ring.classList.toggle('is-paused');
      ringBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      ringBtn.textContent = paused ? 'Resume the ring' : 'Pause the ring';
    });
  }

  // Belief score -> wording ---------------------------------------------
  // Same rule as the app (App/src/lib/protocol.ts): score 0..10,
  // below BRIDGE_THRESHOLD (5) uses bridge wording, otherwise present tense.
  var BRIDGE_THRESHOLD = 5;
  var range = document.getElementById('belief');
  if (range) {
    var num = document.getElementById('belief-num');
    var tag = document.getElementById('belief-mode');
    var note = document.getElementById('belief-mode-note');
    var lines = document.querySelectorAll('#belief-lines li');
    var list = document.getElementById('belief-lines');
    var mode = 'present';
    var apply = function () {
      var v = Math.max(0, Math.min(10, Math.round(Number(range.value))));
      var next = v < BRIDGE_THRESHOLD ? 'bridge' : 'present';
      var label = next === 'bridge' ? 'Bridge wording' : 'Present tense';
      num.textContent = String(v);
      range.style.setProperty('--fill', (v * 10) + '%');
      range.setAttribute('aria-valuetext', v + ' out of 10, ' + label.toLowerCase());
      if (next !== mode) {
        mode = next;
        tag.textContent = label;
        note.textContent = note.getAttribute('data-' + mode);
        list.classList.toggle('is-bridge', mode === 'bridge');
        for (var i = 0; i < lines.length; i++) lines[i].textContent = lines[i].getAttribute('data-' + mode);
      }
    };
    range.addEventListener('input', apply);
    range.addEventListener('change', apply);
    apply();
  }
})();
