# Project Conventions

## URL Typing (Conceptual)

To ensure the project is portable across root domains, sub-directories, and lightweight servers, we conceptually "type" our URLs and paths based on what they are resolving relative to:

| URL Type                               | Relative To               | Example / Implementation                                 |
| :------------------------------------- | :------------------------ | :------------------------------------------------------- |
| **Assets** (Images, CSS from JS)       | **Source file**           | `new URL("./style.css", import.meta.url)`                |
| **Imports** (JS Modules)               | **Source file**           | `import "../share-url/share-url.js"`                     |
| **Fetch endpoints** (Data, API)        | **Source file**           | `fetch(new URL("../../api/v1/events", import.meta.url))` |
| **Navigation** (`<a>` href, redirects) | **Materialized document** | `href="/lugar/merlo/"`                                   |
| **Canonical URLs** (SEO, OG tags)      | **Materialized document** | `https://eventos.trasla.com.ar/lugar/merlo/`             |

By keeping component assets, imports, and data fetches strictly relative to the source file, components become portable and directory-structure agnostic.
