const ALLOWED_TAGS = new Set([
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'STRIKE',
  'BR',
  'P',
  'DIV',
  'SPAN',
  'UL',
  'OL',
  'LI'
])

export function sanitizeNoteHtml(html: string): string {
  if (!html) return ''

  const template = document.createElement('template')
  template.innerHTML = html

  const elements = Array.from(template.content.querySelectorAll('*'))

  for (const element of elements) {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      continue
    }

    for (const attribute of Array.from(element.attributes)) {
      element.removeAttribute(attribute.name)
    }
  }

  return template.innerHTML
}
