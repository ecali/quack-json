# 🦆 quack-json

<p>
  <a href="https://github.com/ecali/quack-json/actions/workflows/release.yml">
    <img src="https://github.com/ecali/quack-json/actions/workflows/release.yml/badge.svg" alt="Build & Release">
  </a>
  <a href="https://github.com/ecali/quack-json/releases/latest">
    <img src="https://img.shields.io/github/v/release/ecali/quack-json?color=f6c90e&label=latest" alt="Latest Release">
  </a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey" alt="Platform">
  <img src="https://img.shields.io/badge/Electron-41-47848f?logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License MIT">
  </a>
</p>

> A fast, lightweight JSON viewer with interactive tree visualization — native desktop app for **macOS** and **Windows**.

![quack-json UI](https://placehold.co/900x500/13131a/f6c90e?text=🦆+quack-json%0AJSON+Input+|+Tree+Viewer)

---

## Features

| Feature | Description |
|---|---|
| **Tree viewer** | Collapsible/expandable nodes for objects and arrays |
| **Syntax highlighting** | Keys, strings, numbers, booleans and null are color-coded |
| **Live validation** | JSON is parsed as you type — errors shown immediately |
| **Format** | Prettify/indent your JSON with one click |
| **Load file** | Open any `.json` file directly from disk |
| **Copy** | Copy the formatted JSON to clipboard |
| **Expand / Collapse all** | Toggle the whole tree at once |
| **Resizable panels** | Drag the divider between editor and tree view |
| **Click-to-copy values** | Click any primitive value in the tree to copy it |
| **Status bar** | Always shows `✓ Valid JSON` or the exact parse error |

---

## Download

| Platform | File | Notes |
|---|---|---|
| macOS Apple Silicon | `quack-json-x.x.x-arm64.dmg` | M1 / M2 / M3 |
| macOS Intel | `quack-json-x.x.x.dmg` | x64 |
| Windows installer | `quack-json.Setup.x.x.x.exe` | NSIS, with uninstaller |
| Windows portable | `quack-json.x.x.x.exe` | No installation needed |

**→ [Download latest release](https://github.com/ecali/quack-json/releases/latest)**

> **macOS note:** The app is not code-signed. On first launch, right-click → **Open** to bypass Gatekeeper.

---

## Usage guide

### 1. Paste or load JSON

Paste JSON directly in the **JSON Input** panel, or click **Load File** to open a file from disk.  
The tree updates instantly as you type.

```json
{
  "user": {
    "name": "Jane",
    "age": 28,
    "roles": ["admin", "editor"]
  },
  "active": true
}
```

### 2. Navigate the tree

| Action | Result |
|---|---|
| Click `▶` / `▼` on a row | Expand / collapse that node |
| Click a primitive value | Copy it to clipboard |
| **Expand All** button | Recursively expand all nodes |
| **Collapse All** button | Recursively collapse all nodes |

### 3. Toolbar actions

| Button | Description |
|---|---|
| **Format** | Re-indent the raw JSON (2-space indent) |
| **Load File** | Open a `.json` file via native file picker |
| **Copy** | Copy the formatted JSON to clipboard |
| **Expand All** | Expand every node in the tree |
| **Collapse All** | Collapse every node in the tree |
| **Clear** | Empty the editor |

### 4. Resize panels

Drag the vertical divider to adjust the editor/tree split (20–80%).

---

## Development

### Prerequisites

- **Node.js** 18+
- **npm** 9+

### Clone and install

```bash
git clone https://github.com/ecali/quack-json.git
cd quack-json
npm install
```

### Run in development mode

```bash
npm run dev
```

Starts Vite with HMR and opens an Electron window. Renderer changes are hot-reloaded; changes to `electron/main.ts` trigger a full restart.

### Build for production

```bash
npm run build
```

Produces:
- `dist/` — compiled React renderer
- `dist-electron/` — compiled main process and preload

### Package installers

```bash
# macOS — DMG + ZIP for arm64 and x64
npm run dist:mac

# Windows — NSIS installer + portable EXE (x64)
npm run dist:win

# Both platforms
npm run dist:all
```

Output goes to `release/`.

### Create a release

Tag the commit and push — GitHub Actions takes care of the rest:

```bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

The [release workflow](.github/workflows/release.yml) builds on native macOS and Windows runners, then publishes all artifacts to a GitHub Release automatically.

---

## Project structure

```
quack-json/
├── .github/
│   └── workflows/
│       └── release.yml      # CI: build + publish on tag push
├── electron/
│   ├── main.ts              # Main process — window, IPC, file dialog
│   └── preload.ts           # Preload — exposes electronAPI to renderer
├── src/
│   ├── components/
│   │   └── JsonTree.tsx     # Recursive JSON tree component
│   ├── App.tsx              # Root — layout, state, toolbar logic
│   ├── App.css              # All styles (CSS variables, tree colors)
│   ├── env.d.ts             # Type declaration for window.electronAPI
│   ├── index.css            # Base reset
│   └── main.tsx             # React entry point
├── public/
│   └── favicon.svg          # Duck SVG favicon
├── package.json             # Scripts + electron-builder config
├── vite.config.ts           # Vite + vite-plugin-electron
├── tsconfig.json            # Project references root
├── tsconfig.app.json        # TypeScript for src/ (browser)
└── tsconfig.node.json       # TypeScript for electron/ + vite.config (Node)
```

---

## Tech stack

| Layer | Technology |
|---|---|
| UI framework | [React 19](https://react.dev) |
| Language | [TypeScript 6](https://www.typescriptlang.org) |
| Build tool | [Vite 8](https://vitejs.dev) |
| Desktop shell | [Electron 41](https://www.electronjs.org) |
| Electron + Vite bridge | [vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron) |
| Packaging | [electron-builder](https://www.electron.build) |
| CI / CD | [GitHub Actions](https://docs.github.com/en/actions) |

The JSON tree component (`src/components/JsonTree.tsx`) is built from scratch — no external viewer library.

---

## Architecture notes

### IPC flow (file loading)

```
Renderer (React)
  └─ window.electronAPI.openFile()
       └─ ipcRenderer.invoke('open-file-dialog')       [preload / contextBridge]
            └─ ipcMain.handle('open-file-dialog')      [main process]
                 └─ dialog.showOpenDialog()
                      └─ readFileSync(path) → string
```

`nodeIntegration` is disabled and `contextIsolation` is enabled. The renderer only accesses the minimal surface exposed via `contextBridge`.

### Expand / collapse trigger pattern

Nodes use monotonically-increasing counters instead of a boolean flag, so "Expand All" always works even if the tree is already in a mixed state:

```tsx
// App.tsx
const [expandTrigger, setExpandTrigger] = useState(0)
const handleExpandAll = () => setExpandTrigger(t => t + 1)

// JsonNode.tsx
useEffect(() => {
  if (expandTrigger > 0) setIsExpanded(true)
}, [expandTrigger])
```

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-feature`
3. Commit: `git commit -m "feat: add my feature"`
4. Push and open a Pull Request

---

## License

[MIT](LICENSE) © ecali
