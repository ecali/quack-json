# 🦆 quack-json

> A fast, lightweight JSON viewer with interactive tree visualization — available as a native desktop app for **macOS** and **Windows**.

![quack-json screenshot](https://via.placeholder.com/900x560/13131a/f6c90e?text=quack-json+%F0%9F%A6%86)

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

## Quick start (pre-built)

### macOS

Download from the [Releases](https://github.com/ecali/quack-json/releases) page:

| Build | File |
|---|---|
| Apple Silicon (M1/M2/M3) | `quack-json-x.x.x-arm64.dmg` |
| Intel | `quack-json-x.x.x.dmg` |

1. Open the `.dmg` file
2. Drag **quack-json** into your Applications folder
3. Launch from Spotlight or Applications

> **Note:** The app is not code-signed. On first launch, right-click → Open to bypass Gatekeeper.

### Windows

Download `quack-json-x.x.x-setup.exe` from [Releases](https://github.com/ecali/quack-json/releases):

1. Run the installer and follow the steps
2. A desktop shortcut is created automatically
3. Launch quack-json from the desktop or Start menu

A `portable.exe` is also available — no installation required, just run it.

---

## Usage guide

### 1. Paste JSON

Click inside the **JSON Input** panel on the left and paste your JSON.  
The tree view on the right updates instantly.

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

- **Click a `▶` arrow** (or anywhere on the row) to expand a node
- **Click a `▼` arrow** to collapse it
- **Click any primitive value** (string, number, boolean, null) to copy it to clipboard
- Use **Expand All** / **Collapse All** in the toolbar to toggle the entire tree

### 3. Load from file

Click **Load File** to open a native file picker and load any `.json` file from disk.

### 4. Format

Click **Format** to re-indent the raw JSON in the editor (2-space indent).  
Useful for minified or badly formatted input.

### 5. Copy

Click **Copy** to copy the current formatted JSON to clipboard.  
The button briefly changes to `✓ Copied` as confirmation.

### 6. Resize panels

Drag the vertical divider between the two panels to adjust the split.  
The split ratio is constrained between 20% and 80%.

---

## Development

### Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later

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

This starts Vite with HMR and opens an Electron window. Changes to `src/` are reflected immediately via hot module replacement. Changes to `electron/main.ts` trigger a full restart.

### Build for production

```bash
npm run build
```

Produces:
- `dist/` — compiled renderer (React app)
- `dist-electron/` — compiled main process and preload

### Package installers

```bash
# macOS (DMG + ZIP, both arm64 and x64)
npm run dist:mac

# Windows (NSIS installer + portable EXE, x64)
npm run dist:win

# Both platforms at once
npm run dist:all
```

Outputs land in the `release/` directory.

---

## Project structure

```
quack-json/
├── electron/
│   ├── main.ts          # Electron main process (window, IPC, file dialog)
│   └── preload.ts       # Preload script — exposes electronAPI to renderer
├── src/
│   ├── components/
│   │   └── JsonTree.tsx # Recursive JSON tree component
│   ├── App.tsx          # Root component — layout, state, toolbar logic
│   ├── App.css          # All styles (CSS variables, layout, tree colors)
│   ├── env.d.ts         # TypeScript declaration for window.electronAPI
│   ├── index.css        # Minimal base reset
│   └── main.tsx         # React entry point
├── public/
│   └── favicon.svg      # Duck SVG favicon
├── package.json         # Scripts + electron-builder config
├── vite.config.ts       # Vite + vite-plugin-electron config
├── tsconfig.json        # TypeScript project references
├── tsconfig.app.json    # TypeScript config for src/ (browser)
└── tsconfig.node.json   # TypeScript config for electron/ + vite.config (Node)
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
| Icons | [lucide-react](https://lucide.dev) |

No external JSON viewer library is used — the tree component (`src/components/JsonTree.tsx`) is built from scratch as a recursive React component.

---

## Architecture notes

### IPC flow (file loading)

```
Renderer (React)
  └─ window.electronAPI.openFile()          [contextBridge]
       └─ ipcRenderer.invoke('open-file-dialog')
            └─ ipcMain.handle('open-file-dialog')   [main process]
                 └─ dialog.showOpenDialog()
                      └─ readFileSync(path)
                           └─ returns string to renderer
```

Security model: `nodeIntegration` is disabled and `contextIsolation` is enabled. The renderer never has direct access to Node.js APIs — only the minimal surface exposed via `contextBridge` in `preload.ts`.

### JsonTree component

`JsonNode` (in `JsonTree.tsx`) is a self-recursive component that:

1. Detects the value type: object, array, or primitive
2. For **complex** values (object/array): renders an expand/collapse header, then maps children as nested `JsonNode` instances
3. For **primitives**: renders a colored `<span>` with click-to-copy
4. Responds to `expandTrigger` and `collapseTrigger` counters (passed from `App`) via `useEffect` — incrementing either counter forces all nodes to expand or collapse regardless of their current local state

### Expand/collapse trigger pattern

Rather than a boolean `expandAll` prop (which would be ignored if already `true` when clicked again), the component uses monotonically-increasing integer triggers:

```tsx
// In App.tsx
const [expandTrigger, setExpandTrigger] = useState(0)
const handleExpandAll = () => setExpandTrigger(t => t + 1)

// In JsonNode.tsx
useEffect(() => {
  if (expandTrigger > 0) setIsExpanded(true)
}, [expandTrigger])
```

This guarantees re-expansion works even if the tree is already at a mixed state.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push and open a Pull Request

---

## License

MIT
