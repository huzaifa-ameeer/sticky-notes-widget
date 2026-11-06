export interface NoteData {
  content: string
  updatedAt: string
}

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface NotesApi {
  loadNote: () => Promise<NoteData>
  saveNote: (content: string) => Promise<void>
  saveNoteSync: (content: string) => void
  minimizeWindow: () => void
  closeWindow: () => void
}

export const IPC = {
  loadNote: 'note:load',
  saveNote: 'note:save',
  saveNoteSync: 'note:save-sync',
  minimizeWindow: 'window:minimize',
  closeWindow: 'window:close'
} as const
