# Operational Approach Mapper — Pro (React + Vite)

A robust, classroom‑ready JP 5‑0 operational approach builder and live one‑slide visual, designed for Codespaces or local dev.

## Highlights
- **Soft‑Delete Trash**: Delete sends items to a recoverable Trash. Restore or Permanently Delete later.
- **Auto‑Condense Slide**: Live one‑slide OA view scales typography and cards to fit growing phases/elements.
- **Better Error Handling**: Error boundaries, guard rails for undefined links, descriptive toasts and inline messages.
- **Clipboard‑Safe**: Native copy if permitted; graceful modal fallback with Select‑All and Download .txt.
- **Modern UI/UX**: CSS variables, light/dark auto, focus rings, keyboard shortcuts (Del = soft‑delete when item focused, Ctrl/Cmd+Z = undo).
- **Tested Reducers**: Vitest unit tests for delete, restore, and cross‑link cleanup.
- **Export/Import JSON**: Portable state for reuse across classes.

## Codespaces (recommended)
1. Create Codespace from an empty repo or any repo.
2. In terminal:
   ```bash
   npm create vite@latest oa-mapper -- --template react
   cd oa-mapper
   npm install
   npm i zustand classnames html2canvas
   npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
   ```
3. Replace files with those from this zip:
   - `src/App.jsx`
   - `src/main.jsx`
   - `src/index.css`
   - `src/mapper/OperationalApproachMapper.jsx`
   - `src/mapper/ErrorBoundary.jsx`
   - `src/mapper/store.js`
   - `src/mapper/__tests__/store.test.js`
   - `vitest.config.js`
4. Run:
   ```bash
   npm run dev
   ```
5. Tests:
   ```bash
   npm run test
   ```

## Expected behavior
- Clicking the red × soft‑deletes an item (visible toast). It moves to Trash, links are detached safely.
- Undo via toast returns the item with links (where possible). Trash allows restore later.
- One‑slide view auto‑condenses to stay on a single page; if still overflowing, it enables smooth horizontal scroll.
- “Copy for AI Review” uses native clipboard if available, else opens the fallback modal.
- If you want different behavior (e.g., **always** open modal, or autosave to localStorage), tell me and I’ll adjust.
