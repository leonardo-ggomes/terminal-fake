import Terminal, { Dir } from "./Terminal";

type AppDef = {
  id: string;
  label: string;
  icon: string;
  pinned: boolean;
  open?: () => void;
};

export default class Desktop {
  private el: HTMLElement;
  private ctxMenu: HTMLElement;
  private taskbar: HTMLElement;
  private dock: HTMLElement;
  private clock: HTMLElement;
  private terminal: Terminal;
  private zTop = 100;
  private apps: AppDef[] = [];
  private openWindows: Map<string, HTMLElement> = new Map();

  constructor(terminal: Terminal) {
    this.terminal = terminal;
    this.el = document.createElement("div");
    this.el.id = "desktop";
    this.ctxMenu = this.buildContextMenu();
    this.taskbar = this.buildTaskbar();
    this.dock = this.taskbar.querySelector("#dock")!;
    this.clock = this.taskbar.querySelector("#tb-clock")!;

    document.body.innerHTML = "";
    document.body.appendChild(this.el);
    document.body.appendChild(this.ctxMenu);
    document.body.appendChild(this.taskbar);

    document.addEventListener("click", () => (this.ctxMenu.style.display = "none"));
    this.el.addEventListener("contextmenu", (e) => this.showCtxMenu(e as MouseEvent));

    this.registerApps();
    this.renderDock();
    setInterval(() => this.tickClock(), 1000);
    this.tickClock();
  }

  // ── Apps registry ──────────────────────────────────────────────────────────

