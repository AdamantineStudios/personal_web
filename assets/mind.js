/* Ambient "thinking schematic" — vanilla canvas, no dependencies.
   A dense mesh of nodes and hairline synapses breathes behind the page;
   red pulses (thoughts) travel the edges, leave a short trail, and light
   nodes up on arrival. The pointer brightens nearby nodes; a click sparks
   new thoughts. prefers-reduced-motion gets a static schematic; print
   hides it entirely; the loop pauses while the tab is hidden. */
(function () {
  var canvas = document.getElementById("mind");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var light = canvas.getAttribute("data-density") === "light";

  var LINE = "129,160,196";  /* slate-blue hairlines on dark */
  var CYAN = "43,217,238";   /* --accent: traveling thoughts */
  var GREEN = "58,223,165";  /* --green: arrival glow */
  var TAU = 6.28318;

  var W, H, nodes, edges, pulses, raf, last, clock = 0;
  var pointer = { x: -1e4, y: -1e4 };

  function build() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = Math.round((W * H) / (light ? 15000 : 6500));
    target = Math.max(40, Math.min(target, light ? 140 : 280));

    /* a few attractor centres give the mesh organic, lobe-like clusters */
    var centres = [], c;
    for (c = 0; c < 5; c++) centres.push({ x: Math.random() * W, y: Math.random() * H });
    nodes = [];
    for (var i = 0; i < target; i++) {
      var cc = centres[i % centres.length];
      nodes.push({
        bx: Math.max(8, Math.min(W - 8, cc.x + (Math.random() - 0.5) * W * 0.55)),
        by: Math.max(8, Math.min(H - 8, cc.y + (Math.random() - 0.5) * H * 0.55)),
        x: 0, y: 0,
        amp: 1.5 + Math.random() * 1.5,       /* breathing drift */
        spd: 0.3 + Math.random() * 0.3,
        ph: Math.random() * TAU,
        ph2: Math.random() * TAU,
        r: Math.random() < 0.2 ? 3 : 1.8,
        glow: 0,
        links: []
      });
    }
    nodes.forEach(function (n) { n.x = n.bx; n.y = n.by; });

    /* connect each node to its three nearest neighbours, deduped, length-capped */
    var seen = {};
    edges = [];
    nodes.forEach(function (n, ni) {
      var by = nodes.map(function (m, mi) {
        var dx = m.bx - n.bx, dy = m.by - n.by;
        return { i: mi, d: dx * dx + dy * dy };
      }).sort(function (a, b) { return a.d - b.d; });
      for (var k = 1; k <= 3 && k < by.length; k++) {
        var mi = by[k].i, len = Math.sqrt(by[k].d);
        if (len > 260) continue;
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
      speed: (light ? 50 : 65) / edges[ei].len
    });
  }

  function step(dt) {
    clock += dt;
    nodes.forEach(function (n) {
      n.x = n.bx + Math.sin(clock * n.spd + n.ph) * n.amp;
      n.y = n.by + Math.cos(clock * n.spd * 0.9 + n.ph2) * n.amp;
      if (n.glow > 0) n.glow = Math.max(0, n.glow - dt * 1.4);
    });
    for (var i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i];
      p.t += p.speed * dt;
      if (p.t >= 1) {
        var e = edges[p.e];
        var arrive = p.dir === 1 ? e.b : e.a;
        nodes[arrive].glow = 1;
        pulses.splice(i, 1);
        /* most thoughts keep travelling — hop to another synapse */
        if (Math.random() < 0.72 && pulses.length < nodes.length / (light ? 5 : 3.5)) spawn(arrive, p.e);
      }
    }
    var want = Math.max(3, Math.round(nodes.length / (light ? 10 : 7)));
    if (pulses.length < want && Math.random() < 0.14) spawn(Math.floor(Math.random() * nodes.length), -1);
  }

  function dot(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;

    ctx.strokeStyle = "rgba(" + LINE + ",0.16)";
    ctx.beginPath();
    edges.forEach(function (e) {
      ctx.moveTo(nodes[e.a].x, nodes[e.a].y);
      ctx.lineTo(nodes[e.b].x, nodes[e.b].y);
    });
    ctx.stroke();

    nodes.forEach(function (n) {
      var dx = n.x - pointer.x, dy = n.y - pointer.y;
      var near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 170);
      ctx.fillStyle = "rgba(" + LINE + "," + (0.35 + near * 0.4) + ")";
      dot(n.x, n.y, n.r + near * 1.2);
      if (n.glow > 0.01) {
        ctx.fillStyle = "rgba(" + GREEN + "," + (0.5 * n.glow) + ")";
        dot(n.x, n.y, n.r + 8 * n.glow);
      }
    });

    pulses.forEach(function (p) {
      var e = edges[p.e], a = nodes[e.a], b = nodes[e.b];
      var t = p.dir === 1 ? p.t : 1 - p.t;
      var tt = p.dir === 1 ? Math.max(0, p.t - 0.03) : Math.min(1, 1 - p.t + 0.03);
      ctx.fillStyle = "rgba(" + CYAN + ",0.3)";
      dot(a.x + (b.x - a.x) * tt, a.y + (b.y - a.y) * tt, 1.6);
      ctx.fillStyle = "rgba(" + CYAN + ",0.85)";
      dot(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 2.2);
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
