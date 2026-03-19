// ─── Setup Wizard ─────────────────────────────────────────────────────────────
// Runs once after the BIOS sequence when no saved config is found.
// Saves config to localStorage under "lgos_config".

export type LgOsConfig = {
    username: string;
    hostname: string;
    color: string;     // accent color hex
    wallpaper: string; // css gradient string
  };
  
  const STORAGE_KEY = "lgos_config";
  
  export function loadConfig(): LgOsConfig | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LgOsConfig) : null;
    } catch {
      return null;
    }
  }
  
  function saveConfig(cfg: LgOsConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }
  
  // ─── Wallpaper presets ────────────────────────────────────────────────────────
  
  const WALLPAPERS = [
    {
      label: "Aurora",
      value:
        "radial-gradient(ellipse at 18% 55%,rgba(0,120,212,.38) 0%,transparent 58%),radial-gradient(ellipse at 82% 18%,rgba(100,60,200,.3) 0%,transparent 52%),linear-gradient(150deg,#080e1c,#0c1426 45%,#120830 75%,#080c14)",
    },
    {
      label: "Floresta",
      value:
        "radial-gradient(ellipse at 80% 20%,rgba(0,180,80,.3) 0%,transparent 60%),linear-gradient(135deg,#071a0f,#0f2a18)",
    },
    {
      label: "Magma",
      value:
        "radial-gradient(ellipse at 50% 80%,rgba(220,60,60,.3) 0%,transparent 60%),linear-gradient(135deg,#1a0808,#2e1010)",
    },
    {
      label: "Nebula",
      value:
        "radial-gradient(ellipse at 70% 30%,rgba(180,100,255,.3) 0%,transparent 60%),linear-gradient(135deg,#100a2e,#1a0830)",
    },
    {
      label: "Escuro",
      value: "linear-gradient(135deg,#0d0d0d,#1a1a1a)",
    },
  ];
  
  const ACCENTS = [
    { label: "Azul",    value: "#60a5fa" },
    { label: "Roxo",    value: "#a78bfa" },
    { label: "Verde",   value: "#34d399" },
    { label: "Laranja", value: "#fb923c" },
    { label: "Rosa",    value: "#f472b6" },
    { label: "Ciano",   value: "#22d3ee" },
  ];
  
  // ─── Main export ──────────────────────────────────────────────────────────────
  
  export default class Setup {
    private overlay: HTMLDivElement;
    private onComplete: (cfg: LgOsConfig) => void;
    private cfg: Partial<LgOsConfig> = {};
    private step = 0;
  
    constructor(onComplete: (cfg: LgOsConfig) => void) {
      this.onComplete = onComplete;
      this.overlay = document.createElement("div");
      this.overlay.id = "setup-overlay";
      document.body.appendChild(this.overlay);
      this.renderStep();
    }
  
    // ── Step router ──────────────────────────────────────────────────────────────
  
    private renderStep() {
      this.overlay.innerHTML = "";
  
      const steps = [
        () => this.stepWelcome(),
        () => this.stepUser(),
        () => this.stepAccent(),
        () => this.stepWallpaper(),
        () => this.stepInstalling(),
      ];
  
      steps[this.step]?.();
    }
  
    private next() {
      this.step++;
      this.overlay.classList.add("setup-slide-out");
      setTimeout(() => {
        this.overlay.classList.remove("setup-slide-out");
        this.renderStep();
      }, 240);
    }
  
    // ── Shared shell ─────────────────────────────────────────────────────────────
  
    private shell(opts: {
      icon: string;
      title: string;
      subtitle?: string;
      body: HTMLElement;
      nextLabel?: string;
      nextDisabled?: boolean;
      onNext?: () => boolean | void; // return false to block
      step: number;
      total: number;
    }): void {
      const card = document.createElement("div");
      card.className = "setup-card";
  
      // Progress dots
      const dots = document.createElement("div");
      dots.className = "setup-dots";
      for (let i = 0; i < opts.total; i++) {
        const d = document.createElement("div");
        d.className = "setup-dot" + (i === opts.step ? " active" : i < opts.step ? " done" : "");
        dots.appendChild(d);
      }
  
      // Header
      const header = document.createElement("div");
      header.className = "setup-header";
      header.innerHTML = `
        <div class="setup-logo">${opts.icon}</div>
        <div>
          <div class="setup-title">${opts.title}</div>
          ${opts.subtitle ? `<div class="setup-subtitle">${opts.subtitle}</div>` : ""}
        </div>
      `;
  
      // Footer
      const footer = document.createElement("div");
      footer.className = "setup-footer";
  
      if (opts.step > 0 && opts.step < opts.total - 1) {
        const back = document.createElement("button");
        back.className = "setup-btn setup-btn-ghost";
        back.textContent = "Voltar";
        back.addEventListener("click", () => {
          this.step--;
          this.overlay.classList.add("setup-slide-out");
          setTimeout(() => { this.overlay.classList.remove("setup-slide-out"); this.renderStep(); }, 240);
        });
        footer.appendChild(back);
      } else {
        footer.appendChild(document.createElement("span")); // spacer
      }
  
      if (opts.nextLabel !== undefined) {
        const next = document.createElement("button");
        next.className = "setup-btn setup-btn-primary";
        next.textContent = opts.nextLabel;
        if (opts.nextDisabled) next.disabled = true;
        next.id = "setup-next";
        next.addEventListener("click", () => {
          if (opts.onNext) {
            const ok = opts.onNext();
            if (ok === false) return;
          }
          this.next();
        });
        footer.appendChild(next);
      }
  
      card.append(dots, header, opts.body, footer);
      this.overlay.appendChild(card);
    }
  
    // ── Step 0 — Welcome ─────────────────────────────────────────────────────────
  
    private stepWelcome() {
      const body = document.createElement("div");
      body.className = "setup-body setup-body-center";
      body.innerHTML = `
        <div class="setup-os-badge">
          <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
            <rect x="3" y="3" width="8" height="8" rx="1.5"/>
            <rect x="13" y="3" width="8" height="8" rx="1.5"/>
            <rect x="3" y="13" width="8" height="8" rx="1.5"/>
            <rect x="13" y="13" width="8" height="8" rx="1.5"/>
          </svg>
        </div>
        <h1 class="setup-hero">Bem-vindo ao <span class="setup-accent">LG-OS</span></h1>
        <p class="setup-lead">Vamos configurar seu ambiente em poucos passos.<br/>Isso levará menos de um minuto.</p>
        <div class="setup-features">
          <div class="setup-feat"><span>⚡</span><span>Boot ultrarrápido</span></div>
          <div class="setup-feat"><span>🎨</span><span>Interface personalizável</span></div>
          <div class="setup-feat"><span>🗂</span><span>Explorador de arquivos</span></div>
          <div class="setup-feat"><span>💻</span><span>Terminal integrado</span></div>
        </div>
      `;
  
      this.shell({
        icon: `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>`,
        title: "LG-OS Setup",
        body,
        nextLabel: "Começar",
        step: 0,
        total: 4,
      });
    }
  
    // ── Step 1 — User ────────────────────────────────────────────────────────────
  
    private stepUser() {
      const body = document.createElement("div");
      body.className = "setup-body";
      body.innerHTML = `
        <div class="setup-field">
          <label class="setup-label" for="s-user">Nome de usuário</label>
          <div class="setup-input-wrap">
            <svg class="setup-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            <input class="setup-input" id="s-user" type="text" placeholder="ex: joao" maxlength="32" value="${this.cfg.username ?? ""}"/>
          </div>
          <span class="setup-hint">Apenas letras, números e hífens.</span>
        </div>
        <div class="setup-field">
          <label class="setup-label" for="s-host">Nome do computador</label>
          <div class="setup-input-wrap">
            <svg class="setup-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <input class="setup-input" id="s-host" type="text" placeholder="ex: meu-pc" maxlength="32" value="${this.cfg.hostname ?? ""}"/>
          </div>
          <span class="setup-hint">Identificador do sistema na rede.</span>
        </div>
      `;
  
      const validateAndNext = (): boolean => {
        const user = (body.querySelector("#s-user") as HTMLInputElement).value.trim();
        const host = (body.querySelector("#s-host") as HTMLInputElement).value.trim();
        const valid = /^[a-z0-9_-]+$/i;
  
        let ok = true;
        if (!user || !valid.test(user)) {
          (body.querySelector("#s-user") as HTMLInputElement).classList.add("setup-input-error");
          ok = false;
        } else {
          (body.querySelector("#s-user") as HTMLInputElement).classList.remove("setup-input-error");
          this.cfg.username = user;
        }
        if (!host || !valid.test(host)) {
          (body.querySelector("#s-host") as HTMLInputElement).classList.add("setup-input-error");
          ok = false;
        } else {
          (body.querySelector("#s-host") as HTMLInputElement).classList.remove("setup-input-error");
          this.cfg.hostname = host;
        }
        return ok;
      };
  
      // enable/disable next live
      const check = () => {
        const u = (body.querySelector("#s-user") as HTMLInputElement).value.trim();
        const h = (body.querySelector("#s-host") as HTMLInputElement).value.trim();
        const btn = document.getElementById("setup-next") as HTMLButtonElement | null;
        if (btn) btn.disabled = !u || !h;
      };
  
      setTimeout(() => {
        body.querySelectorAll(".setup-input").forEach(el => el.addEventListener("input", check));
        check();
        (body.querySelector("#s-user") as HTMLInputElement)?.focus();
      }, 50);
  
      this.shell({
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
        title: "Sua conta",
        subtitle: "Como você quer ser identificado no sistema?",
        body,
        nextLabel: "Continuar",
        nextDisabled: true,
        onNext: validateAndNext,
        step: 1,
        total: 4,
      });
    }
  
    // ── Step 2 — Accent color ────────────────────────────────────────────────────
  
    private stepAccent() {
      const selected = this.cfg.color ?? ACCENTS[0].value;
  
      const body = document.createElement("div");
      body.className = "setup-body";
      body.innerHTML = `
        <p class="setup-section-label">Cor de destaque</p>
        <div class="setup-color-grid" id="s-colors">
          ${ACCENTS.map(a => `
            <button class="setup-color-btn ${a.value === selected ? "active" : ""}"
              data-value="${a.value}" style="--c:${a.value}">
              <span class="setup-color-swatch" style="background:${a.value}"></span>
              <span>${a.label}</span>
            </button>
          `).join("")}
        </div>
        <div class="setup-color-preview" id="s-preview">
          <div class="scp-bar" style="background:${selected}20;border-color:${selected}40">
            <div class="scp-dot" style="background:${selected}"></div>
            <span style="color:${selected}">Prévia da cor selecionada</span>
          </div>
        </div>
      `;
  
      setTimeout(() => {
        let cur = selected;
        body.querySelectorAll(".setup-color-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            cur = (btn as HTMLElement).dataset.value!;
            body.querySelectorAll(".setup-color-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            this.cfg.color = cur;
            const prev = document.getElementById("s-preview")!;
            prev.querySelector(".scp-bar")!.setAttribute("style", `background:${cur}20;border-color:${cur}40`);
            prev.querySelector(".scp-dot")!.setAttribute("style", `background:${cur}`);
            (prev.querySelector("span")! as HTMLElement).style.color = cur;
          });
        });
        this.cfg.color = selected;
      }, 30);
  
      this.shell({
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/></svg>`,
        title: "Personalização",
        subtitle: "Escolha a cor de destaque da interface.",
        body,
        nextLabel: "Continuar",
        step: 2,
        total: 4,
      });
    }
  
    // ── Step 3 — Wallpaper ───────────────────────────────────────────────────────
  
    private stepWallpaper() {
      const selected = this.cfg.wallpaper ?? WALLPAPERS[0].value;
  
      const body = document.createElement("div");
      body.className = "setup-body";
      body.innerHTML = `
        <p class="setup-section-label">Papel de parede</p>
        <div class="setup-wp-grid" id="s-wps">
          ${WALLPAPERS.map(w => `
            <button class="setup-wp-btn ${w.value === selected ? "active" : ""}" data-value="${w.value}">
              <div class="setup-wp-thumb" style="background:${w.value}"></div>
              <span>${w.label}</span>
            </button>
          `).join("")}
        </div>
      `;
  
      setTimeout(() => {
        this.cfg.wallpaper = selected;
        body.querySelectorAll(".setup-wp-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            body.querySelectorAll(".setup-wp-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            this.cfg.wallpaper = (btn as HTMLElement).dataset.value!;
          });
        });
      }, 30);
  
      this.shell({
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
        title: "Papel de parede",
        subtitle: "Você pode mudar isso depois em Configurações.",
        body,
        nextLabel: "Instalar",
        onNext: () => {
          const cfg: LgOsConfig = {
            username: this.cfg.username!,
            hostname: this.cfg.hostname!,
            color: this.cfg.color ?? ACCENTS[0].value,
            wallpaper: this.cfg.wallpaper ?? WALLPAPERS[0].value,
          };
          saveConfig(cfg);
          this.cfg = cfg;
        },
        step: 3,
        total: 4,
      });
    }
  
    // ── Step 4 — Installing ──────────────────────────────────────────────────────
  
    private stepInstalling() {
      const body = document.createElement("div");
      body.className = "setup-body setup-body-center";
  
      const tasks = [
        "Criando estrutura de diretórios…",
        "Configurando variáveis de ambiente…",
        "Aplicando preferências do usuário…",
        "Instalando componentes do sistema…",
        "Configurando rede…",
        "Gerando chaves de segurança…",
        "Finalizando instalação…",
      ];
  
      body.innerHTML = `
        <div class="setup-installing-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
            <rect x="3" y="3" width="8" height="8" rx="1.5"/>
            <rect x="13" y="3" width="8" height="8" rx="1.5"/>
            <rect x="3" y="13" width="8" height="8" rx="1.5"/>
            <rect x="13" y="13" width="8" height="8" rx="1.5"/>
          </svg>
        </div>
        <h2 class="setup-installing-title">Instalando LG-OS</h2>
        <div class="setup-prog-track"><div class="setup-prog-fill" id="setup-prog"></div></div>
        <div class="setup-prog-label" id="setup-prog-label">${tasks[0]}</div>
        <div class="setup-task-log" id="setup-task-log"></div>
      `;
  
      // No back/next buttons — auto advance
      const card = document.createElement("div");
      card.className = "setup-card";
  
      const dots = document.createElement("div");
      dots.className = "setup-dots";
      for (let i = 0; i < 4; i++) {
        const d = document.createElement("div");
        d.className = "setup-dot" + (i < 3 ? " done" : " active");
        dots.appendChild(d);
      }
  
      card.append(dots, body);
      this.overlay.appendChild(card);
  
      const fill = body.querySelector("#setup-prog") as HTMLElement;
      const lbl  = body.querySelector("#setup-prog-label") as HTMLElement;
      const log  = body.querySelector("#setup-task-log") as HTMLElement;
  
      let taskIdx = 0;
      let pct = 0;
  
      const addLog = (text: string) => {
        const line = document.createElement("div");
        line.className = "setup-log-line";
        line.innerHTML = `<span class="setup-log-ok">✓</span> ${text}`;
        log.appendChild(line);
        log.scrollTop = log.scrollHeight;
      };
  
      const tick = setInterval(() => {
        const targetPct = Math.round(((taskIdx + 1) / tasks.length) * 100);
        pct = Math.min(pct + 2, targetPct);
        fill.style.width = `${pct}%`;
  
        if (pct >= targetPct && taskIdx < tasks.length - 1) {
          addLog(tasks[taskIdx]);
          taskIdx++;
          lbl.textContent = tasks[taskIdx];
        }
  
        if (pct >= 100) {
          clearInterval(tick);
          addLog(tasks[tasks.length - 1]);
          lbl.textContent = "Concluído!";
  
          setTimeout(() => {
            this.overlay.classList.add("setup-fade-out");
            setTimeout(() => {
              this.overlay.remove();
              this.onComplete(this.cfg as LgOsConfig);
            }, 500);
          }, 900);
        }
      }, 60);
    }
  }