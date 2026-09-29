# Fumadocs configuration — what this site uses, and what it does not

Written against Fumadocs 16.15 (`fumadocs-core` 16.15.17, `fumadocs-ui` = `@fumadocs/base-ui`
16.15.17, `fumadocs-mdx` 15.4.5, Next.js 16.3) from <https://fumadocs.dev>. Every option below is
real in these versions; a version bump can move them, so check the linked page before trusting a
line that surprises you.

The constraint that decides most of it: **no backend**. `next build` emits static files into `out/`
and GitHub Pages serves them. Anything needing a Node.js server at request time is out, whatever
else recommends it.

---

## 1. What the site is made of

| File | What it decides |
|---|---|
| `next.config.mjs` | Static export, base path, images. |
| `lib/source.ts` | Where content lives, how it is compiled, the page tree, the llms.txt output. |
| `lib/shared.ts` | App name, routes, the GitHub repo behind "edit this page", the site URL. |
| `lib/layout.shared.tsx` | Options shared by every layout: nav title, GitHub link. |
| `app/layout.tsx` | Root HTML, font, `metadataBase`, title template, the provider. |
| `app/docs/layout.tsx` | The docs shell: sidebar, tabs, nav. |
| `app/docs/[[...slug]]/page.tsx` | One page: title, description, TOC, body, and `generateStaticParams`. |
| `app/(home)/` | Everything outside `/docs`, with no sidebar. |
| `app/api/search/route.ts` | The search index, emitted as a static file. |
| `app/og/docs/[...slug]/route.tsx` | One OG image per page, rendered at build time. |
| `app/llms.txt`, `app/llms-full.txt`, `app/llms.mdx/...` | The site as Markdown, for agents. |
| `components/mdx.tsx` | Which components MDX may use without an import. |
| `components/search.tsx` | The search dialog, reading the static index. |
| `components/provider.tsx` | Theme, search and framework context. |
| `content/docs/` | The documentation itself. |
| `.github/workflows/deploy.yml` | Build and publish to GitHub Pages. |

No `source.config.ts`: this template configures content inline through the
`fumadocs-mdx/macro` version of `defineDocs` in `lib/source.ts`. Docs pages that tell you to edit
`source.config.ts` are describing the other setup — the options are the same, the file is not.

---

## 2. The decisions, in one table

| Surface | Now | Why |
|---|---|---|
| Output | `output: 'export'` | GitHub Pages serves files, not a server. |
| Base path | `basePath` from `NEXT_PUBLIC_BASE_PATH` | The site lives at `/FlashDocs`, so every link and asset needs the prefix. |
| Trailing slash | off | GitHub Pages resolves `/docs` to `docs.html` by itself, and `trailingSlash: true` would turn the search index into a directory request. |
| Images | `unoptimized: true` | Static export has no optimizer; a Markdown image would fail the build without it. |
| Search | Orama, static index | Runs in the browser off one JSON file. No service, no key. |
| Layout | `layouts/docs` (sidebar) | The default. `notebook` is the alternative, one import away. |
| Theme | `neutral` preset | Twelve presets exist; this one is closest to plain. |
| Sidebar sections | two root folders (`framework`, `extensions`) | A dropdown per section instead of one endless tree. |
| Icons | off | Needs the `lucideIconsPlugin` in the loader; add it when a sidebar icon is actually wanted. |
| Last updated | off | `lastModified: true` reads git times; it needs a full-history checkout in CI. |
| i18n, versioning | off | One language, one version. |
| AI chat, Orama Cloud, Algolia | out | All need a backend or a paid service. |
| OG images, llms.txt | on, as the template ships them | Both are pre-rendered at build time, so they cost nothing at runtime. |

---

## 3. Every configuration surface

### 3.1 `next.config.mjs`

Static export accepts, beyond what we set: `trailingSlash`, `skipTrailingSlashRedirect`,
`distDir`, and `images.loader`/`images.loaderFile` for a third-party image CDN instead of
`unoptimized`. <https://fumadocs.dev/docs/deploying/static>,
<https://nextjs.org/docs/app/guides/static-exports>

`createMDX()` from `fumadocs-mdx/next` wraps the config and wires the content pipeline; it takes a
`configPath` when the content config is not where it expects.

### 3.2 Content: `defineDocs` (macro)

```ts
defineDocs({
  dir: 'content/docs',
  docs: { /* see below */ },
  meta: { files, schema },
})
```

`docs` accepts:

| Option | What it does |
|---|---|
| `files` | Glob list, to take less than the whole directory. |
| `schema` | Frontmatter schema (any Standard Schema: Zod, Valibot, Arktype). Defaults to `pageSchema`. |
| `async` | Compile a page when it is requested instead of all of them up front. Faster dev on big sites; each page then loads through `load()`. |
| `compiler` | `'mdx'` (default) or `'satteri'`, a faster compiler with a smaller feature set. |
| `mdxOptions` | Raw processor options, or a function of the build environment. Wrap with `applyMdxPreset` from `fumadocs-mdx/config` or you lose the built-in plugins. |
| `satteriOptions` | Options for that compiler. |
| `postprocess` | `includeProcessedMarkdown: true` (we use it — the llms routes need the Markdown back). |
| `lastModified` | Reads each file's git commit time into the page data. Needs `fetch-depth: 0` in CI. |

