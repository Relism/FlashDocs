import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  // No Node.js server: `next build` emits a static site into `out/`.
  output: 'export',
  reactStrictMode: true,

  // GitHub Pages serves the site under /<repo>, so every link and asset needs that prefix.
  // The deploy workflow fills it from `actions/configure-pages`; empty locally, where the
  // dev server and `pnpm start` serve from the root.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,

  // Static export has no image optimizer: Markdown images are served as they are.
  images: { unoptimized: true },
};

export default withMDX(config);
