# 📚 VocabNotebook — Developer Edition

A lightweight, developer-focused personal vocabulary and collocation dashboard built with React, TypeScript, Tailwind CSS, and Supabase.

Designed with a dark-mode, IDE-inspired aesthetic (Linear / Notion style), **VocabNotebook** helps engineers, researchers, and language learners systematically organize words, word families (parts of speech), collocations, and tags—with zero-latency client-side search and virtualized rendering for 10,000+ entries.

---

## ✨ Features

- **🎨 Minimalist Developer UI**: Clean, high-density dark mode with explicit color-coded parts of speech:
  - 🔵 **Noun** (Blue)
  - 🔴 **Verb** (Red)
  - 🟢 **Adjective** (Green)
  - 🟣 **Adverb** (Purple)
- **⚡ High-Performance Virtualization**: Powered by `@tanstack/react-virtual` to render only visible DOM nodes, ensuring smooth 60 FPS scrolling even with 10,000+ entries.
- **☁️ Cloud Sync via Supabase**: Full CRUD operations backed by a PostgreSQL database in the cloud.
- **🔤 Automatic Alphabetical Ordering**: Items and Word Groups are ordered strictly A–Z (`word_group ASC`).
- **⌨️ Keyboard Hotkeys**:
  - `⌘K` / `Ctrl+K`: Jump directly to global search.
  - `N`: Open the "Add New Word" modal.
- **🏷️ Tag Filtering & Collapsible Groups**: Group words by semantic categories (e.g., *Mystery & Ambiguity*) with instant tag filtering (`#writing`, `#formal`).
- **🖥️ Wide-Screen & Responsive Layout**: Responsive container expanding up to `1800px` to leverage ultra-wide monitor real estate.
- **✨ Markdown Collocations**: Supports bold syntax (`**key word**`) for key phrase emphasis.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **Database**: Supabase (PostgreSQL)
- **Virtualization**: `@tanstack/react-virtual`

---