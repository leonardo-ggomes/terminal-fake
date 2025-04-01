type File = {
    name: string;
    content: string;
};

type Dir = {
    name: string;
    contentFile: File[];
    contentDir: string[];
};

export default class Terminal {

    user: string
    host: string

    private terminal: HTMLDivElement;
    private directories: { [key: string]: Dir };
    private currentDir: string;
    private isNanoOpen = false

    constructor() {

        this.user = "usuario"
        this.host = "local.lg"
        this.terminal = document.createElement("div");
        this.directories = {};
        this.currentDir = "/";

        // Define o estilo inline do terminal
        this.setTerminalStyle();

        // Inicializa os diretórios
        this.initializeDirectories();

        // Adiciona o terminal na página
        document.body.prepend(this.terminal);
    }

    // Configura os estilos do terminal
    private setTerminalStyle(): void {
        this.terminal.id = "terminal";
        this.terminal.style.height = "100%";
        this.terminal.style.whiteSpace = "pre-wrap";
        this.terminal.style.backgroundColor = "#000";
        this.terminal.style.color = "#fff";
        this.terminal.style.fontFamily = "monospace";
        this.terminal.style.fontSize = "16px";
        this.terminal.style.overflowY = "auto";
        this.terminal.style.display = "flex";
        this.terminal.style.flexDirection = "column";
        this.terminal.style.justifyContent = "flex-start";
        this.terminal.style.padding = "2px";

        const autor = document.createElement("p")
        autor.innerText = "// Criado por Leonardo G \n"
        autor.style.color = "gray"
        this.terminal.appendChild(autor)
    }

    // Inicializa a estrutura de diretórios e arquivos fictícios
    private initializeDirectories(): void {
        this.directories[this.currentDir] = { name: this.currentDir, contentFile: [], contentDir: [] };

        // Simulação de pastas do sistema
        const systemDirs = ["bin", "home", "var"];
        systemDirs.forEach(sysdir => {
            const path = `${this.currentDir}${sysdir}/`;
            this.directories[this.currentDir].contentDir.push(sysdir);
            this.directories[path] = { name: sysdir, contentFile: [], contentDir: [] };
        });

        this.addNewCommandLine();  // Adiciona o prompt inicial
    }

