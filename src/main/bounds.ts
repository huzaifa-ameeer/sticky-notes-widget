import type { Rectangle, WindowBounds } from '../shared/types'

export const DEFAULT_SIZE = { width: 340, height: 380 } as const
export const MIN_SIZE = { width: 240, height: 220 } as const

const EDGE_MARGIN = 24
const MIN_VISIBLE = 48

export function defaultBounds(workArea: Rectangle): WindowBounds {
  const width = Math.min(DEFAULT_SIZE.width, workArea.width)
  const height = Math.min(DEFAULT_SIZE.height, workArea.height)

  return {
    width,
    height,
    x: Math.round(workArea.x + workArea.width - width - EDGE_MARGIN),
    y: Math.round(workArea.y + workArea.height - height - EDGE_MARGIN)
  }
}

export function normalizeBounds(bounds: WindowBounds, workAreas: Rectangle[]): WindowBounds | null {
  const values = [bounds.x, bounds.y, bounds.width, bounds.height]
  if (!values.every((value) => Number.isFinite(value))) return null
  if (workAreas.length === 0) return null

  const width = Math.max(MIN_SIZE.width, Math.round(bounds.width))
  const height = Math.max(MIN_SIZE.height, Math.round(bounds.height))
  const candidate: WindowBounds = {
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width,
    height
  }

  const visible = workAreas.some((area) => {
    const overlapX =
      Math.min(candidate.x + width, area.x + area.width) - Math.max(candidate.x, area.x)
    const overlapY =
      Math.min(candidate.y + height, area.y + area.height) - Math.max(candidate.y, area.y)
    return overlapX >= MIN_VISIBLE && overlapY >= MIN_VISIBLE
  })

  return visible ? candidate : null
}
