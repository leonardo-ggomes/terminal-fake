import Terminal, { Dir } from "./Terminal";


export default class Desktop {
    private desktopElement: HTMLElement;
    private contextMenu: HTMLElement;
    private terminal: Terminal;

    constructor(terminal: Terminal) {
        this.terminal = terminal;

        // Criar a área de trabalho
        this.desktopElement = document.createElement("div");
        this.desktopElement.id = "desktop";

        // Criar menu de contexto
        this.contextMenu = document.createElement("div");
        this.contextMenu.id = "contextMenu";
        this.contextMenu.className = "context-menu";
        this.contextMenu.innerHTML = `
            <div class="context-item" id="createFolder">📁 Nova Pasta</div>
        `;

        // Limpar o body e adicionar os elementos
        document.body.innerHTML = "";
        document.body.appendChild(this.desktopElement);
        document.body.appendChild(this.contextMenu);

        // Adicionar eventos
        document.addEventListener("click", () => this.contextMenu.style.display = "none");
        this.desktopElement.addEventListener("contextmenu", (e: MouseEvent) => this.showContextMenu(e));

        // Adicionar evento para criar pasta no menu de contexto
        document.getElementById("createFolder")?.addEventListener("click", () => this.createFolder());
    }

    /**
     * Carrega a área de trabalho com as pastas existentes.
     * @param directories Objeto contendo os diretórios da home.
     */
    loadDesktop(directories: Record<string, Dir>): void {
        this.terminal.terminalContainer.style.display = "none";
        this.desktopElement.style.display = "block";

        // Adicionar as pastas existentes da home
        for (const dir of directories["/home/"].contentDir) {
            this.addFolder(dir.name);
        }
    }

    /**
     * Adiciona uma pasta à área de trabalho.
     * @param name Nome da pasta a ser adicionada.
     */
    addFolder(name: string): void {
        const folder: HTMLDivElement = document.createElement("div");
        folder.classList.add("folder");
        folder.style.left = `${Math.random() * (window.innerWidth - 100)}px`;
        folder.style.top = `${Math.random() * (window.innerHeight - 100)}px`;

        // Criar a imagem do ícone da pasta
        const icon: HTMLImageElement = document.createElement("img");
        icon.src = "folder.png";
        icon.alt = "Pasta";
        icon.classList.add("folder-icon");

        // Criar o nome da pasta abaixo do ícone
        const folderName: HTMLSpanElement = document.createElement("span");
        folderName.classList.add("folder-name");
        folderName.style.display = "block"
        folderName.textContent = name;
        folderName.style.color = "#fff"

        // Adicionar ícone e nome dentro da pasta
        folder.appendChild(icon);
        folder.appendChild(folderName);

        // Definir a div como arrastável
        icon.setAttribute("draggable", "true");
        icon.addEventListener("dragstart", (event: DragEvent) => this.dragStart(event, folder));
        icon.addEventListener("dragend", (event: DragEvent) => this.dragEnd(event, folder));

        folder.addEventListener("dblclick", () => this.openFolder(name));

        // Adicionar pasta ao desktop
        this.desktopElement.appendChild(folder);
    }

    /**
     * Cria uma nova pasta através do menu de contexto.
     */
    createFolder(): void {
        const folderName: string | null = prompt("Nome da pasta:", "Nova Pasta");
        if (folderName) {
            this.terminal.handleMkdir(["mkdir", folderName]);
            this.addFolder(folderName);
        }
    }

    /**
     * Exibe o menu de contexto na posição do mouse.
     * @param event Evento do clique do botão direito do mouse.
     */
    showContextMenu(event: MouseEvent): void {
        event.preventDefault();
        this.contextMenu.style.top = `${event.clientY}px`;
        this.contextMenu.style.left = `${event.clientX}px`;
        this.contextMenu.style.display = "block";
    }

    /**
     * Inicia o arrastar de um item.
     * @param event Evento de arrastar.
     */
    dragStart(event: DragEvent, folder: HTMLElement): void {
        event.dataTransfer?.setData("text/plain", folder.textContent || "");
        folder.style.opacity = "0.5";
    }

    /**
     * Finaliza o arrastar e posiciona o item na nova localização.
     * @param event Evento de soltar.
     */
    dragEnd(event: DragEvent, folder: HTMLElement): void {
        folder.style.opacity = "1";
    
        // Garantir que o drop esteja dentro dos limites da tela
        const offsetX = folder.clientWidth / 2;
        const offsetY = folder.clientHeight / 2;
        
        let newX = event.clientX - offsetX;
        let newY = event.clientY - offsetY;
    
        // Impedir que a pasta vá para fora da tela
        newX = Math.max(0, Math.min(window.innerWidth - folder.clientWidth, newX));
        newY = Math.max(0, Math.min(window.innerHeight - folder.clientHeight, newY));
    
        folder.style.left = `${newX}px`;
        folder.style.top = `${newY}px`;
    }

