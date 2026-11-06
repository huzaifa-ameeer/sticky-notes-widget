import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type NoteData, type NotesApi } from '../shared/types'

const notesApi: NotesApi = {
  loadNote: () => ipcRenderer.invoke(IPC.loadNote) as Promise<NoteData>,
  saveNote: (content: string) => ipcRenderer.invoke(IPC.saveNote, content) as Promise<void>,
  saveNoteSync: (content: string) => {
    ipcRenderer.sendSync(IPC.saveNoteSync, content)
  },
  minimizeWindow: () => {
    ipcRenderer.send(IPC.minimizeWindow)
  },
  closeWindow: () => {
    ipcRenderer.send(IPC.closeWindow)
  }
}

contextBridge.exposeInMainWorld('notes', notesApi)