    // Adiciona uma nova linha de comando ao terminal
    public addNewCommandLine(): void {
        const commandLine = document.createElement("div");
        commandLine.style.display = "flex";
        commandLine.style.alignItems = "center";

        const formattedDir = this.currentDir === "/" ? "/" : this.currentDir.replace(/\/$/, "");
        // Prefixo com a cor
        const prefix = document.createElement("span");
        prefix.textContent = `${this.user}@${this.host}:${formattedDir}$ `;
        prefix.style.color = "#00a99d";
        commandLine.appendChild(prefix);

        // Campo de entrada editável para o comando
        const input = document.createElement("span");
        input.contentEditable = "true";
        input.style.outline = "none";
        input.style.color = "#fff";
        input.style.wordBreak = "break-word";
        input.style.overflow = "hidden";
        input.style.flexGrow = "1";
        input.style.whiteSpace = "pre-wrap";
        commandLine.appendChild(input);

        // Quando o comando for inserido e "Enter" for pressionado
        input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.processCommand(input.textContent || "");
                !this.isNanoOpen && this.addNewCommandLine();  // Adiciona nova linha após o comando
            }
        });

        this.terminal.appendChild(commandLine);
        input.focus();
    }

    // Processa o comando inserido no terminal
    private processCommand(command: string): void {
        const commandParts = command.trim().split(" ");
        const baseCommand = commandParts[0];

        switch (baseCommand) {
            case "ls":
                this.handleLs(commandParts);
                break;
            case "cd":
                this.handleCd(commandParts);
                break;
            case "mkdir":
                this.handleMkdir(commandParts);
                break;
            case "pwd":
                this.handlePwd();
                break;
            case "ifconfig":
                this.handleIfconfig();
                break;
            case "top":
                this.handleTop();
                break;
            case "nano":
                this.handleNano(commandParts);
                break;
            case "clear":
                this.handleClear();
                break;
            case "rmdir":
                this.handleRmdir(commandParts);
                break;
            case "rm":
                this.handleRm(commandParts);
                break;
            case "cat":
                this.handleCat(commandParts);
                break;
            case "help":
                this.handleHelp();
                break;
            default:
                this.showError(`'${baseCommand}' Comando não encontrado`);
                break;
        }
    }

    // Exibe a lista de comandos disponíveis
    private handleHelp(): void {
        const helpText = `
Lista de comandos disponíveis:
📂 ls - Lista arquivos e diretórios
📂 cd [diretório] - Acessa um diretório
📂 mkdir [nome] - Cria um novo diretório
📂 pwd - Mostra o diretório atual

📝 nano [arquivo] - Cria/edita um arquivo
📝 cat [arquivo] - Exibe o conteúdo de um arquivo
🗑️ rm [arquivo] - Remove um arquivo
🗑️ rmdir [diretório] - Remove um diretório vazio

🖥️ ifconfig - Mostra informações de rede
🖥️ top - Lista processos ativos
🖥️ clear - Limpa o terminal
🖥️ help - Mostra esta lista de comandos

⚠️ Para mais informações, consulte a documentação do sistema.
`;
        this.displayOutput(helpText);
    }

    // Limpa o terminal
    private handleClear(): void {
        this.terminal.innerHTML = ""; // Remove tudo do terminal
    }

    // Remove um diretório vazio
    private handleRmdir(commandParts: string[]): void {
        if (commandParts.length < 2) {
            this.showError("Uso: rmdir <diretório>");
            return;
        }

        const dirName = commandParts[1];
        const dirPath = `${this.currentDir}${dirName}/`;

        if (!this.directories[dirPath]) {
            this.showError(`Diretório '${dirName}' não encontrado`);
            return;
        }

        if (this.directories[dirPath].contentFile.length > 0 || this.directories[dirPath].contentDir.length > 0) {
            this.showError(`Diretório '${dirName}' não está vazio`);
            return;
        }

        delete this.directories[dirPath];
        const parentDir = this.directories[this.currentDir];
        parentDir.contentDir = parentDir.contentDir.filter(d => d !== dirName);

        this.displayOutput(`Diretório '${dirName}' removido.`);
    }

    // Remove um arquivo
    private handleRm(commandParts: string[]): void {
        if (commandParts.length < 2) {
            this.showError("Uso: rm <arquivo>");
            return;
        }

        const fileName = commandParts[1];
        const dir = this.directories[this.currentDir];

        const fileIndex = dir.contentFile.findIndex(f => f.name === fileName);
        if (fileIndex === -1) {
            this.showError(`Arquivo '${fileName}' não encontrado`);
            return;
        }

        dir.contentFile.splice(fileIndex, 1);
        this.displayOutput(`Arquivo '${fileName}' removido.`);
    }

    // Lê o conteúdo de um arquivo
    private handleCat(commandParts: string[]): void {
        if (commandParts.length < 2) {
            this.showError("Uso: cat <arquivo>");
            return;
        }

        const fileName = commandParts[1];
        const file = this.directories[this.currentDir].contentFile.find(f => f.name === fileName);

        if (!file) {
            this.showError(`Arquivo '${fileName}' não encontrado`);
            return;
        }

        this.displayOutput(file.content);
    }


    private handlePwd(): void {
        this.displayOutput(this.currentDir === "/" ? "/" : this.currentDir.replace(/\/$/, ""));
    }

    private handleIfconfig(): void {
        const output = `
    eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST> mtu 1500
          inet 192.168.1.100 netmask 255.255.255.0 broadcast 192.168.1.255
          ether a4:b1:c2:d3:e4:f5 txqueuelen 1000 (Ethernet)
          RX packets 123456  bytes 9876543 (9.8 MB)
          TX packets 654321  bytes 8765432 (8.7 MB)
        `;

        this.displayOutput(output.trim());
    }

    private handleTop(): void {
        const processes = [
            { pid: 1234, user: "root", cpu: "0.3%", mem: "1.2%", command: "systemd" },
            { pid: 5678, user: "me", cpu: "1.8%", mem: "0.9%", command: "node server.js" },
            { pid: 9101, user: "me", cpu: "0.1%", mem: "0.5%", command: "bash" },
            { pid: 1121, user: "me", cpu: "2.5%", mem: "1.1%", command: "firefox" },
            { pid: 2233, user: "me", cpu: "0.7%", mem: "0.3%", command: "htop" },
        ];

        // Criar um elemento <pre> separado do estilo global
        const pre = document.createElement("pre");
        pre.style.color = "#00ff00";
        pre.style.fontFamily = "monospace";
        pre.style.whiteSpace = "pre"; // Mantém formatação fixa
        pre.style.margin = "0"; // Remove margens extras

        // Criar cabeçalho
        let output = `PID     USER      %CPU    %MEM    COMMAND\n`;
        output += `--------------------------------------------\n`;

        // Criar linhas formatadas
        processes.forEach(p => {
            output += `${p.pid.toString().padEnd(7)} ${p.user.padEnd(9)} ${p.cpu.padEnd(7)} ${p.mem.padEnd(7)} ${p.command}\n`;
        });

        pre.textContent = output; // Adicionar saída formatada no <pre>

        this.terminal.appendChild(pre); // Exibir no terminal
    }
    // Comando 'ls' - Lista diretórios e arquivos
    private handleLs(commandParts: string[]): void {
        const dir = commandParts[1] ? commandParts[1] : this.currentDir;
        const targetDir = this.directories[dir];

        if (!targetDir) {
            this.showError(`\'${dir}\' diretório vazio `);
            return;
        }

        let output = '';
        targetDir.contentDir.forEach(subDir => output += subDir + '  ');
        targetDir.contentFile.forEach(file => output += file.name + '  ');

        this.displayOutput(output);
    }

    // Comando 'cd' - Muda o diretório atual
    private handleCd(commandParts: string[]): void {
        if (commandParts.length < 2) {
            this.showError("Ajuda: cd <diretório>");
            return;
        }

        let targetDir = commandParts[1];

        if (targetDir === "..") {
            if (this.currentDir !== "/") {
                const parts = this.currentDir.split("/").filter(Boolean);
                parts.pop();
                this.currentDir = parts.length > 0 ? `/${parts.join("/")}/` : "/";
            }
        } else if (targetDir.startsWith("/")) {
            // Caminho absoluto
            if (this.directories[targetDir]) {
                this.currentDir = targetDir.endsWith("/") ? targetDir : targetDir + "/";
            } else {
                this.showError(`\'${targetDir}\' diretório não encontrado`);
            }
        } else {
            // Caminho relativo
            const newPath = this.currentDir + targetDir + "/";
            if (this.directories[newPath]) {
                this.currentDir = newPath;
            } else {
                this.showError(`\'${targetDir}\' diretório não encontrado`);
            }
        }


    }

    // Comando 'mkdir' - Cria um novo diretório
    private handleMkdir(commandParts: string[]): void {

        if(!commandParts[1]) return this.displayOutput(`comando inválido`);;

        const newDir = commandParts[1];

        if (this.directories[`${this.currentDir}${newDir}/`]) {
            this.showError(` \'${newDir}\' diretório já existe`);
            return;
        }

        this.directories[`${this.currentDir}${newDir}/`] = { name: newDir, contentFile: [], contentDir: [] };
        this.directories[this.currentDir].contentDir.push(newDir);

        this.displayOutput(`diretório criado`);
    }

    // Exibe a saída no terminal
    private displayOutput(output: string, background?: string, color?: string): void {
        const commandLine = document.createElement("div");
        commandLine.textContent = output;
        background && (commandLine.style.backgroundColor = background);
        color ? commandLine.style.color = color : commandLine.style.color = "#fff";

        this.terminal.appendChild(commandLine);
    }

    // Exibe uma mensagem de erro
    private showError(error: string): void {
        const errorLine = document.createElement("div");
        errorLine.textContent = error;
        errorLine.style.color = "#fff";  // Cor de erro
        this.terminal.appendChild(errorLine);
    }

    private handleNano(commandParts: string[]): void {
        const fileName = commandParts[1];

        if (!fileName) {
            this.showError("Uso: nano <arquivo>");
            return;
        }

        let file = this.directories[this.currentDir].contentFile.find(f => f.name === fileName);

        if (!file) {
            file = { name: fileName, content: "" };
            this.directories[this.currentDir].contentFile.push(file);
        }

        // Impede novos prompts e comandos
        this.isNanoOpen = true;

        // Esconde o prompt e input do terminal
        const inputField = document.getElementById("terminal-input");
        if (inputField) inputField.style.display = "none";

        // Remove completamente qualquer prompt antes do `nano`
        this.terminal.innerHTML = "";

        // Cria o editor (Nano)
        const editor = document.createElement("div");
        editor.contentEditable = "true";
        editor.style.outline = "none";
        editor.style.color = "#fff";
        editor.style.whiteSpace = "pre-wrap";
        editor.style.fontFamily = "monospace";
        editor.style.fontSize = "14px";
        editor.style.height = "100%";
        editor.style.width = "100%";
        editor.style.padding = "10px";
        editor.style.display = "flex";
        editor.style.flexDirection = "column";

        // Adiciona o conteúdo do arquivo ou as linhas vazias com `~`
        let content = file.content;
        if (!content) {
            // Preencher com linhas vazias representadas por ~
            for (let i = 0; i < 20; i++) { // Número de linhas vazias (ajustar conforme necessário)
                content += "~\n";
            }
        }

        editor.innerText = content;
        this.terminal.appendChild(editor);

        // Coloca o cursor na última linha do editor
        setTimeout(() => {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(true);
            selection?.removeAllRanges();
            selection?.addRange(range);
            editor.focus();
        }, 50);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "s") {
                e.preventDefault();
                this.saveFile(fileName, editor.innerText);
            }

            if (e.ctrlKey && e.key === "x") {
                e.preventDefault();
                exitEditor();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        const exitEditor = () => {
            document.removeEventListener("keydown", handleKeyDown);
            this.terminal.innerHTML = "";

            if (inputField) inputField.style.display = "block";

            this.isNanoOpen = false;

            this.addNewCommandLine(); // Exibe novamente o prompt
        };
    }


    // Salva um arquivo dentro do diretório atual
    private saveFile(fileName: string, content: string): void {
        let file = this.directories[this.currentDir].contentFile.find(f => f.name === fileName);

        if (file) {
            file.content = content;
        } else {
            this.directories[this.currentDir].contentFile.push({ name: fileName, content });
        }

        this.displayOutput(`Arquivo "${fileName}" salvo.`, "#ffffff", "#000000");
    }

}

// Inicialização do terminal
document.addEventListener("DOMContentLoaded", () => new Terminal())
