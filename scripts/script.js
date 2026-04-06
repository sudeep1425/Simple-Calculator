(function() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  const root = document.getElementById('calc-root');

  function resize() {
    canvas.width = root.offsetWidth;
    canvas.height = root.offsetHeight;
  }
  resize();

  const COLORS = ['#c0392b','#922b21','#e74c3c','#7b241c','#ff6b6b','#d44000','#ff4444','#8b0000'];
  const particles = [];

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * canvas.width;
      this.y = init ? Math.random() * canvas.height : canvas.height + 10;
      this.r = Math.random() * 2.2 + 0.6;
      this.speed = Math.random() * 0.45 + 0.15;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = -(Math.random() * 0.38 + 0.12);
      this.alpha = Math.random() * 0.55 + 0.15;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.pulse = Math.random() * Math.PI * 2;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.pulse += 0.025;
      this.alpha = 0.25 + Math.sin(this.pulse) * 0.18;
      if (this.y < -10) this.reset(false);
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < 90; i++) particles.push(new Particle());

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i+1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 75) {
          ctx.save();
          ctx.globalAlpha = (1 - dist/75) * 0.1;
          ctx.strokeStyle = '#c0392b';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', resize);

  const shell = document.getElementById('calcShell');
  root.addEventListener('mousemove', (e) => {
    const rect = root.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    shell.style.transform = `perspective(900px) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg)`;
  });
  root.addEventListener('mouseleave', () => {
    shell.style.transform = 'perspective(900px) rotateX(2deg) rotateY(-1deg)';
  });

  let expr = '';
  let justEvaled = false;
  const dispVal = document.getElementById('dispVal');
  const exprEl = document.getElementById('expr');

  function updateDisplay(val, err) {
    dispVal.textContent = val;
    dispVal.classList.toggle('error', !!err);
  }

  function evaluate() {
    if (!expr) return;
    try {
      const safe = expr.replace(/[^0-9+\-*/.()%]/g, '');
      const res = Function('"use strict"; return (' + safe + ')')();
      if (!isFinite(res)) throw new Error();
      exprEl.textContent = expr + ' =';
      expr = String(parseFloat(res.toFixed(10)));
      updateDisplay(expr);
      justEvaled = true;
    } catch(e) {
      updateDisplay("Error", true);
      setTimeout(() => { expr = ''; updateDisplay('0'); exprEl.textContent = ''; }, 1200);
      expr = '';
      justEvaled = false;
    }
  }

  function handleInput(val) {
    if (val === 'C') {
      expr = ''; justEvaled = false;
      updateDisplay('0'); exprEl.textContent = '';
      return;
    }
    if (val === 'DEL') {
      if (justEvaled) { expr = ''; justEvaled = false; updateDisplay('0'); exprEl.textContent = ''; return; }
      expr = expr.slice(0, -1);
      updateDisplay(expr || '0');
      return;
    }
    if (val === '=') { evaluate(); return; }
    if (val === '%') {
      try {
        const v = Function('"use strict"; return (' + expr + ')')();
        expr = String(v / 100);
        updateDisplay(expr);
      } catch(e) {}
      return;
    }
    const ops = ['+','-','*','/'];
    if (justEvaled && !ops.includes(val)) {
      expr = ''; exprEl.textContent = ''; justEvaled = false;
    }
    justEvaled = false;
    if (ops.includes(val) && ops.includes(expr.slice(-1))) {
      expr = expr.slice(0, -1);
    }
    expr += val;
    updateDisplay(expr);
  }

  function addRipple(btn, e) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = size + 'px';
    r.style.left = (e.clientX - rect.left - size/2) + 'px';
    r.style.top = (e.clientY - rect.top - size/2) + 'px';
    btn.appendChild(r);
    setTimeout(() => r.remove(), 450);
  }

  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      addRipple(btn, e);
      handleInput(btn.dataset.val);
    });
  });

  document.addEventListener('keydown', (e) => {
    const map = { 'Enter':'=','Backspace':'DEL','Escape':'C','+':'+','-':'-','*':'*','/':'/','.':'.','%':'%','0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9' };
    if (map[e.key]) { e.preventDefault(); handleInput(map[e.key]); }
  });

  // Theme Toggling Logic
  let lightMode = true;
  const themeBtn = document.getElementById('themeBtn');
  const themeLink = document.getElementById('theme-link');
  
  // Set initial emoji to sun for light mode
  themeBtn.textContent = '🌙';

  themeBtn.addEventListener('click', () => {
    lightMode = !lightMode;
    themeLink.href = lightMode ? './styles/light.css' : './styles/dark.css';
    themeBtn.textContent = lightMode ? '🌙' : '☀️';
  });
})();