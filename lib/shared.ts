import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'Flash';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

// The repository holding this documentation: what "edit this page" and the nav icon point at.
export const gitConfig = {
  user: 'Relism',
  repo: 'FlashDocs',
  branch: 'main',
};

// Absolute URL of the deployed site, base path included: OG image URLs are resolved against it
// and Next.js does not prefix them itself. The deploy workflow fills it from
// `actions/configure-pages`.
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
