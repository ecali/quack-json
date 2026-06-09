import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (): Promise<string | null> => ipcRenderer.invoke('open-file-dialog'),
})
