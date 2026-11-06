import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { sanitizeNoteHtml } from '../lib/sanitizeNote'

interface NoteEditorProps {
  initialHtml: string
  ready: boolean
  placeholder: string
  onChange: (html: string) => void
}

export default function NoteEditor({
  initialHtml,
  ready,
  placeholder,
  onChange
}: NoteEditorProps): React.JSX.Element {
  const editorRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    const editor = editorRef.current
    if (!ready || !editor || initializedRef.current) return

    editor.innerHTML = sanitizeNoteHtml(initialHtml)
    syncEmptyState(editor)
    editor.focus()
    initializedRef.current = true
  }, [initialHtml, ready])

  function syncEmptyState(editor: HTMLDivElement): void {
    editor.dataset.empty = String((editor.textContent ?? '').length === 0)
  }

  function emitChange(): void {
    const editor = editorRef.current
    if (!editor) return
    syncEmptyState(editor)
    onChange(editor.innerHTML)
  }

  function applyCommand(command: string, value?: string): void {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()
    document.execCommand(command, false, value)
    emitChange()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (!event.ctrlKey || event.altKey || event.metaKey) return

    const key = event.key.toLowerCase()

    if (event.shiftKey) {
      if (key === 'x') {
        event.preventDefault()
        applyCommand('strikeThrough')
        return
      }
      if (event.code === 'Digit7') {
        event.preventDefault()
        applyCommand('insertOrderedList')
        return
      }
      if (event.code === 'Digit8') {
        event.preventDefault()
        applyCommand('insertUnorderedList')
      }
      return
    }

    if (key === 'b') {
      event.preventDefault()
      applyCommand('bold')
      return
    }
    if (key === 'i') {
      event.preventDefault()
      applyCommand('italic')
      return
    }
    if (key === 'u') {
      event.preventDefault()
      applyCommand('underline')
      return
    }
    if (key === '\\') {
      event.preventDefault()
      applyCommand('removeFormat')
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>): void {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    emitChange()
  }

  return (
    <div
      ref={editorRef}
      className="note__editor"
      role="textbox"
      aria-multiline="true"
      aria-label="Note"
      tabIndex={0}
      contentEditable={ready}
      suppressContentEditableWarning
      spellCheck
      data-empty="true"
      data-placeholder={placeholder}
      onInput={emitChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onDrop={(event) => event.preventDefault()}
    />
  )
}
