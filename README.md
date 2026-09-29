# FlashDocs

Documentation for [Flash](https://git.pixel-services.com/Relism/Flash5), a Java web framework.
Built with [Fumadocs](https://fumadocs.dev) and published as a static site at
<https://relism.github.io/FlashDocs>.

## Working on it

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm build   # static site into out/
pnpm start   # serve out/
```

Content lives in `content/docs`: `framework/` for the core, `extensions/` for one folder per
extension. `FUMADOCS.md` records which Fumadocs options this site uses, which it leaves out, and
what static hosting forbids — read it before reaching for a feature.

Every push to `main` builds and deploys through `.github/workflows/deploy.yml`.
