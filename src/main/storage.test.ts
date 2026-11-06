import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { NoteStore } from './storage'

let directory: string

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'sticky-notes-'))
})

afterEach(() => {
  rmSync(directory, { recursive: true, force: true })
})

describe('NoteStore', () => {
  test('starts empty when no note file exists', () => {
    const store = new NoteStore(directory)
    expect(store.get()).toEqual({ content: '', updatedAt: '' })
  })

  test('persists content and reloads it from disk', () => {
    const store = new NoteStore(directory)
    store.save('hello world')

    const reloaded = new NoteStore(directory)
    expect(reloaded.get().content).toBe('hello world')
    expect(reloaded.get().updatedAt).not.toBe('')
  })

  test('writes valid JSON atomically and leaves no temp file', () => {
    const store = new NoteStore(directory)
    store.save('atomic write')

    const parsed = JSON.parse(readFileSync(join(directory, 'note.json'), 'utf-8'))
    expect(parsed.content).toBe('atomic write')
    expect(existsSync(join(directory, 'note.json.tmp'))).toBe(false)
  })

  test('keeps a backup and starts empty when the JSON is corrupt', () => {
    writeFileSync(join(directory, 'note.json'), '{ this is not json', 'utf-8')

    const store = new NoteStore(directory)
    expect(store.get().content).toBe('')
    expect(existsSync(join(directory, 'note.json.corrupt.json'))).toBe(true)
  })

  test('ignores JSON with an invalid content field', () => {
    writeFileSync(join(directory, 'note.json'), JSON.stringify({ content: 42 }), 'utf-8')

    const store = new NoteStore(directory)
    expect(store.get().content).toBe('')
  })
})
