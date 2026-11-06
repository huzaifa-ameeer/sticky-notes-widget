import { useCallback, useEffect, useRef, useState } from 'react'

const SAVE_DEBOUNCE_MS = 500

export type SaveState = 'loading' | 'idle' | 'pending' | 'saving' | 'error'

export interface UseNoteResult {
  content: string
  saveState: SaveState
  updateContent: (value: string) => void
}

export function useNote(): UseNoteResult {
  const [content, setContent] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('loading')

  const contentRef = useRef('')
  const revisionRef = useRef(0)
  const savedRevisionRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    let cancelled = false

    window.notes
      .loadNote()
      .then((note) => {
        if (cancelled) return
        contentRef.current = note.content
        setContent(note.content)
        setSaveState('idle')
      })
      .catch((error: unknown) => {
        console.error('Failed to load note:', error)
        if (cancelled) return
        setSaveState('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const persist = useCallback(async (revision: number, value: string): Promise<void> => {
    setSaveState('saving')
    try {
      await window.notes.saveNote(value)
      savedRevisionRef.current = Math.max(savedRevisionRef.current, revision)
      if (mountedRef.current) {
        setSaveState(revisionRef.current > savedRevisionRef.current ? 'pending' : 'idle')
      }
    } catch (error) {
      console.error('Failed to save note:', error)
      if (mountedRef.current) setSaveState('error')
    }
  }, [])

  const flush = useCallback(async (): Promise<void> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const revision = revisionRef.current
    if (revision <= savedRevisionRef.current) return

    await persist(revision, contentRef.current)
  }, [persist])

  const updateContent = useCallback(
    (value: string): void => {
      revisionRef.current += 1
      contentRef.current = value
      setContent(value)
      setSaveState('pending')

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void flush()
      }, SAVE_DEBOUNCE_MS)
    },
    [flush]
  )

  useEffect(() => {
    const handleBeforeUnload = (): void => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      if (revisionRef.current > savedRevisionRef.current) {
        window.notes.saveNoteSync(contentRef.current)
        savedRevisionRef.current = revisionRef.current
      }
    }

    const handleBlur = (): void => {
      void flush()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('blur', handleBlur)
    }
  }, [flush])

  return { content, saveState, updateContent }
}