`mdxOptions` is also where the built-in plugins are tuned: `rehypeCodeOptions` (Shiki themes,
languages, transformers), `remarkImageOptions` (`placeholder: 'blur'`, external image handling),
`remarkHeadingOptions` (slugs, anchors). Extra plugins go in `remarkPlugins`/`rehypePlugins`, and
those accept a function `(v) => [...]` when order matters.
<https://fumadocs.dev/docs/mdx/global>, <https://fumadocs.dev/docs/mdx/mdx>

Plugins that ship with `fumadocs-core/mdx-plugins`, on or available: `rehype-code`, `rehype-toc`,
`remark-gfm`, `remark-heading`, `remark-image`, `remark-structure` (what search indexes),
`remark-steps`, `remark-code-tab`, `remark-admonition` and `remark-directive-admonition` (`:::note`
blocks, for Markdown written elsewhere), `remark-npm` (a package-manager tab group — useless for
Maven), `remark-mdx-mermaid`, `remark-mdx-files`, `remark-block-id`, `remark-feedback-block`,
`remark-llms`, `transformer-icon`.

### 3.3 The page tree: `loader()`

```ts
loader({ baseUrl: '/docs', source: docs.toFumadocsSource(), plugins: [] })
```

`baseUrl` is the URL prefix, `source` the content, `plugins` the tree transforms. Also available:
`url` (a custom URL function), `slugs`, `pageTree` (transformers, e.g. to sort or inject nodes),
`i18n`. Several sources can be merged into one tree by passing an object instead — that is how a
second content root (a blog, a changelog) joins the same site.
<https://fumadocs.dev/docs/headless/source-api>

Loader plugins that ship with it:

- `lucideIconsPlugin({ defaultIcon })` — turns `icon: Rocket` in frontmatter and `meta.json` into a
  rendered Lucide icon. Off here.
- `slugsPlugin` — a custom slug function per file.
- `statusBadgesPlugin({ renderBadge })` — reads `status: new | beta | deprecated | experimental`
  from frontmatter and shows a badge in the sidebar. The obvious fit for marking an extension
  experimental; off until there is something to mark.

`llms(source, { renderPage })` builds the agent-facing Markdown; we render title, URL and processed
body per page.

### 3.4 Page conventions

Frontmatter (`pageSchema`): `title`, `description`, `icon`, `full` (page fills the width, TOC
becomes a popover), plus anything a custom schema adds.

`meta.json` in a folder: `title`, `description`, `icon`, `root` (the folder becomes a sidebar
section — everything outside it disappears while it is open), `defaultOpen`, and `pages`, whose
syntax is the whole ordering language:

```json
{
  "pages": [
    "index",                              // a page, in this position
    "---Extensions---",                   // a separator
    "...folder",                          // that folder's children, inlined
    "...",                                // everything not named above
    "!draft",                             // excluded
    "[Source](https://example.com)",       // an external link
    "[Rocket][Source](https://example.com)" // an external link with an icon
  ]
}
```

A URL may appear only once in the whole tree. <https://fumadocs.dev/docs/page-conventions>

Root folders nest: a folder marked `root: "version"` above two `root: true` folders gives a version
dropdown and a section dropdown on the same page — the supported way to document more than one
release. <https://fumadocs.dev/docs/versioning>

### 3.5 Layout

`baseOptions()` in `lib/layout.shared.tsx` is shared by the docs and home layouts:
`nav` (`title` — JSX allowed, `url`, `mode: 'auto' | 'top'`, `transparentMode: 'none' | 'top' |
'always'`), `githubUrl`, `links` (typed `main`, `icon`, `menu`, `button`, `custom` — `custom` takes
any component, which is how `GithubInfo` gets a star count into the sidebar), `themeSwitch`,
`searchToggle`, `i18n`, `disableThemeSwitch`.

`DocsLayout` adds: `tree` (required), `tabs` (from root folders, or an explicit array of
`{title, description, url, urls}`, or `false`), `sidebar` (`banner`, `footer`, `collapsible`,
`defaultOpenLevel`, `prefetch`, `tabs`, `components`), `containerProps`.

`fumadocs-ui/layouts/notebook` is the same layout with the sidebar attached to the navbar; it adds
`tabMode: 'sidebar' | 'navbar'`. Switching means changing the import in `app/docs/layout.tsx` **and**
in `page.tsx` (`layouts/notebook/page` instead of `layouts/docs/page`).
<https://fumadocs.dev/docs/ui/layouts/docs>, <https://fumadocs.dev/docs/ui/layouts/notebook>

### 3.6 The page itself

