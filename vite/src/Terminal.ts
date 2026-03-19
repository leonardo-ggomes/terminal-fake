import Desktop from "./Desktop";
import Bios from "./Bios";
import Setup, { loadConfig, type LgOsConfig } from "./Setup";

export type File = {
    name: string;
    content: string;
};

export type Dir = {
    name: string;
    contentFile: File[];
    contentDir:  Dir[];
};

export default class Terminal {

    user: string;
    host: string;
    desktop: Desktop;
    terminalContainer: HTMLDivElement;

    directories: { [key: string]: Dir };
    private currentDir: string;
    private isNanoOpen = false;

    constructor() {
        this.user = "usuario";
        this.host = "local.lg";
        this.terminalContainer = document.createElement("div");
        this.directories = {};
        this.currentDir = "/";
        this.desktop = new Desktop(this);

        this.setTerminalStyle();
        this.terminalContainer.style.display = "none";
        this.initializeDirectories(false);
        document.body.prepend(this.terminalContainer);

        // BIOS → Setup (if first run) → boot
        new Bios(() => this.onBiosComplete());
    }

    private onBiosComplete(): void {
        const saved = loadConfig();
        if (saved) {
            // returning user — apply config and go straight to boot
            this.applyConfig(saved);
            this.onBootComplete();
        } else {
            // first run — show installation wizard
            new Setup((cfg: LgOsConfig) => {
                this.applyConfig(cfg);
                this.onBootComplete();
            });
        }
    }

    private applyConfig(cfg: LgOsConfig): void {
        this.user = cfg.username;
        this.host = cfg.hostname;

        // inject CSS variable overrides so accent & wallpaper take effect immediately
        const style = document.createElement("style");
        style.id = "lgos-config-vars";
        style.textContent = `:root { --accent: ${cfg.color}; --accent-dim: ${cfg.color}26; }`;
        document.head.querySelector("#lgos-config-vars")?.remove();
        document.head.appendChild(style);

        // store wallpaper for Desktop to pick up
        (window as any).__lgos_wallpaper = cfg.wallpaper;
    }

    private onBootComplete(): void {
        this.terminalContainer.style.display = "flex";

        const autor = document.createElement("p");
        autor.innerText = "// Criado por Leonardo G\n";
        autor.style.color = "#555";
        autor.style.margin = "0 0 4px 0";
        this.terminalContainer.appendChild(autor);

        this.addBootMessages();
    }

    private addBootMessages(): void {
        const msgs = [
            { text: "[  OK  ] Started LG-OS Session Manager.", color: "#0f0" },
            { text: "[  OK  ] Reached target Graphical Interface.", color: "#0f0" },
            { text: "[  OK  ] Loading user environment...", color: "#0f0" },
            { text: 'Type <span style="color:#0af">help</span> for a list of commands. Type <span style="color:#0af">startfx</span> to launch the Desktop.', color: "#888", html: true },
        ];

        let delay = 0;
        msgs.forEach(({ text, color, html }) => {
            setTimeout(() => {
                const div = document.createElement("div");
                div.style.color = color;
                if (html) div.innerHTML = text;
                else div.textContent = text;
                this.terminalContainer.appendChild(div);
            }, delay);
            delay += 150;
        });

        setTimeout(() => this.addNewCommandLine(), delay + 100);
    }

    // Configura os estilos do terminalContainer
    private setTerminalStyle(): void {
        this.terminalContainer.id = "terminalContainer";
        this.terminalContainer.style.height = "100%";
        this.terminalContainer.style.whiteSpace = "pre-wrap";
        this.terminalContainer.style.backgroundColor = "#0d0d0d";
        this.terminalContainer.style.color = "#fff";
        this.terminalContainer.style.fontFamily = "'Ubuntu Mono', 'Cascadia Code', 'Fira Code', monospace";
        this.terminalContainer.style.fontSize = "14px";
        this.terminalContainer.style.overflowY = "auto";
        this.terminalContainer.style.display = "flex";
        this.terminalContainer.style.flexDirection = "column";
        this.terminalContainer.style.justifyContent = "flex-start";
        this.terminalContainer.style.padding = "12px 16px";
        this.terminalContainer.style.lineHeight = "1.6";
    }

    // Inicializa a estrutura de diretórios e arquivos fictícios
    private initializeDirectories(addPrompt: boolean = true): void {
        this.directories[this.currentDir] = { name: this.currentDir, contentFile: [], contentDir: [] };

        const systemDirs = [
            { name: "bin", contentFile: [], contentDir: [] },
            { name: "home", contentFile: [], contentDir: [] },
            { name: "var", contentFile: [], contentDir: [] },
        ];

        systemDirs.forEach(sysdir => {
            const path = `${this.currentDir}${sysdir.name}/`;
            this.directories[this.currentDir].contentDir.push(sysdir);
            this.directories[path] = sysdir;
        });

        if (addPrompt) this.addNewCommandLine();
    }

