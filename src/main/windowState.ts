import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { WindowBounds } from '../shared/types'

const STATE_FILE = 'window-state.json'

function parseBounds(value: unknown): WindowBounds | null {
  if (typeof value !== 'object' || value === null) return null

  const record = value as Record<string, unknown>
  const keys = ['x', 'y', 'width', 'height'] as const
  if (!keys.every((key) => typeof record[key] === 'number' && Number.isFinite(record[key]))) {
    return null
  }

  return {
    x: record.x as number,
    y: record.y as number,
    width: record.width as number,
    height: record.height as number
  }
}

export class WindowStateStore {
  private readonly filePath: string

  constructor(directory: string) {
    this.filePath = join(directory, STATE_FILE)
  }

  load(): WindowBounds | null {
    try {
      return parseBounds(JSON.parse(readFileSync(this.filePath, 'utf-8')))
    } catch {
      return null
    }
  }

  save(bounds: WindowBounds): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      writeFileSync(this.filePath, JSON.stringify(bounds, null, 2), 'utf-8')
    } catch (error) {
      console.error('[window-state] Failed to persist window bounds:', error)
    }
  }
}
