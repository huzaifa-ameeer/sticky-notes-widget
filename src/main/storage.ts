import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { NoteData } from '../shared/types'

const NOTE_FILE = 'note.json'
const EMPTY_NOTE: NoteData = { content: '', updatedAt: '' }

export class NoteStore {
  private readonly filePath: string
  private readonly tempPath: string
  private current: NoteData

  constructor(private readonly directory: string) {
    this.filePath = join(directory, NOTE_FILE)
    this.tempPath = `${this.filePath}.tmp`
    this.current = this.read()
  }

  get(): NoteData {
    return this.current
  }

  save(content: string, now = new Date()): NoteData {
    const note: NoteData = { content, updatedAt: now.toISOString() }

    mkdirSync(this.directory, { recursive: true })
    writeFileSync(this.tempPath, JSON.stringify(note, null, 2), 'utf-8')
    renameSync(this.tempPath, this.filePath)

    this.current = note
    return note
  }

  private read(): NoteData {
    try {
      if (!existsSync(this.filePath)) return { ...EMPTY_NOTE }

      const parsed: unknown = JSON.parse(readFileSync(this.filePath, 'utf-8'))
      if (typeof parsed !== 'object' || parsed === null) return { ...EMPTY_NOTE }

      const record = parsed as Record<string, unknown>
      if (typeof record.content !== 'string') return { ...EMPTY_NOTE }

      return {
        content: record.content,
        updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : ''
      }
    } catch (error) {
      console.error('[storage] Failed to read note:', error)
      this.backupCorruptFile()
      return { ...EMPTY_NOTE }
    }
  }

  private backupCorruptFile(): void {
    try {
      if (!existsSync(this.filePath)) return
      copyFileSync(this.filePath, `${this.filePath}.corrupt.json`)
    } catch (error) {
      console.error('[storage] Failed to back up corrupt note file:', error)
    }
  }
}
