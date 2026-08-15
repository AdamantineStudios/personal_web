/* Ambient "thinking schematic" — vanilla canvas, no dependencies.
   A fixed mesh of nodes and hairline synapses sits behind the page;
   red pulses (thoughts) travel the edges and light nodes up on arrival.
   The pointer gently brightens nearby nodes; a click sparks new thoughts.
   prefers-reduced-motion gets a static schematic; print hides it entirely. */
(function () {
  var canvas = document.getElementById("mind");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var light = canvas.getAttribute("data-density") === "light";

  var INK = "14,27,44";   /* --ink  #0E1B2C */
  var RED = "180,35,24";  /* --accent #B42318 */
  var TAU = 6.28318;

  var W, H, nodes, edges, pulses, raf, last;
  var pointer = { x: -1e4, y: -1e4 };

  function build() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = Math.round((W * H) / (light ? 34000 : 21000));
    target = Math.max(24, Math.min(target, light ? 60 : 110));

    /* a few attractor centres give the mesh organic, lobe-like clusters */
    var centres = [], c;
    for (c = 0; c < 4; c++) centres.push({ x: Math.random() * W, y: Math.random() * H });
    nodes = [];
    for (var i = 0; i < target; i++) {
      var cc = centres[i % centres.length];
      nodes.push({
        x: Math.max(8, Math.min(W - 8, cc.x + (Math.random() - 0.5) * W * 0.55)),
        y: Math.max(8, Math.min(H - 8, cc.y + (Math.random() - 0.5) * H * 0.55)),
        r: Math.random() < 0.16 ? 2.6 : 1.6,
        glow: 0,
        links: []
      });
    }

    /* connect each node to its two nearest neighbours, deduped, length-capped */
    var seen = {};
    edges = [];
    nodes.forEach(function (n, ni) {
      var by = nodes.map(function (m, mi) {
        var dx = m.x - n.x, dy = m.y - n.y;
        return { i: mi, d: dx * dx + dy * dy };
      }).sort(function (a, b) { return a.d - b.d; });
      for (var k = 1; k <= 2 && k < by.length; k++) {
        var mi = by[k].i, len = Math.sqrt(by[k].d);
        if (len > 240) continue;
        var key = ni < mi ? ni + "-" + mi : mi + "-" + ni;
        if (seen[key]) continue;
        seen[key] = 1;
        edges.push({ a: ni, b: mi, len: len });
        n.links.push(edges.length - 1);
        nodes[mi].links.push(edges.length - 1);
      }
    });
    pulses = [];
  }

  function spawn(fromNode, avoidEdge) {
    var n = nodes[fromNode];
    if (!n.links.length) return;
    var pool = n.links.filter(function (ei) { return ei !== avoidEdge; });
    if (!pool.length) pool = n.links;
    var ei = pool[Math.floor(Math.random() * pool.length)];
    pulses.push({
      e: ei,
      t: 0,
      dir: edges[ei].a === fromNode ? 1 : -1,
      speed: (light ? 45 : 60) / edges[ei].len
    });
  }

  function step(dt) {
    nodes.forEach(function (n) { if (n.glow > 0) n.glow = Math.max(0, n.glow - dt * 1.4); });
    for (var i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i];
      p.t += p.speed * dt;
      if (p.t >= 1) {
        var e = edges[p.e];
        var arrive = p.dir === 1 ? e.b : e.a;
        nodes[arrive].glow = 1;
        pulses.splice(i, 1);
        /* most thoughts keep travelling — hop to another synapse */
        if (Math.random() < 0.62 && pulses.length < nodes.length / (light ? 8 : 5)) spawn(arrive, p.e);
      }
    }
    var want = Math.max(2, Math.round(nodes.length / (light ? 16 : 11)));
    if (pulses.length < want && Math.random() < 0.08) spawn(Math.floor(Math.random() * nodes.length), -1);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;

    ctx.strokeStyle = "rgba(" + INK + ",0.07)";
    ctx.beginPath();
    edges.forEach(function (e) {
      ctx.moveTo(nodes[e.a].x, nodes[e.a].y);
      ctx.lineTo(nodes[e.b].x, nodes[e.b].y);
    });
    ctx.stroke();

    nodes.forEach(function (n) {
      var dx = n.x - pointer.x, dy = n.y - pointer.y;
      var near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 140);
      ctx.fillStyle = "rgba(" + INK + "," + (0.16 + near * 0.2) + ")";
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + near * 0.8, 0, TAU);
      ctx.fill();
      if (n.glow > 0.01) {
        ctx.fillStyle = "rgba(" + RED + "," + (0.3 * n.glow) + ")";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 4 * n.glow, 0, TAU);
        ctx.fill();
      }
    });

    ctx.fillStyle = "rgba(" + RED + ",0.55)";
    pulses.forEach(function (p) {
      var e = edges[p.e], a = nodes[e.a], b = nodes[e.b];
      var t = p.dir === 1 ? p.t : 1 - p.t;
      ctx.beginPath();
      ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 1.7, 0, TAU);
      ctx.fill();
    });
  }

  function loop(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    step(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  build();
  if (reduce) {
    draw(); /* static schematic — no motion, no listeners */
  } else {
    last = performance.now();
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", function (ev) {
      pointer.x = ev.clientX; pointer.y = ev.clientY;
    }, { passive: true });
    window.addEventListener("pointerdown", function (ev) {
      var best = 0, bd = 1e12;
      nodes.forEach(function (n, i) {
        var d = (n.x - ev.clientX) * (n.x - ev.clientX) + (n.y - ev.clientY) * (n.y - ev.clientY);
        if (d < bd) { bd = d; best = i; }
      });
      nodes[best].glow = 1;
      spawn(best, -1);
      spawn(best, -1);
    }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) cancelAnimationFrame(raf);
      else { last = performance.now(); raf = requestAnimationFrame(loop); }
    });
  }

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { build(); if (reduce) draw(); }, 200);
  });
})();
