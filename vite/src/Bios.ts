export default class Bios {
    private container: HTMLDivElement;
    private onComplete: () => void;
  
    constructor(onComplete: () => void) {
      this.onComplete = onComplete;
      this.container = document.createElement("div");
      this.container.id = "bios-screen";
      document.body.appendChild(this.container);
      this.start();
    }
  
    private async start(): Promise<void> {
      await this.renderHeader();
      await this.renderPostChecks();
      await this.renderBootLoader();
      await this.fadeOut();
      this.onComplete();
    }
  
    private async renderHeader(): Promise<void> {
      const lines = [
        `<span style="color:#c8c8c8">LG BIOS v2.4.1  Copyright (C) 2025, LG Corp.</span>`,
        `<span style="color:#888">CPU: LG-Core i9-9900K @ 3.60GHz</span>`,
        `<span style="color:#888">Memory Test: </span>`,
      ];
  
      for (const line of lines) {
        await this.printLine(line, 40);
      }
  
      // Animação de memória
      const memLine = document.createElement("div");
      memLine.innerHTML = `<span style="color:#888">Memory Test: </span><span id="mem-count" style="color:#fff">0</span><span style="color:#888"> KB OK</span>`;
      this.container.appendChild(memLine);
  
      await new Promise<void>((res) => {
        let mem = 0;
        const target = 16384;
        const step = 512;
        const el = document.getElementById("mem-count")!;
        const interval = setInterval(() => {
          mem = Math.min(mem + step, target);
          el.textContent = mem.toLocaleString();
          if (mem >= target) {
            clearInterval(interval);
            res();
          }
        }, 18);
      });
  
      await this.sleep(200);
      await this.printLine(``, 0);
    }
  
    private async renderPostChecks(): Promise<void> {
      const checks: [string, number, string][] = [
        ["Detecting Primary Master", 300, "ST1000DM003-1ER162  ATA"],
        ["Detecting Primary Slave", 200, "None"],
        ["Detecting Secondary Master", 200, "ASUS DRW-24D5MT     ATAPI"],
        ["Detecting Secondary Slave", 150, "None"],
        ["", 0, ""],
        ["Initializing USB Controllers", 250, "Done"],
        ["USB Device(s):", 100, "1 Keyboard, 1 Mouse"],
        ["", 0, ""],
        ["Auto-detecting AHCI Port", 300, ""],
      ];
  
      for (const [label, delay, result] of checks) {
        if (!label) { this.container.appendChild(document.createElement("br")); continue; }
        await this.sleep(delay);
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.gap = "8px";
        div.innerHTML = `<span style="color:#aaa;min-width:340px">${label}...</span><span style="color:#0f0">${result}</span>`;
        this.container.appendChild(div);
      }
  
      await this.sleep(200);
  
      const ports = [
        ["Port 0", "ST1000DM003  (S/N: W1E4D4L9)", "1000 GB"],
        ["Port 1", "Not Present", ""],
        ["Port 2", "Not Present", ""],
      ];
  
      for (const [port, device, size] of ports) {
        await this.sleep(120);
        const div = document.createElement("div");
        div.style.paddingLeft = "16px";
        div.style.color = "#888";
        div.innerHTML = `${port}: <span style="color:#ccc">${device}</span>${size ? ` <span style="color:#0f0">${size}</span>` : ""}`;
        this.container.appendChild(div);
      }
  
      await this.sleep(300);
      this.container.appendChild(document.createElement("br"));
  
      const summary = [
        `<span style="color:#fff">LG System Configuration</span>`,
        `<span style="color:#888">BIOS Version   : <span style="color:#fff">v2.4.1</span></span>`,
        `<span style="color:#888">Processor      : <span style="color:#fff">LG-Core i9-9900K @ 3.60GHz</span></span>`,
        `<span style="color:#888">Memory         : <span style="color:#0f0">16384 KB</span></span>`,
        `<span style="color:#888">Display Type   : <span style="color:#fff">VGA</span></span>`,
        `<span style="color:#888">Boot Sequence  : <span style="color:#fff">HDD, USB, Network</span></span>`,
      ];
  
      for (const line of summary) {
        await this.printLine(line, 60);
      }
  
      await this.sleep(400);
      this.container.appendChild(document.createElement("br"));
    }
  
    private async renderBootLoader(): Promise<void> {
      await this.printLine(`<span style="color:#ff0">Press DEL to enter SETUP, F12 for Boot Menu</span>`, 0);
      await this.sleep(600);
      this.container.appendChild(document.createElement("br"));
      await this.printLine(`<span style="color:#888">Booting from Hard Disk...</span>`, 0);
      await this.sleep(400);
  
      const bar = document.createElement("div");
      bar.style.margin = "12px 0";
      bar.style.display = "flex";
      bar.style.alignItems = "center";
      bar.style.gap = "12px";
  
      const label = document.createElement("span");
      label.style.color = "#888";
      label.textContent = "Loading LG-OS";
  
      const track = document.createElement("div");
      track.style.cssText = `width:280px;height:14px;border:1px solid #444;border-radius:2px;background:#111;overflow:hidden;`;
      const fill = document.createElement("div");
      fill.style.cssText = `height:100%;width:0%;background:linear-gradient(90deg,#0af,#08f);transition:width 0.1s;border-radius:2px;`;
      track.appendChild(fill);
  
      const pct = document.createElement("span");
      pct.style.color = "#0af";
      pct.style.minWidth = "36px";
      pct.textContent = "0%";
  
      bar.appendChild(label);
      bar.appendChild(track);
      bar.appendChild(pct);
      this.container.appendChild(bar);
  
      await new Promise<void>((res) => {
        let p = 0;
        const interval = setInterval(() => {
          const jump = Math.random() * 8 + 2;
          p = Math.min(p + jump, 100);
          fill.style.width = `${p}%`;
          pct.textContent = `${Math.floor(p)}%`;
          if (p >= 100) { clearInterval(interval); setTimeout(res, 300); }
        }, 80);
      });
  
      await this.sleep(300);
      await this.printLine(`<span style="color:#0f0">System Ready.</span>`, 0);
      await this.sleep(500);
    }
  
    private async fadeOut(): Promise<void> {
      this.container.style.transition = "opacity 0.6s";
      this.container.style.opacity = "0";
      await this.sleep(650);
      this.container.remove();
    }
  
    private async printLine(html: string, delay: number): Promise<void> {
      await this.sleep(delay);
      const div = document.createElement("div");
      div.innerHTML = html;
      this.container.appendChild(div);
    }
  
    private sleep(ms: number): Promise<void> {
      return new Promise((r) => setTimeout(r, ms));
    }
  }