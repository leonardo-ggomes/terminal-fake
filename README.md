<div align="center">

<br/>

```
██╗      ██████╗        ██████╗ ███████╗
██║     ██╔════╝       ██╔═══██╗██╔════╝
██║     ██║  ███╗█████╗██║   ██║███████╗
██║     ██║   ██║╚════╝██║   ██║╚════██║
███████╗╚██████╔╝       ╚██████╔╝███████║
╚══════╝ ╚═════╝         ╚═════╝ ╚══════╝
```

**Um desktop OS simulado, rodando no navegador.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

<br/>

![LG-OS Demo](https://placehold.co/860x480/0a0e1a/60a5fa?text=LG-OS+Desktop&font=monospace)

</div>

---

## Sobre o Projeto

**LG-OS** é uma simulação de sistema operacional desktop rodando inteiramente no browser. Desenvolvido com TypeScript puro e Vite, sem frameworks ou bibliotecas externas, o projeto recria a experiência de boot, instalação e uso de um OS — da tela de BIOS até o desktop com aplicativos funcionais.

A proposta é puramente educacional e experimental: explorar DOM manipulation, programação orientada a objetos em TypeScript e design de interfaces complexas sem depender de nenhum framework de UI.

---

## Funcionalidades

### 🖥 Sequência de Boot
- **Simulação de BIOS** com POST completo: contador de memória animado, detecção de drives, inicialização de USB e sumário de hardware
- **Barra de progresso** de carregamento do OS com porcentagem
- **Mensagens de boot** estilo `systemd` com delay progressivo

### ⚙️ Setup de Instalação (primeira execução)
- Wizard de 4 etapas com animações de transição
- **Conta de usuário** com validação em tempo real
- **Cor de destaque** com prévia ao vivo (6 opções)
- **Papel de parede** selecionável (5 presets)
- **Tela de instalação** com log de tarefas animado
- Configurações salvas em `localStorage` — o setup só aparece uma vez

### 🗂 Desktop
- Ícones de pastas arrastáveis
- **Menu de contexto** com: Nova Pasta, Novo Arquivo, Abrir Terminal, Explorador de Arquivos, Atualizar
- Modal customizado elegante (sem `prompt()` nativo)
- Wallpaper com gradiente mesh dinâmico

### 📌 Taskbar (estilo Windows 11)
- **Dock central** com ícones dos apps fixados
- Indicador de app ativo (ponto abaixo do ícone)
- **Menu Iniciar** com avatar do usuário, grid de apps e botão desligar
- System tray com ícones de Wi-Fi e volume
- Relógio com hora e data em tempo real

### 🪟 Sistema de Janelas
- Glassmorphism com `backdrop-filter` real
- Animações de abertura e fechamento (`spring` cubic-bezier)
- Arrastar pela barra de título
- Redimensionar pelo canto inferior direito
- Minimizar, maximizar/restaurar, fechar
- Z-index dinâmico — janela focada sempre ao topo

### 📁 Explorador de Arquivos
- Navegação completa pelo sistema de arquivos virtual
- Sidebar com favoritos e acesso rápido
- Toolbar com botões voltar, avançar, subir, caminho atual, busca e nova pasta
- Grid de ícones com duplo clique para navegar ou abrir arquivos
- Menu de contexto por item (abrir, excluir)
- Status bar com contagem de itens

### 📝 Bloco de Notas
- Editor de texto completo com `<textarea>`
- Menubar com ação de salvar (`Ctrl+S`)
- Status bar com linha, coluna e contagem de caracteres
- Toast de confirmação ao salvar
- Integrado ao sistema de arquivos virtual do terminal

### 🔢 Calculadora
- Grid 4×5 com todas as operações básicas
- Histórico da expressão digitada
- Suporte a `±`, `%` e backspace `⌫`
- Avaliação segura via `Function()`

### ⚙️ Configurações
- **Sistema:** informações de hardware simulado
- **Personalização:** troca de wallpaper ao vivo com 6 presets
- **Sobre:** versão, build, kernel e autor

### 💻 Terminal
- Prompt colorido com `usuario@host:diretório$`
- Sistema de arquivos virtual em memória com suporte a:

| Comando | Descrição |
|---------|-----------|
| `ls` | Lista arquivos e diretórios |
| `cd [dir]` | Navega entre diretórios |
| `mkdir [nome]` | Cria um novo diretório |
| `rmdir [dir]` | Remove um diretório vazio |
| `pwd` | Exibe o caminho atual |
| `nano [arquivo]` | Editor de texto no terminal (Ctrl+S / Ctrl+X) |
| `cat [arquivo]` | Exibe o conteúdo de um arquivo |
| `rm [arquivo]` | Remove um arquivo |
| `ifconfig` | Informações de rede simuladas |
| `top` | Lista de processos simulados |
| `clear` | Limpa o terminal |
| `help` | Lista todos os comandos disponíveis |
| `startfx` | Inicia o Desktop |

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| **TypeScript** | Toda a lógica da aplicação, tipagem estrita |
| **Vite** | Build tool e dev server |
| **CSS puro** | Todo o styling — glassmorphism, animações, layout |
| **Web APIs** | DOM, localStorage, `backdrop-filter`, CSS variables |

Sem React, Vue, Angular ou qualquer biblioteca de UI. Zero dependências de runtime.

---

## Estrutura do Projeto

```
src/
├── terminal.ts      # Entry point, inicialização, comandos do terminal
├── Desktop.ts       # Desktop, janelas, apps, taskbar, menu de contexto
├── Bios.ts          # Simulação de BIOS e sequência de boot
├── Setup.ts         # Wizard de instalação (4 etapas) + localStorage
└── style.css        # Todo o CSS global (BIOS, Setup, Desktop, janelas, apps)

index.html           # HTML minimalista — apenas o entry point
```

---

## Como Rodar

**Pré-requisitos:** Node.js 18+ e npm.

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/lg-os.git
cd lg-os

# Instale as dependências
npm install

# Rode o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173` no navegador.

```bash
# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## Resetar a Instalação

O Setup só aparece uma vez — as configurações ficam salvas no `localStorage`. Para ver o wizard novamente, execute no console do navegador:

```js
localStorage.removeItem('lgos_config')
// depois recarregue a página
location.reload()
```

---

## Fluxo de Execução

```
Página carrega
     │
     ▼
  BIOS POST
(~4s de animação)
     │
     ▼
localStorage tem 'lgos_config'?
     │
  ┌──┴──────────┐
  │ não         │ sim
  ▼             ▼
Setup Wizard  applyConfig()
(4 etapas)        │
  │               │
  ▼               │
saveConfig()       │
applyConfig()      │
     │             │
     └──────┬──────┘
            ▼
        Boot messages
        (systemd style)
            │
            ▼
         Terminal
    (aguarda 'startfx')
            │
            ▼
         Desktop
```

---

## Decisões de Design

**Por que sem framework?**
O objetivo é demonstrar que interfaces complexas são perfeitamente construíveis com Web APIs nativas. Cada janela, animação e componente é DOM puro — o que também resulta em um bundle minúsculo.

**Por que glassmorphism?**
O Windows 11 popularizou o `backdrop-filter` como linguagem de design para OS. Faz sentido para o contexto do projeto e cria profundidade visual sem necessidade de imagens.

**Por que `localStorage` para o Setup?**
Simula o comportamento real de um OS — a "instalação" acontece uma vez e as preferências persistem. Também é o único storage disponível sem backend.

---

## Autor

Desenvolvido por **Leonardo G**

---

<div align="center">

Se o projeto foi útil ou interessante, deixe uma ⭐

</div>