  private registerApps() {
    this.apps = [
      {
        id: "files", label: "Arquivos", pinned: true,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h9a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
        open: () => this.openFileExplorer("/"),
      },
      {
        id: "terminal", label: "Terminal", pinned: true,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="3" width="20" height="18" rx="3"/><polyline points="8 10 12 14 8 18"/><line x1="14" y1="18" x2="20" y2="18"/></svg>`,
        open: () => this.openTerminalWindow(),
      },
      {
        id: "notepad", label: "Bloco de Notas", pinned: true,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>`,
        open: () => this.openNotepad(),
      },
      {
        id: "calculator", label: "Calculadora", pinned: true,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><circle cx="8" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="19" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="19" r="1" fill="currentColor" stroke="none"/></svg>`,
        open: () => this.openCalculator(),
      },
      {
        id: "settings", label: "Configurações", pinned: true,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
        open: () => this.openSettings(),
      },
    ];
  }

  // ── Load desktop ──────────────────────────────────────────────────────────

  loadDesktop(directories: Record<string, Dir>): void {
    this.terminal.terminalContainer.style.display = "none";
    this.el.style.display = "block";
    this.taskbar.style.display = "flex";

    // Apply wallpaper saved by Terminal.applyConfig
    const savedWp = (window as any).__lgos_wallpaper as string | undefined;
    if (savedWp) this.el.style.background = savedWp;

    // Update start menu avatar with real username
    const smUser = document.querySelector(".sm-user");
    const smHost = document.querySelector(".sm-host");
    const smAvatar = document.querySelector(".sm-avatar");
    if (smUser) smUser.textContent = this.terminal.user;
    if (smHost) smHost.textContent = this.terminal.host;
    if (smAvatar) smAvatar.textContent = this.terminal.user.slice(0, 2).toUpperCase();

    const home = directories["/home/"];
    if (home) home.contentDir.forEach((d) => this.addFolderIcon(d.name));
    this.el.style.opacity = "0";
    requestAnimationFrame(() => { this.el.style.transition = "opacity 0.5s"; this.el.style.opacity = "1"; });
  }

  // ── Taskbar ───────────────────────────────────────────────────────────────

  private buildTaskbar(): HTMLElement {
    const bar = document.createElement("div");
    bar.id = "taskbar";
    bar.innerHTML = `
      <div id="tb-left">
        <button id="tb-start" title="Iniciar">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/>
            <rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>
          </svg>
        </button>
      </div>
      <div id="dock"></div>
      <div id="tb-right">
        <div id="tb-tray">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke-linecap="round"/></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        </div>
        <div id="tb-clock"></div>
      </div>
    `;
    bar.querySelector("#tb-start")?.addEventListener("click", (e) => { e.stopPropagation(); this.toggleStartMenu(); });
    return bar;
  }

  private renderDock() {
    this.dock.innerHTML = "";
    this.apps.filter((a) => a.pinned).forEach((app) => {
      const btn = document.createElement("button");
      btn.className = "dock-btn";
      btn.id = `dock-${app.id}`;
      btn.title = app.label;
      btn.innerHTML = app.icon;
      btn.addEventListener("click", () => {
        const win = this.openWindows.get(app.id);
        if (win) {
          const isHidden = win.style.display === "none";
          win.style.display = isHidden ? "flex" : "none";
          if (isHidden) this.focus(win);
        } else {
          app.open?.();
        }
      });
      this.dock.appendChild(btn);
    });
  }

  private setDockActive(id: string, active: boolean) {
    document.getElementById(`dock-${id}`)?.classList.toggle("active", active);
  }

  private tickClock() {
    const now = new Date();
    const t = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const d = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
    this.clock.innerHTML = `<span class="ct">${t}</span><span class="cd">${d}</span>`;
  }

  private toggleStartMenu() {
    const existing = document.getElementById("start-menu");
    if (existing) { existing.remove(); return; }
    const menu = document.createElement("div");
    menu.id = "start-menu";
    menu.innerHTML = `
      <div class="sm-header">
        <div class="sm-avatar">LG</div>
        <div><div class="sm-user">usuario</div><div class="sm-host">local.lg</div></div>
      </div>
      <div class="sm-label">Aplicativos</div>
      <div class="sm-apps">
        ${this.apps.map(a => `<button class="sm-app" data-id="${a.id}"><span class="sm-icon">${a.icon}</span><span>${a.label}</span></button>`).join("")}
      </div>
      <div class="sm-footer">
        <button class="sm-power">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
          Desligar
        </button>
      </div>
    `;
    menu.querySelectorAll(".sm-app").forEach((btn) => {
      btn.addEventListener("click", () => { this.apps.find((a) => a.id === (btn as HTMLElement).dataset.id)?.open?.(); menu.remove(); });
    });
    menu.querySelector(".sm-power")?.addEventListener("click", () => {
      document.body.innerHTML = `<div id="shutdown"><p>Encerrando LG-OS…</p></div>`;
      setTimeout(() => { document.getElementById("shutdown")!.innerHTML = `<p style="opacity:.2">Sistema encerrado.</p>`; }, 1600);
    });
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 10);
  }

  // ── Context menu ──────────────────────────────────────────────────────────

  private buildContextMenu(): HTMLElement {
    const m = document.createElement("div");
    m.id = "ctx-menu";
    m.innerHTML = `
      <div class="ctx-item" data-action="new-folder"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Nova Pasta</div>
      <div class="ctx-item" data-action="new-file"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Novo Arquivo de Texto</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" data-action="open-terminal"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>Abrir Terminal</div>
      <div class="ctx-item" data-action="open-files"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h9a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>Explorador de Arquivos</div>
      <div class="ctx-sep"></div>
      <div class="ctx-item" data-action="refresh"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>Atualizar</div>
    `;
    m.addEventListener("click", (e) => {
      const item = (e.target as HTMLElement).closest("[data-action]") as HTMLElement;
      if (!item) return;
      ({ "new-folder": () => this.promptCreateFolder(), "new-file": () => this.promptCreateFile(),
         "open-terminal": () => this.openTerminalWindow(), "open-files": () => this.openFileExplorer("/"),
         "refresh": () => location.reload() } as Record<string, () => void>)[item.dataset.action!]?.();
    });
    return m;
  }

  private showCtxMenu(e: MouseEvent) {
    e.preventDefault();
    const mw = 220, mh = 200;
    let x = e.clientX, y = e.clientY;
    if (x + mw > window.innerWidth) x -= mw;
    if (y + mh > window.innerHeight - 52) y -= mh;
    this.ctxMenu.style.left = `${x}px`;
    this.ctxMenu.style.top = `${y}px`;
    this.ctxMenu.style.display = "block";
  }

  // ── Desktop icons ─────────────────────────────────────────────────────────

  addFolderIcon(name: string) {
    const wrap = document.createElement("div");
    wrap.className = "di";
    wrap.innerHTML = `
      <div class="di-icon">
        <svg viewBox="0 0 24 24" fill="none" width="34" height="34">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h9a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            fill="rgba(96,165,250,0.18)" stroke="rgba(147,197,253,0.75)" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="di-label">${name}</span>
    `;
    wrap.addEventListener("dblclick", () => this.openFileExplorer(`/home/${name}/`));
    wrap.draggable = true;
    wrap.addEventListener("dragstart", (e) => { e.dataTransfer?.setData("text", name); wrap.style.opacity = "0.4"; });
    wrap.addEventListener("dragend", () => { wrap.style.opacity = "1"; });
    this.el.appendChild(wrap);
  }

  private async promptCreateFolder() {
    const folderIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" width="18" height="18"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h9a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;
    const name = await this.showInputModal({
      title: "Nova Pasta",
      placeholder: "Nome da pasta",
      defaultValue: "Nova Pasta",
      icon: folderIcon,
      confirmLabel: "Criar",
    });
    if (!name) return;
    this.terminal.handleMkdir(["mkdir", name]);
    this.addFolderIcon(name);
  }

  private async promptCreateFile() {
    const fileIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const name = await this.showInputModal({
      title: "Novo Arquivo de Texto",
      placeholder: "nome-do-arquivo.txt",
      defaultValue: "novo.txt",
      icon: fileIcon,
      confirmLabel: "Criar",
    });
    if (!name) return;
    const dir = this.terminal.directories["/"];
    if (dir) dir.contentFile.push({ name, content: "" });
    this.openNotepad(name, "");
  }

  // ── Window factory ────────────────────────────────────────────────────────

  private createWin(opts: { id: string; title: string; icon?: string; w?: number; h?: number; bg?: string; appId?: string; }): { win: HTMLDivElement; body: HTMLDivElement } {
    document.getElementById(opts.id)?.remove();
    const win = document.createElement("div");
    win.id = opts.id;
    win.className = "win";
    win.style.cssText = `width:${opts.w ?? 680}px;height:${opts.h ?? 440}px;left:${80 + Math.random() * 100}px;top:${60 + Math.random() * 60}px;`;
    if (opts.bg) win.style.background = opts.bg;

    const bar = document.createElement("div");
    bar.className = "win-bar";
    bar.innerHTML = `
      <div class="win-title">
        ${opts.icon ? `<span class="win-icon">${opts.icon}</span>` : ""}
        <span>${opts.title}</span>
      </div>
      <div class="win-controls">
        <button class="wc-btn wc-min" title="Minimizar"><svg viewBox="0 0 12 12" width="10" height="10"><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" stroke-width="1.5"/></svg></button>
        <button class="wc-btn wc-max" title="Maximizar"><svg viewBox="0 0 12 12" width="10" height="10"><rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></button>
        <button class="wc-btn wc-cls" title="Fechar"><svg viewBox="0 0 12 12" width="10" height="10"><line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.5"/><line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" stroke-width="1.5"/></svg></button>
      </div>
    `;

    const body = document.createElement("div");
    body.className = "win-body";
    const resizer = document.createElement("div");
    resizer.className = "win-resizer";

    win.append(bar, body, resizer);
    document.body.appendChild(win);

    bar.querySelector(".wc-cls")?.addEventListener("click", () => {
      win.classList.add("win-closing");
      setTimeout(() => { win.remove(); if (opts.appId) { this.openWindows.delete(opts.appId); this.setDockActive(opts.appId, false); } }, 140);
    });
    bar.querySelector(".wc-min")?.addEventListener("click", () => { win.style.display = "none"; });

    let maximized = false, prev = { w: "", h: "", l: "", t: "" };
    bar.querySelector(".wc-max")?.addEventListener("click", () => {
      if (!maximized) {
        prev = { w: win.style.width, h: win.style.height, l: win.style.left, t: win.style.top };
        win.style.cssText += "width:100vw!important;height:calc(100vh - 52px)!important;left:0!important;top:0!important;border-radius:0!important;";
      } else {
        Object.assign(win.style, { width: prev.w, height: prev.h, left: prev.l, top: prev.t, borderRadius: "" });
      }
      maximized = !maximized;
    });

    win.addEventListener("mousedown", () => this.focus(win));
    this.makeDraggable(win, bar);
    this.makeResizable(win, resizer);
    this.focus(win);

    if (opts.appId) { this.openWindows.set(opts.appId, win); this.setDockActive(opts.appId, true); }
    return { win, body };
  }

  private focus(win: HTMLElement) { win.style.zIndex = String(++this.zTop); }

  // ── Input Modal (replaces prompt()) ───────────────────────────────────────

  private showInputModal(opts: {
    title: string;
    placeholder?: string;
    defaultValue?: string;
    icon?: string;
    confirmLabel?: string;
  }): Promise<string | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";

      overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            ${opts.icon ? `<span class="modal-icon">${opts.icon}</span>` : ""}
            <span class="modal-title">${opts.title}</span>
          </div>
          <div class="modal-body">
            <input
              class="modal-input"
              id="modal-input"
              type="text"
              value="${opts.defaultValue ?? ""}"
              placeholder="${opts.placeholder ?? ""}"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <div class="modal-footer">
            <button class="modal-btn modal-cancel">Cancelar</button>
            <button class="modal-btn modal-confirm">${opts.confirmLabel ?? "Criar"}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const input = overlay.querySelector("#modal-input") as HTMLInputElement;
      const confirmBtn = overlay.querySelector(".modal-confirm") as HTMLButtonElement;
      const cancelBtn  = overlay.querySelector(".modal-cancel")  as HTMLButtonElement;

      // select all text on open
      requestAnimationFrame(() => { input.focus(); input.select(); });

      const confirm = () => {
        const val = input.value.trim();
        overlay.classList.add("modal-out");
        setTimeout(() => { overlay.remove(); resolve(val || null); }, 150);
      };

      const cancel = () => {
        overlay.classList.add("modal-out");
        setTimeout(() => { overlay.remove(); resolve(null); }, 150);
      };

      confirmBtn.addEventListener("click", confirm);
      cancelBtn.addEventListener("click", cancel);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) cancel(); });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter")  confirm();
        if (e.key === "Escape") cancel();
      });
    });
  }

  private makeDraggable(win: HTMLDivElement, bar: HTMLElement) {
    let d = false, ox = 0, oy = 0;
    bar.addEventListener("mousedown", (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".win-controls")) return;
      d = true; ox = e.clientX - win.offsetLeft; oy = e.clientY - win.offsetTop; e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!d) return;
      win.style.left = `${Math.max(0, Math.min(window.innerWidth - win.clientWidth, e.clientX - ox))}px`;
      win.style.top  = `${Math.max(0, Math.min(window.innerHeight - 52 - win.clientHeight, e.clientY - oy))}px`;
    });
    document.addEventListener("mouseup", () => { d = false; });
  }

  private makeResizable(win: HTMLDivElement, handle: HTMLElement) {
    let r = false;
    handle.addEventListener("mousedown", (e) => { r = true; e.preventDefault(); });
    document.addEventListener("mousemove", (e) => {
      if (!r) return;
      win.style.width  = `${Math.max(320, e.clientX - win.offsetLeft)}px`;
      win.style.height = `${Math.max(220, e.clientY - win.offsetTop)}px`;
    });
    document.addEventListener("mouseup", () => { r = false; });
  }

  // ── File Explorer ─────────────────────────────────────────────────────────

  openFileExplorer(startPath = "/") {
    const appId = "files";
    const ex = this.openWindows.get(appId);
    if (ex) { ex.style.display = "flex"; this.focus(ex); return; }

    const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" stroke-linecap="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h9a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;
    const { body } = this.createWin({ id: "win-files", title: "Arquivos", icon, w: 840, h: 540, appId });

    let currentPath = startPath;
    const history: string[] = [startPath];
    let hIdx = 0;

    body.style.cssText = "padding:0;display:flex;flex-direction:column;overflow:hidden;";
    body.innerHTML = `
      <div class="fe-toolbar">
        <button class="fe-tb-btn" id="fe-back" title="Voltar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <button class="fe-tb-btn" id="fe-fwd" title="Avançar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg></button>
        <button class="fe-tb-btn" id="fe-up" title="Subir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg></button>
        <div class="fe-path-bar" id="fe-path-bar">/</div>
        <div class="fe-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="fe-search-input" id="fe-search" placeholder="Pesquisar…"/>
        </div>
        <button class="fe-tb-btn fe-new-folder" id="fe-new-folder" title="Nova Pasta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
          Nova Pasta
        </button>
      </div>
      <div class="fe-layout">
        <div class="fe-sidebar" id="fe-sidebar">
          <div class="fe-sb-sec">Rápido</div>
          <div class="fe-sb-item" data-path="/">🖥 Este Computador</div>
          <div class="fe-sb-item" data-path="/home/">🏠 Home</div>
          <div class="fe-sb-sec">Pastas</div>
          <div class="fe-sb-item" data-path="/bin/">⚙ bin</div>
          <div class="fe-sb-item" data-path="/var/">📦 var</div>
        </div>
        <div class="fe-main">
          <div class="fe-grid" id="fe-grid"></div>
          <div class="fe-statusbar" id="fe-status">0 itens</div>
        </div>
      </div>
    `;

    const grid = body.querySelector("#fe-grid") as HTMLElement;
    const status = body.querySelector("#fe-status") as HTMLElement;
    const pathBar = body.querySelector("#fe-path-bar") as HTMLElement;
    const searchInput = body.querySelector("#fe-search") as HTMLInputElement;

    const navigate = (path: string, push = true) => {
      if (push) { history.splice(hIdx + 1); history.push(path); hIdx = history.length - 1; }
      currentPath = path;
      pathBar.textContent = path;
      body.querySelectorAll(".fe-sb-item").forEach(el => (el as HTMLElement).classList.toggle("active", (el as HTMLElement).dataset.path === path));
      render();
    };

    const render = () => {
      grid.innerHTML = "";
      const dir = this.terminal.directories[currentPath];
      if (!dir) { grid.innerHTML = `<div class="fe-empty">Diretório não encontrado</div>`; return; }
      const q = searchInput.value.toLowerCase();
      let count = 0;

      dir.contentDir.filter(d => !q || d.name.toLowerCase().includes(q)).forEach(d => {
        count++;
        const item = this.feItem("dir", d.name, () => navigate(`${currentPath}${d.name}/`));
        grid.appendChild(item);
      });
      dir.contentFile.filter(f => !q || f.name.toLowerCase().includes(f.name)).forEach(f => {
        count++;
        const item = this.feItem("file", f.name, () => {
          const file = this.terminal.directories[currentPath].contentFile.find(x => x.name === f.name);
          this.openNotepad(f.name, file?.content ?? "");
        });
        grid.appendChild(item);
      });

      if (count === 0) grid.innerHTML = `<div class="fe-empty">Pasta vazia</div>`;
      status.textContent = `${count} item${count !== 1 ? "s" : ""}  ·  ${currentPath}`;
    };

    body.querySelector("#fe-back")?.addEventListener("click", () => { if (hIdx > 0) navigate(history[--hIdx], false); });
    body.querySelector("#fe-fwd")?.addEventListener("click", () => { if (hIdx < history.length - 1) navigate(history[++hIdx], false); });
    body.querySelector("#fe-up")?.addEventListener("click", () => {
      if (currentPath === "/") return;
      const parts = currentPath.replace(/\/$/, "").split("/");
      parts.pop();
      navigate(parts.length ? parts.join("/") + "/" : "/");
    });
    searchInput.addEventListener("input", render);
    body.querySelectorAll(".fe-sb-item").forEach(el => el.addEventListener("click", () => navigate((el as HTMLElement).dataset.path!)));
    body.querySelector("#fe-new-folder")?.addEventListener("click", async () => {
      const folderIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" width="18" height="18"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h9a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;
      const n = await this.showInputModal({
        title: "Nova Pasta",
        placeholder: "Nome da pasta",
        defaultValue: "Nova Pasta",
        icon: folderIcon,
        confirmLabel: "Criar",
      });
      if (!n) return;
      const fp = `${currentPath}${n}/`;
      if (!this.terminal.directories[fp]) {
        const d = { name: n, contentFile: [], contentDir: [] };
        this.terminal.directories[fp] = d;
        this.terminal.directories[currentPath]?.contentDir.push(d);
      }
      render();
    });

    navigate(startPath, false);
  }

  private feItem(type: "dir" | "file", name: string, onDblClick: () => void): HTMLElement {
    const item = document.createElement("div");
    item.className = "fe-item";
    const iconSvg = type === "dir"
      ? `<svg viewBox="0 0 24 24" fill="none" width="36" height="36"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h9a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="rgba(96,165,250,0.2)" stroke="rgba(147,197,253,0.8)" stroke-width="1.4" stroke-linecap="round"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" width="36" height="36"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(167,243,208,0.12)" stroke="rgba(110,231,183,0.7)" stroke-width="1.4" stroke-linecap="round"/><polyline points="14 2 14 8 20 8" stroke="rgba(110,231,183,0.7)" stroke-width="1.4" fill="none"/></svg>`;
    item.innerHTML = `<div class="fe-item-icon">${iconSvg}</div><span class="fe-item-name">${name}</span>`;
    item.addEventListener("dblclick", onDblClick);
    return item;
  }

  // ── Terminal window ───────────────────────────────────────────────────────

  openTerminalWindow() {
    const appId = "terminal";
    const ex = this.openWindows.get(appId);
    if (ex) { ex.style.display = "flex"; this.focus(ex); return; }
    const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" stroke-linecap="round"><rect x="2" y="3" width="20" height="18" rx="3"/><polyline points="8 10 12 14 8 18"/><line x1="14" y1="18" x2="20" y2="18"/></svg>`;
    const { win, body } = this.createWin({ id: "win-terminal", title: "Terminal", icon, w: 720, h: 460, bg: "#0d0d0d", appId });
    win.style.boxShadow = "0 24px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,200,255,0.1)";
    body.style.cssText = "padding:0;overflow:hidden;";
    this.terminal.terminalContainer.style.cssText = "display:flex;height:100%;border-radius:0 0 10px 10px;";
    body.appendChild(this.terminal.terminalContainer);
    this.terminal.addNewCommandLine();
  }

  // ── Notepad ───────────────────────────────────────────────────────────────

  openNotepad(fileName = "sem-titulo.txt", content = "") {
    const appId = "notepad";
    const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const { body } = this.createWin({ id: `win-notepad-${fileName}`, title: `${fileName}`, icon, w: 600, h: 420, appId });
    body.style.cssText = "padding:0;display:flex;flex-direction:column;overflow:hidden;";

    body.innerHTML = `
      <div class="np-menubar">
        <span class="np-menu" id="np-save-btn">Arquivo</span>
        <span class="np-menu">Editar</span>
        <span class="np-menu">Formatar</span>
      </div>
      <textarea class="np-editor" spellcheck="false">${content.replace(/^~\n/gm, "")}</textarea>
      <div class="np-status" id="np-status">Ln 1, Col 1  |  0 chars</div>
    `;

    const ta = body.querySelector(".np-editor") as HTMLTextAreaElement;
    const st = body.querySelector("#np-status") as HTMLElement;

    const updateStatus = () => {
      const before = ta.value.substring(0, ta.selectionStart);
      const ln = before.split("\n").length;
      const col = before.split("\n").pop()!.length + 1;
      st.textContent = `Ln ${ln}, Col ${col}  |  ${ta.value.length} chars`;
    };

    ta.addEventListener("keyup", updateStatus);
    ta.addEventListener("click", updateStatus);

    const doSave = () => {
      const cur = this.terminal.directories["/"] ?? Object.values(this.terminal.directories)[0];
      const existing = cur?.contentFile.find(f => f.name === fileName);
      if (existing) existing.content = ta.value;
      else cur?.contentFile.push({ name: fileName, content: ta.value });
      const toast = document.createElement("div");
      toast.className = "np-toast";
      toast.textContent = "Salvo ✓";
      body.appendChild(toast);
      setTimeout(() => toast.remove(), 1600);
    };

    body.querySelector("#np-save-btn")?.addEventListener("click", doSave);
    ta.addEventListener("keydown", (e) => { if (e.ctrlKey && e.key === "s") { e.preventDefault(); doSave(); } });
    setTimeout(() => { ta.focus(); updateStatus(); }, 60);
  }

  // ── Calculator ────────────────────────────────────────────────────────────

  openCalculator() {
    const appId = "calculator";
    const ex = this.openWindows.get(appId);
    if (ex) { ex.style.display = "flex"; this.focus(ex); return; }
    const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/></svg>`;
    const { body } = this.createWin({ id: "win-calc", title: "Calculadora", icon, w: 290, h: 460, appId });
    body.style.cssText = "padding:0;overflow:hidden;";

    let expr = "", justEval = false;
    body.innerHTML = `
      <div class="calc-wrap">
        <div class="calc-display">
          <div class="calc-history" id="calc-hist"></div>
          <div class="calc-expr" id="calc-expr">0</div>
        </div>
        <div class="calc-grid">
          ${[["C","±","%","÷"],["7","8","9","×"],["4","5","6","−"],["1","2","3","+"],["0",".","⌫","="]].map(row =>
            row.map(k => {
              const cls = "÷×−+=".includes(k) ? "op" : "C±%".includes(k) ? "fn" : k === "0" ? "zero" : "";
              return `<button class="calc-key ${cls}" data-k="${k}">${k}</button>`;
            }).join("")
          ).join("")}
        </div>
      </div>
    `;

    const disp = body.querySelector("#calc-expr") as HTMLElement;
    const hist = body.querySelector("#calc-hist") as HTMLElement;

    const press = (k: string) => {
      if (k === "C")  { expr = ""; disp.textContent = "0"; hist.textContent = ""; justEval = false; return; }
      if (k === "⌫") { expr = expr.slice(0, -1) || ""; disp.textContent = expr || "0"; return; }
      if (k === "±") { expr = expr.startsWith("-") ? expr.slice(1) : expr ? "-" + expr : ""; disp.textContent = expr || "0"; return; }
      if (k === "%") { try { expr = String(parseFloat(expr) / 100); disp.textContent = expr; } catch {} return; }
      if (k === "=") {
        try {
          const safe = expr.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-");
          const res = Function(`"use strict";return(${safe})`)();
          hist.textContent = `${expr} =`;
          expr = String(Number.isFinite(res) ? +res.toFixed(10) : res);
          disp.textContent = expr;
          justEval = true;
        } catch { disp.textContent = "Erro"; expr = ""; }
        return;
      }
      if (justEval && !"÷×−+".includes(k)) { expr = ""; justEval = false; }
      expr += { "×":"×","÷":"÷","−":"−","+":"+" }[k] ?? k;
      disp.textContent = expr;
      justEval = false;
    };

    body.querySelectorAll(".calc-key").forEach(b => b.addEventListener("click", () => press((b as HTMLElement).dataset.k!)));
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  openSettings() {
    const appId = "settings";
    const ex = this.openWindows.get(appId);
    if (ex) { ex.style.display = "flex"; this.focus(ex); return; }
    const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" stroke-linecap="round"><circle cx="12" cy="12" r="3"/></svg>`;
    const { body } = this.createWin({ id: "win-settings", title: "Configurações", icon, w: 720, h: 480, appId });
    body.style.cssText = "padding:0;display:flex;overflow:hidden;";

    const wallpapers = [
      { g: "radial-gradient(ellipse at 20% 50%,rgba(0,120,212,.4) 0%,transparent 60%),linear-gradient(135deg,#0a1628,#1a0a2e)", label: "Aurora" },
      { g: "radial-gradient(ellipse at 80% 20%,rgba(0,180,80,.3) 0%,transparent 60%),linear-gradient(135deg,#071a0f,#0f2a18)", label: "Floresta" },
      { g: "radial-gradient(ellipse at 50% 80%,rgba(220,60,60,.3) 0%,transparent 60%),linear-gradient(135deg,#1a0808,#2e1010)", label: "Magma" },
      { g: "radial-gradient(ellipse at 70% 30%,rgba(180,100,255,.3) 0%,transparent 60%),linear-gradient(135deg,#100a2e,#1a0830)", label: "Nebula" },
      { g: "linear-gradient(135deg,#0d0d0d,#1a1a1a)", label: "Escuro" },
      { g: "linear-gradient(135deg,#f0f0f0,#e0e0e0)", label: "Claro" },
    ];

    const sections: Record<string, string> = {
      system: `<h2 class="cfg-h">Sistema</h2>
        ${[["Usuário","usuario"],["Host","local.lg"],["Memória","16 GB"],["CPU","LG-Core i9-9900K"],["Armazenamento","1 TB SSD"],["OS","LG-OS 1.0"]].map(([l,v])=>`<div class="cfg-row"><span>${l}</span><span class="cfg-val">${v}</span></div>`).join("")}`,
      personalize: `<h2 class="cfg-h">Personalização</h2>
        <div class="cfg-label">Papel de Parede</div>
        <div class="wp-grid">${wallpapers.map((w,i)=>`<div class="wp-swatch" data-g="${w.g}" data-i="${i}"><div class="wp-preview" style="background:${w.g}"></div><span>${w.label}</span></div>`).join("")}</div>`,
      about: `<h2 class="cfg-h">Sobre o LG-OS</h2>
        ${[["Versão","1.0.0"],["Build","2025.1"],["Kernel","lg-kernel 6.1.0"],["Autor","Leonardo G"],["Framework","Vite + TypeScript"]].map(([l,v])=>`<div class="cfg-row"><span>${l}</span><span class="cfg-val">${v}</span></div>`).join("")}`,
    };

    body.innerHTML = `
      <div class="cfg-sidebar">
        <div class="cfg-sb-item active" data-sec="system"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Sistema</div>
        <div class="cfg-sb-item" data-sec="personalize"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Personalizar</div>
        <div class="cfg-sb-item" data-sec="about"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Sobre</div>
      </div>
      <div class="cfg-main" id="cfg-main">${sections.system}</div>
    `;

    const main = body.querySelector("#cfg-main") as HTMLElement;
    body.querySelectorAll(".cfg-sb-item").forEach(el => {
      el.addEventListener("click", () => {
        body.querySelectorAll(".cfg-sb-item").forEach(e => e.classList.remove("active"));
        el.classList.add("active");
        const sec = (el as HTMLElement).dataset.sec!;
        main.innerHTML = sections[sec] ?? "";
        if (sec === "personalize") {
          main.querySelectorAll(".wp-swatch").forEach(sw => {
            sw.addEventListener("click", () => {
              const g = (sw as HTMLElement).dataset.g!;
              document.getElementById("desktop")!.style.background = g;
              main.querySelectorAll(".wp-swatch").forEach(s => s.classList.remove("wp-active"));
              sw.classList.add("wp-active");
            });
          });
        }
      });
    });
  }
}