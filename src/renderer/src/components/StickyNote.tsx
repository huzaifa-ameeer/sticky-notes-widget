import { useEffect } from 'react'
import { useNote, type SaveState } from '../hooks/useNote'
import NoteEditor from './NoteEditor'

const STATUS_LABEL: Record<SaveState, string> = {
  loading: 'Loading note…',
  idle: 'Saved',
  pending: 'Unsaved changes',
  saving: 'Saving…',
  error: 'Save failed'
}

export default function StickyNote(): React.JSX.Element {
  const { content, saveState, updateContent } = useNote()
  const ready = saveState !== 'loading'

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent): void => {
      if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return
      if (event.key.toLowerCase() !== 'm') return

      event.preventDefault()
      window.notes.minimizeWindow()
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  return (
    <main className="note">
      <header className="note__header">
        <h1 className="note__title">My Notes</h1>
        <div className="note__actions">
          <span
            className={`note__status note__status--${saveState}`}
            title={STATUS_LABEL[saveState]}
            aria-hidden="true"
          />
          <button
            className="note__icon-button"
            type="button"
            title="Minimize"
            aria-label="Minimize"
            onClick={() => window.notes.minimizeWindow()}
          >
            <svg className="note__icon" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" />
              <path d="M5.5 10h5" />
            </svg>
          </button>
          <button
            className="note__icon-button note__icon-button--close"
            type="button"
            title="Close"
            aria-label="Close"
            onClick={() => window.notes.closeWindow()}
          >
            <svg className="note__icon note__icon--close" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4.5 4.5l7 7" />
              <path d="M11.5 4.5l-7 7" />
            </svg>
          </button>
        </div>
      </header>

      <NoteEditor
        initialHtml={content}
        ready={ready}
        placeholder={ready ? 'Write something…' : ''}
        onChange={updateContent}
      />
    </main>
  )
}