    openFolder(folderName: string): void {
        // Se já existir uma janela aberta, remove antes de criar outra
        const existingWindow = document.getElementById("folder-window");
        if (existingWindow) existingWindow.remove();
    
        // Cria a janela
        const windowDiv = document.createElement("div");
        windowDiv.id = "folder-window";
        windowDiv.classList.add("folder-window");
    
        // Adiciona um título com o nome da pasta
        const titleBar = document.createElement("div");
        titleBar.classList.add("window-title-bar");
        titleBar.innerHTML = `
            <span>${folderName}</span> 
            <button id="close-window">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                </svg>
            </button>
        `;
    
        // Permitir mover a janela
        this.makeWindowDraggable(windowDiv, titleBar);
    
        // Adiciona conteúdo da pasta
        const contentDiv = document.createElement("div");
        contentDiv.classList.add("window-content");
    
        // Obtém os arquivos da pasta a partir do Terminal
        const folderContent = this.terminal.directories[`/home/${folderName}/`]?.contentDir || [];

        if (folderContent.length > 0) {
            folderContent.forEach(file => {
                const fileDiv = document.createElement("div");
                fileDiv.classList.add("file-item");
                fileDiv.textContent = '📁'+ file.name;
                contentDiv.appendChild(fileDiv);
            });
        } else {
            contentDiv.innerHTML = "<p>Esta pasta está vazia</p>";
        }
    
        // Fecha a janela ao clicar no botão ❌
        titleBar.querySelector("#close-window")?.addEventListener("click", () => windowDiv.remove());
    
        // Alça de redimensionamento (📐)
        const resizeHandle = document.createElement("div");
        resizeHandle.classList.add("resize-handle");
    
        // Permitir mover e redimensionar a janela
        this.makeWindowDraggable(windowDiv, titleBar);
        this.makeWindowResizable(windowDiv, resizeHandle);
    
        // Monta a janela na tela
        windowDiv.appendChild(titleBar);
        windowDiv.appendChild(contentDiv);
        windowDiv.appendChild(resizeHandle);
        document.body.appendChild(windowDiv);
    }
    
    makeWindowDraggable(windowDiv: HTMLDivElement, titleBar: HTMLDivElement): void {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
    
        titleBar.addEventListener("mousedown", (event: MouseEvent) => {
            isDragging = true;
            offsetX = event.clientX - windowDiv.offsetLeft;
            offsetY = event.clientY - windowDiv.offsetTop;
            event.preventDefault();
        });
    
        document.addEventListener("mousemove", (event: MouseEvent) => {
            if (!isDragging) return;
    
            // Pega os limites da tela
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
    
            // Calcula a nova posição da janela
            let newX = event.clientX - offsetX;
            let newY = event.clientY - offsetY;
    
            // Impede que a janela saia dos limites do navegador
            newX = Math.max(0, Math.min(screenWidth - windowDiv.clientWidth, newX));
            newY = Math.max(0, Math.min(screenHeight - windowDiv.clientHeight, newY));
    
            // Aplica a posição corrigida
            windowDiv.style.left = `${newX}px`;
            windowDiv.style.top = `${newY}px`;
        });
    
        document.addEventListener("mouseup", () => {
            isDragging = false;
        });
    }

   


    makeWindowResizable(windowDiv: HTMLDivElement, resizeHandle: HTMLDivElement): void {
        let isResizing = false;
    
        // Defina os limites de tamanho
        const minWidth = 200;
        const minHeight = 150;
        const maxWidth = 500;
        const maxHeight = 400;
    
        resizeHandle.addEventListener("mousedown", (event: MouseEvent) => {
            isResizing = true;
            event.preventDefault();
        });
    
        document.addEventListener("mousemove", (event: MouseEvent) => {
            if (!isResizing) return;
    
            // Calcula o novo tamanho dentro dos limites
            const newWidth = Math.max(minWidth, Math.min(maxWidth, event.clientX - windowDiv.offsetLeft));
            const newHeight = Math.max(minHeight, Math.min(maxHeight, event.clientY - windowDiv.offsetTop));
    
            // Aplica o novo tamanho dentro dos limites
            windowDiv.style.width = `${newWidth}px`;
            windowDiv.style.height = `${newHeight}px`;
        });
    
        document.addEventListener("mouseup", () => {
            isResizing = false;
        });
    }

    createFolderInsideWindow(windowDiv: HTMLDivElement, folderName: string = "Nova Pasta"): void {
        const folderPath = windowDiv.dataset.path; // Caminho da pasta aberta na janela
        if (!folderPath) return;
    
        // Criar pasta no sistema de arquivos do terminal
        this.terminal.handleMkdir(["mkdir", folderName]);
    
        // Criar visualmente na janela
        const folderDiv = document.createElement("div");
        folderDiv.classList.add("folder");
        folderDiv.textContent = folderName;
    
        folderDiv.addEventListener("dblclick", () => {
            this.openFolder(folderPath + "/" + folderName);
        });
    
        windowDiv.querySelector(".window-content")?.appendChild(folderDiv);
    }
}