`DocsPage` props: `toc`, `full`, `tableOfContent` and `tableOfContentPopover` (each with
`style: 'clerk'` for the animated variant, `single`, `header`, `footer`, `enabled`), `breadcrumb`
(`includeRoot`, `includeSeparator`, `includePage`), `footer` (previous/next, `items`), `lastUpdate`,
`article`, `container`. The template also renders `MarkdownCopyButton` and `ViewOptionsPopover`
(copy as Markdown, open in an LLM, view on GitHub) — both read `lib/shared.ts`, which is why
`gitConfig` there must point at this repo. <https://fumadocs.dev/docs/ui/layouts/page>

### 3.7 Theme

One CSS import decides the palette: `neutral`, `black`, `vitepress`, `dusk`, `catppuccin`, `ocean`,
`purple`, `solar`, `emerald`, `ruby`, `aspen`. It goes before `fumadocs-ui/css/preset.css` in
`app/global.css`. Below that, any `--color-fd-*` variable can be redefined per mode, and
`--fd-layout-width` sets the maximum width. <https://fumadocs.dev/docs/ui/theme>

### 3.8 Search

Five solutions exist: Orama (local), Orama Cloud, Algolia, Typesense, Mixedbread. Only local Orama
works without a backend, in the shape we use: `createFromSource(source, { language })` exported as
`staticGET` with `revalidate = false`, so the index becomes a file, and `staticClient` in the dialog
instead of `fetchClient`. The client option `from` must carry the base path — a bare `/api/search`
would miss it on a subpath host.

Server-side options worth knowing: `language` (Orama's stemmers), `components`/`search` for custom
tokenizers, `tag` for filtering a section (how a versioned site keeps results apart), and
`buildIndex` for indexing something other than pages. The published caveat: the client downloads
the whole index, which stops scaling somewhere in the thousands of pages — at which point the
answer is a hosted search, i.e. a backend. <https://fumadocs.dev/docs/headless/search/orama>

### 3.9 Markdown and components

Code blocks: `title="..."`, `tab="Maven"` with `tab-group=` to group blocks across a page,
`lineNumbers`, `// [!code highlight]`, `// [!code word:x]`, `// [!code ++]`/`--` diffs, and
`twoslash` (TypeScript only — it type-checks the snippet, so it does nothing for Java). Languages
come from Shiki: `java`, `xml`, `kotlin`, `groovy`, `properties`, `yaml`, `json`, `http`, `bash` are
all built in. A custom Shiki build (`createShikiFactory`) is only needed for a language Shiki does
not know. <https://fumadocs.dev/docs/markdown>

Components in `fumadocs-ui`, each an import away and registered in `components/mdx.tsx` once:
`Callout`, `Card`/`Cards`, `Tabs`/`Tab`, `Steps`/`Step`, `TypeTable` (a property table — the closest
thing to an API reference for a configuration record), `Accordion`/`Accordions`, `Files`/`Folder`/
`File`, `Banner`, `ImageZoom`, `InlineTOC`, `GithubInfo`, `DynamicCodeBlock`, `CodeBlock`. `Cards`
and `Callout` are already available without an import through `defaultMdxComponents`.

`<include>./other.mdx</include>` (or `::include[./other.mdx]` in plain Markdown) inlines another
file — the way to write one snippet and show it in several extension pages.

Mermaid is **not** in this build of `fumadocs-ui`: it is a component you install
(`npx @fumadocs/cli add mermaid`) plus the `mermaid` dependency. It renders client-side, so it
survives static export. <https://fumadocs.dev/docs/markdown/mermaid>

`npx @fumadocs/cli add <name>` also copies a component's source into the repo when it has to be
modified, and `add slots/...` does the same for layout internals (the page footer, the sidebar).

---

## 4. What static export forbids

No middleware, no server actions, no route handlers answering at request time, no ISR or
`revalidate`, no image optimizer, no `cookies()`/`headers()`, no draft mode. Every route handler
must be static: `revalidate = false` plus `generateStaticParams` for dynamic segments — the pattern
`app/api/search`, `app/og` and `app/llms.mdx` already follow. Fumadocs features that assume a
server are therefore out: AI chat, feedback collection, any hosted search, on-demand OG images.

---

## 5. Left out, and when to add it

| Thing | Add it when |
|---|---|
| `lucideIconsPlugin` | A sidebar icon per section is wanted. One line in `loader({ plugins })` plus `icon:` in frontmatter. |
| `statusBadgesPlugin` | An extension needs to read "experimental" or "deprecated" in the sidebar. |
| `lastModified: true` | A "last updated" line is wanted. Also set `fetch-depth: 0` in the workflow. |
| Mermaid | A diagram beats a paragraph — the app model, the request path. |
| `TypeTable` | The first configuration record that deserves a real table. |
| Versioning (`root: "version"`) | Flash 6 exists and 5 must stay readable. |
| Hosted search | The index outgrows the browser — thousands of pages, not tens. |
| Custom domain | Drop `basePath`, add a `CNAME`; the workflow needs no change, `configure-pages` reports the new base path itself. |
| OpenAPI integration | Only if an extension's HTTP surface is worth generating from a spec; Flash generates its own document, so this is a bridge, not a need. |
