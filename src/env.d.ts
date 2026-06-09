interface Window {
  electronAPI?: {
    openFile: () => Promise<string | null>
  }
}