    // Adiciona uma nova linha de comando ao terminalContainer
    public addNewCommandLine(): void {
        const commandLine = document.createElement("div");
        commandLine.style.display = "flex";
        commandLine.style.alignItems = "center";
        commandLine.style.flexWrap = "wrap";

        const formattedDir = this.currentDir === "/" ? "/" : this.currentDir.replace(/\/$/, "");

        const prefix = document.createElement("span");
        prefix.innerHTML = `<span style="color:#7ec8e3">${this.user}</span><span style="color:#555">@</span><span style="color:#a8d8a8">${this.host}</span><span style="color:#555">:</span><span style="color:#e2a96f">${formattedDir}</span><span style="color:#fff">$ </span>`;
        commandLine.appendChild(prefix);

        const input = document.createElement("span");
        input.contentEditable = "true";
        input.style.outline = "none";
        input.style.color = "#fff";
        input.style.wordBreak = "break-word";
        input.style.overflow = "hidden";
        input.style.flexGrow = "1";
        input.style.whiteSpace = "pre-wrap";
        input.style.caretColor = "#0af";
        commandLine.appendChild(input);

        input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                input.contentEditable = "false";
                this.processCommand(input.textContent || "");
                if (!this.isNanoOpen) this.addNewCommandLine();
            }
        });

        this.terminalContainer.appendChild(commandLine);
        input.focus();
        this.terminalContainer.scrollTop = this.terminalContainer.scrollHeight;
    }

    // Processa o comando inserido no terminalContainer
    private processCommand(command: string): void {
        const commandParts = command.trim().split(" ");
        const baseCommand = commandParts[0];

        switch (baseCommand) {
            case "ls":   this.handleLs(commandParts); break;
            case "cd":   this.handleCd(commandParts); break;
            case "mkdir":this.handleMkdir(commandParts); break;
            case "pwd":  this.handlePwd(); break;
            case "ifconfig": this.handleIfconfig(); break;
            case "top":  this.handleTop(); break;
            case "nano": this.handleNano(commandParts); break;
            case "clear":this.handleClear(); break;
            case "rmdir":this.handleRmdir(commandParts); break;
            case "rm":   this.handleRm(commandParts); break;
            case "cat":  this.handleCat(commandParts); break;
            case "help": this.handleHelp(); break;
            case "startfx":
                this.desktop.loadDesktop(this.directories);
                break;
            case "":
                break;
            default:
                this.showError(`bash: '${baseCommand}': command not found`);
                break;
        }
    }

    private handleHelp(): void {
        const helpText = `
<span style="color:#7ec8e3;font-weight:bold">LG-OS Terminal v1.0</span>

<span style="color:#a8d8a8">File System</span>
  <span style="color:#e2a96f">ls</span>              Lista arquivos e diretórios
  <span style="color:#e2a96f">cd [dir]</span>        Acessa um diretório
  <span style="color:#e2a96f">mkdir [nome]</span>    Cria um novo diretório
  <span style="color:#e2a96f">rmdir [dir]</span>     Remove um diretório vazio
  <span style="color:#e2a96f">pwd</span>             Mostra o diretório atual

<span style="color:#a8d8a8">Arquivos</span>
  <span style="color:#e2a96f">nano [arquivo]</span>  Cria/edita um arquivo  (Ctrl+S salvar, Ctrl+X sair)
  <span style="color:#e2a96f">cat [arquivo]</span>   Exibe o conteúdo de um arquivo
  <span style="color:#e2a96f">rm [arquivo]</span>    Remove um arquivo

<span style="color:#a8d8a8">Sistema</span>
  <span style="color:#e2a96f">ifconfig</span>        Informações de rede
  <span style="color:#e2a96f">top</span>             Lista processos ativos
  <span style="color:#e2a96f">clear</span>           Limpa o terminal
  <span style="color:#e2a96f">startfx</span>         <span style="color:#ff9">Inicia o Desktop</span>
`;
        const div = document.createElement("div");
        div.innerHTML = helpText;
        this.terminalContainer.appendChild(div);
    }

    private handleClear(): void {
        this.terminalContainer.innerHTML = "";
    }

    private handleRmdir(commandParts: string[]): void {
        if (commandParts.length < 2) { this.showError("Uso: rmdir <diretório>"); return; }
        const dirName = commandParts[1];
        const dirPath = `${this.currentDir}${dirName}/`;
        if (!this.directories[dirPath]) { this.showError(`rmdir: '${dirName}': No such file or directory`); return; }
        if (this.directories[dirPath].contentFile.length > 0 || this.directories[dirPath].contentDir.length > 0) {
            this.showError(`rmdir: failed to remove '${dirName}': Directory not empty`); return;
        }
        delete this.directories[dirPath];
        const parent = this.directories[this.currentDir];
        parent.contentDir = parent.contentDir.filter(d => d.name !== dirName);
    }

    private handleRm(commandParts: string[]): void {
        if (commandParts.length < 2) { this.showError("Uso: rm <arquivo>"); return; }
        const fileName = commandParts[1];
        const dir = this.directories[this.currentDir];
        const idx = dir.contentFile.findIndex(f => f.name === fileName);
        if (idx === -1) { this.showError(`rm: cannot remove '${fileName}': No such file or directory`); return; }
        dir.contentFile.splice(idx, 1);
    }

    private handleCat(commandParts: string[]): void {
        if (commandParts.length < 2) { this.showError("Uso: cat <arquivo>"); return; }
        const fileName = commandParts[1];
        const file = this.directories[this.currentDir].contentFile.find(f => f.name === fileName);
        if (!file) { this.showError(`cat: '${fileName}': No such file or directory`); return; }
        this.displayOutput(file.content || "(arquivo vazio)");
    }

    private handlePwd(): void {
        this.displayOutput(this.currentDir);
    }

    private handleIfconfig(): void {
        const output = `
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.42  netmask 255.255.255.0  broadcast 192.168.1.255
        ether a8:5e:45:d2:07:f1  txqueuelen 1000  (Ethernet)
        RX packets 48291  bytes 62145902 (59.2 MiB)
        TX packets 31027  bytes 4183916 (3.9 MiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
`;
        this.displayOutput(output);
    }

    private handleTop(): void {
        const processes = [
            { pid: 1,    user: "root",    cpu: "0.0%", mem: "0.1%", command: "systemd" },
            { pid: 312,  user: "root",    cpu: "0.1%", mem: "0.4%", command: "Xorg" },
            { pid: 874,  user: this.user, cpu: "1.2%", mem: "2.3%", command: "bash" },
            { pid: 1121, user: this.user, cpu: "2.5%", mem: "1.1%", command: "firefox" },
            { pid: 2233, user: this.user, cpu: "0.7%", mem: "0.3%", command: "htop" },
        ];

        const pre = document.createElement("pre");
        pre.style.color = "#0f0";
        pre.style.fontFamily = "monospace";
        pre.style.whiteSpace = "pre";
        pre.style.margin = "0";

        let output = `PID     USER      %CPU    %MEM    COMMAND\n`;
        output += `────────────────────────────────────────────\n`;
        processes.forEach(p => {
            output += `${p.pid.toString().padEnd(7)} ${p.user.padEnd(9)} ${p.cpu.padEnd(7)} ${p.mem.padEnd(7)} ${p.command}\n`;
        });
        pre.textContent = output;
        this.terminalContainer.appendChild(pre);
    }

    private handleLs(commandParts: string[]): void {
        const dir = commandParts[1] ? commandParts[1] : this.currentDir;
        const targetDir = this.directories[dir];
        if (!targetDir) { this.showError(`ls: cannot access '${dir}': No such file or directory`); return; }

        const line = document.createElement("div");
        line.style.display = "flex";
        line.style.flexWrap = "wrap";
        line.style.gap = "16px";

        targetDir.contentDir.forEach(subDir => {
            const s = document.createElement("span");
            s.style.color = "#7ec8e3";
            s.textContent = subDir.name + "/";
            line.appendChild(s);
        });
        targetDir.contentFile.forEach(file => {
            const s = document.createElement("span");
            s.style.color = "#fff";
            s.textContent = file.name;
            line.appendChild(s);
        });

        if (!line.childElementCount) line.textContent = "(vazio)";
        this.terminalContainer.appendChild(line);
    }

    private handleCd(commandParts: string[]): void {
        if (commandParts.length < 2) { this.showError("Uso: cd <diretório>"); return; }
        let targetDir = commandParts[1];

        if (targetDir === "..") {
            if (this.currentDir !== "/") {
                const parts = this.currentDir.split("/").filter(Boolean);
                parts.pop();
                this.currentDir = parts.length > 0 ? `/${parts.join("/")}/` : "/";
            }
        } else if (targetDir.startsWith("/")) {
            if (this.directories[targetDir]) {
                this.currentDir = targetDir.endsWith("/") ? targetDir : targetDir + "/";
            } else {
                this.showError(`cd: '${targetDir}': No such file or directory`);
            }
        } else {
            const newPath = this.currentDir + targetDir + "/";
            if (this.directories[newPath]) {
                this.currentDir = newPath;
            } else {
                this.showError(`cd: '${targetDir}': No such file or directory`);
            }
        }
    }

    handleMkdir(commandParts: string[]): void {
        if (commandParts.length < 2) { this.displayOutput(`Uso: mkdir <nome>`); return; }
        const dirNameRegex = /^[a-zA-Z0-9_\-. ]+$/;

        for (let index = 1; index < commandParts.length; index++) {
            const newDir = commandParts[index];
            if (!dirNameRegex.test(newDir)) {
                this.showError(`mkdir: nome '${newDir}' contém caracteres inválidos`);
                continue;
            }
            const fullPath = `${this.currentDir}${newDir}/`;
            if (this.directories[fullPath]) { this.showError(`mkdir: '${newDir}': File exists`); continue; }
            const dir = { name: newDir, contentFile: [], contentDir: [] };
            this.directories[fullPath] = dir;
            this.directories[this.currentDir].contentDir.push(dir);
        }
    }

    private displayOutput(output: string, background?: string, color?: string): void {
        const commandLine = document.createElement("div");
        commandLine.textContent = output;
        if (background) commandLine.style.backgroundColor = background;
        commandLine.style.color = color || "#ccc";
        this.terminalContainer.appendChild(commandLine);
    }

    private showError(error: string): void {
        const errorLine = document.createElement("div");
        errorLine.textContent = error;
        errorLine.style.color = "#ff6b6b";
        this.terminalContainer.appendChild(errorLine);
    }

    private handleNano(commandParts: string[]): void {
        const fileName = commandParts[1];
        if (!fileName) { this.showError("Uso: nano <arquivo>"); return; }

        let file = this.directories[this.currentDir].contentFile.find(f => f.name === fileName);
        if (!file) {
            file = { name: fileName, content: "" };
            this.directories[this.currentDir].contentFile.push(file);
        }

        this.isNanoOpen = true;
        this.terminalContainer.innerHTML = "";

        // Header nano
        const header = document.createElement("div");
        header.style.cssText = "background:#0af;color:#000;padding:2px 8px;font-weight:bold;display:flex;justify-content:space-between;";
        header.innerHTML = `<span>GNU nano 5.4</span><span>File: ${fileName}</span><span>Modified</span>`;
        this.terminalContainer.appendChild(header);

        const editor = document.createElement("div");
        editor.contentEditable = "true";
        editor.style.cssText = "outline:none;color:#fff;white-space:pre-wrap;font-family:monospace;font-size:14px;flex:1;padding:8px;min-height:80%;";

        let content = file.content;
        if (!content) {
            for (let i = 0; i < 20; i++) content += "~\n";
        }
        editor.innerText = content;
        this.terminalContainer.appendChild(editor);

        // Footer
        const footer = document.createElement("div");
        footer.style.cssText = "background:#333;color:#fff;padding:2px 8px;font-size:12px;display:flex;gap:24px;flex-wrap:wrap;";
        footer.innerHTML = `<span><b>^S</b> Salvar</span><span><b>^X</b> Sair</span><span><b>^G</b> Ajuda</span>`;
        this.terminalContainer.appendChild(footer);

        setTimeout(() => { editor.focus(); }, 50);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "s") { e.preventDefault(); this.saveFile(fileName, editor.innerText); }
            if (e.ctrlKey && e.key === "x") { e.preventDefault(); exitEditor(); }
        };

        document.addEventListener("keydown", handleKeyDown);

        const exitEditor = () => {
            document.removeEventListener("keydown", handleKeyDown);
            this.terminalContainer.innerHTML = "";
            this.isNanoOpen = false;
            this.addNewCommandLine();
        };
    }

    private saveFile(fileName: string, content: string): void {
        let file = this.directories[this.currentDir].contentFile.find(f => f.name === fileName);
        if (file) {
            file.content = content;
        } else {
            this.directories[this.currentDir].contentFile.push({ name: fileName, content });
        }
        const msg = document.createElement("div");
        msg.style.cssText = "background:#0af;color:#000;padding:2px 8px;";
        msg.textContent = `[ Wrote ${content.split("\n").length} lines to ${fileName} ]`;
        this.terminalContainer.appendChild(msg);
    }
}

document.addEventListener("DOMContentLoaded", () => new Terminal());