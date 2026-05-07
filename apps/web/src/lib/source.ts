import { docs } from 'collections/server';
import type * as PageTree from 'fumadocs-core/page-tree';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { slugsPlugin } from 'fumadocs-core/source/slugs';
import { statusBadgesPlugin } from 'fumadocs-core/source/status-badges';
import { iconRenderer } from './client/icons';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin(), slugsPlugin(), statusBadgesPlugin()],
  icon: iconRenderer,
});

type CollectionDocsPage = InferPageType<typeof source>;

type ResolvedDocsPage = { kind: 'collection'; page: CollectionDocsPage };

type DocsTree = ReturnType<typeof source.getPageTree>;

const normalizeTreeNode = (node: PageTree.Node): PageTree.Node => {
  if (node.type !== 'folder') {
    return node;
  }

  const normalizedChildren = node.children.map(normalizeTreeNode);

  if (normalizedChildren.length === 0 && node.index) {
    return {
      ...node,
      children: normalizedChildren,
      collapsible: false,
    };
  }

  return {
    ...node,
    children: normalizedChildren,
  };
};

const normalizePageTree = (tree: DocsTree): DocsTree => {
  return {
    ...tree,
    children: tree.children.map(normalizeTreeNode),
  };
};

export async function resolveDocsPage(
  slug?: string[]
): Promise<ResolvedDocsPage | null> {
  const page = source.getPage(slug);

  if (!page) {
    return null;
  }

  return {
    kind: 'collection',
    page,
  };
}

export async function generateDocsStaticParams(): Promise<
  Array<{ slug: string[] }>
> {
  return source.generateParams().map((params) => ({
    slug: params.slug,
  }));
}

export async function getAllDocsPages(): Promise<ResolvedDocsPage[]> {
  return source.getPages().map((page) => ({
    kind: 'collection',
    page,
  }));
}

export async function getMergedPageTree(): Promise<DocsTree> {
  return normalizePageTree(source.getPageTree());
}

export async function getSearchIndexes() {
  const pages = source.getPages();

  return Promise.all(
    pages.map(async (page) => ({
      title: page.data.title,
      description: page.data.description ?? '',
      breadcrumbs: page.slugs,
      content: await page.data.getText('processed'),
      url: page.url,
      keywords: page.slugs.join(' '),
    }))
  );
}

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  };
}

export const getExternalPageImage = getPageImage;
export const getReadmePageImage = getPageImage;

export function getPageMarkdownUrl(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  };
}

export const getExternalPageMarkdownUrl = getPageMarkdownUrl;
export const getReadmePageMarkdownUrl = getPageMarkdownUrl;

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}

export const getExternalLLMText = getLLMText;
export const getReadmeLLMText = getLLMText;

export type { CollectionDocsPage, ResolvedDocsPage };
export type RepositoryExternalPage = CollectionDocsPage;
