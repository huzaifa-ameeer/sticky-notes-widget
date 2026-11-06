import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { WindowStateStore } from './windowState'

let directory: string

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'sticky-notes-window-'))
})

afterEach(() => {
  rmSync(directory, { recursive: true, force: true })
})

describe('WindowStateStore', () => {
  test('returns null when no state has been saved', () => {
    const store = new WindowStateStore(directory)
    expect(store.load()).toBeNull()
  })

  test('round-trips window bounds', () => {
    const store = new WindowStateStore(directory)
    const bounds = { x: 120, y: 340, width: 420, height: 500 }

    store.save(bounds)
    expect(new WindowStateStore(directory).load()).toEqual(bounds)
  })

  test('returns null for malformed state files', () => {
    writeFileSync(join(directory, 'window-state.json'), JSON.stringify({ x: 'a' }), 'utf-8')

    const store = new WindowStateStore(directory)
    expect(store.load()).toBeNull()
  })
})
