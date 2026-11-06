import { describe, expect, test } from 'bun:test'
import { DEFAULT_SIZE, MIN_SIZE, defaultBounds, normalizeBounds } from './bounds'

const primaryScreen = { x: 0, y: 0, width: 1920, height: 1080 }

describe('defaultBounds', () => {
  test('anchors a new window to the bottom-right with a margin', () => {
    const bounds = defaultBounds(primaryScreen)

    expect(bounds.width).toBe(DEFAULT_SIZE.width)
    expect(bounds.height).toBe(DEFAULT_SIZE.height)
    expect(bounds.x + bounds.width).toBeLessThan(primaryScreen.width)
    expect(bounds.y + bounds.height).toBeLessThan(primaryScreen.height)
  })

  test('respects the taskbar work area offset', () => {
    const workArea = { x: 0, y: 0, width: 1920, height: 1040 }
    const bounds = defaultBounds(workArea)

    expect(bounds.y + bounds.height).toBeLessThan(workArea.height)
  })
})

describe('normalizeBounds', () => {  test('accepts saved bounds that are visible', () => {
    const saved = { x: 300, y: 200, width: 400, height: 400 }
    expect(normalizeBounds(saved, [primaryScreen])).toEqual(saved)
  })

  test('rejects bounds on a monitor that no longer exists', () => {
    const saved = { x: 5000, y: 200, width: 400, height: 400 }
    expect(normalizeBounds(saved, [primaryScreen])).toBeNull()
  })

  test('enforces the minimum window size', () => {
    const saved = { x: 100, y: 100, width: 50, height: 40 }
    const result = normalizeBounds(saved, [primaryScreen])

    expect(result?.width).toBe(MIN_SIZE.width)
    expect(result?.height).toBe(MIN_SIZE.height)
  })

  test('rejects non-finite coordinates', () => {
    const saved = { x: Number.NaN, y: 100, width: 300, height: 300 }
    expect(normalizeBounds(saved, [primaryScreen])).toBeNull()
  })

  test('accepts bounds on a secondary display', () => {
    const secondaryScreen = { x: 1920, y: 0, width: 1920, height: 1080 }
    const saved = { x: 2200, y: 300, width: 340, height: 380 }

    expect(normalizeBounds(saved, [primaryScreen, secondaryScreen])).toEqual(saved)
  })
})
