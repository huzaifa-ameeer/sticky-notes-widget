# Sticky Notes

A lightweight, always-on-top desktop sticky note for Windows. It keeps one note in a compact frameless window, supports basic rich-text formatting, and saves automatically to local storage.

Built with Electron, React, TypeScript, Vite, and electron-vite.

## Features

- Frameless, always-on-top note that stays above other windows
- Rich-text editing: bold, italic, underline, strikethrough, and lists
- Plain-text paste to avoid unwanted HTML
- Autosave after 500 ms of inactivity, on window blur, and on close
- Remembers window position and size between launches
- Single-instance behavior: launching again focuses the existing note
- Bundled JetBrains Mono font
- Optional launch-at-startup support for packaged builds

## Download

Download the latest Windows installer from the [Releases](https://github.com/huzaifa-ameeer/sticky-notes-widget/releases) page.

The installer is named like `Sticky-Notes-1.0.0-Setup.exe`. It is currently unsigned, so Windows SmartScreen may show a warning. Choose **More info** and then **Run anyway** to continue.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+Shift+X` | Strikethrough |
| `Ctrl+Shift+7` | Numbered list |
| `Ctrl+Shift+8` | Bulleted list |
| `Ctrl+\` | Clear formatting |
| `Ctrl+M` | Minimize the note |

## Requirements

- Windows 10 or 11 (x64)
- [Bun](https://bun.sh/) 1.3 or newer
- Node.js 20.19 or newer

## Development

```powershell
bun install
bun run dev
```

If Electron is not available after installation, download its binary manually:

```powershell
node node_modules\electron\install.js
```

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the app in development mode with hot reload |
| `bun run start` | Preview the production build |
| `bun run typecheck` | Type-check the main, preload, and renderer code |
| `bun test` | Run the unit tests |
| `bun run build` | Type-check and build into `out/` |
| `bun run dist` | Build and create the Windows installer in `release/` |
| `bun run dist:dir` | Build an unpacked Windows app in `release/` |

## Building the Installer

```powershell
bun run dist
```

The NSIS installer is written to:

```text
release\Sticky-Notes-1.0.0-Setup.exe
```

## Publishing a Release

1. Run `bun run dist`.
2. Open the repository's **Releases** page and create a new release.
3. Create a tag such as `v1.0.0`.
4. Attach `release\Sticky-Notes-1.0.0-Setup.exe`.
5. Publish the release.

With GitHub CLI installed, the release can also be created from the terminal:

```powershell
gh release create v1.0.0 "release\Sticky-Notes-1.0.0-Setup.exe" --title "Sticky Notes 1.0.0" --generate-notes
```

## Data Storage

Note data is stored in the app's user data directory as JSON, typically:

- Installed app: `%APPDATA%\Sticky Notes`
- Development: `%APPDATA%\sticky-notes`

Files include:

- `note.json` - note content as HTML plus the last update time; HTML is sanitized when loaded
- `window-state.json` - saved window position and size
- `settings.json` - optional settings, such as launch at startup

If `note.json` cannot be parsed, the app keeps a backup as `note.json.corrupt.json` and starts with an empty note.

### Launch at Startup

For packaged builds, create `settings.json` in the user data directory:

```json
{
  "launchAtStartup": true
}
```

The setting is applied on the next app launch.

## Project Structure

```text
src/
  main/       Electron main process, note storage, window state, bounds
  preload/    Secure contextBridge API exposed to the renderer
  renderer/   React UI, editor, styles, and bundled fonts
  shared/     Shared types and IPC channel names
build/        Windows application icon
electron-builder.yml
electron.vite.config.ts
```

## Security

- `nodeIntegration` is disabled
- `contextIsolation` and the renderer sandbox are enabled
- The preload script exposes only a small typed notes API
- IPC senders are validated before handling requests
- Note HTML is sanitized against an allowlist of formatting tags
- External navigation and new windows are blocked
- A Content Security Policy is applied to the renderer

## Tests

```powershell
bun test
```

The test suite covers note storage and recovery, window bounds normalization, and window state persistence.

## License

MIT
