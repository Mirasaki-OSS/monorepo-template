import { notFound } from 'next/navigation';

import { getLLMText, getPageMarkdownUrl, source } from '@/lib/source';

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>
) {
  const { slug } = await params;
  const page = source.getPage(slug?.slice(0, -1));
  if (!page) notFound();

  const markdown = await getLLMText(page);

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}

export async function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: getPageMarkdownUrl(page).segments,
  }));
}
