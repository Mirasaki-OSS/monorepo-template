import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/notebook/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { InlineTOC } from '@/components/mdx/inline-toc';
import { Footer } from '@/layouts/docs/page/slots/footer';
import { clientEnv } from '@/lib/client/env';
import { gitConfig, githubUrl } from '@/lib/github';
import {
  generateDocsStaticParams,
  getPageImage,
  getPageMarkdownUrl,
  resolveDocsPage,
  source,
} from '@/lib/source';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const resolvedPage = await resolveDocsPage(params.slug);
  if (!resolvedPage) notFound();

  const page = resolvedPage.page;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const githubPath = `apps/web/content/docs/${page.path}`;

  const MDX = page.data.body;
  const content = (
    <MDX
      components={getMDXComponents({
        // this allows you to link to other pages with relative file paths
        a: createRelativeLink(source, page),
      })}
    />
  );

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{
        style: 'clerk',
      }}
      footer={{
        enabled: true,
        component: (
          <Footer lastModified={page.data.lastModified}>
            <div className="flex flex-col items-center gap-4 mt-2">
              <p className="text-sm text-muted-foreground">
                {`© ${new Date().getFullYear()} ${clientEnv.NEXT_PUBLIC_COPYRIGHT_HOLDER}. All rights reserved.`}
              </p>
            </div>
          </Footer>
        ),
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={githubUrl(`/blob/${gitConfig.branch}/${githubPath}`)}
        />
      </div>
      {page.data.renderInlineTOC ? (
        <InlineTOC items={page.data.toc}>Table of Contents</InlineTOC>
      ) : null}
      <DocsBody>{content}</DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return generateDocsStaticParams();
}

export async function generateMetadata(
  props: PageProps<'/docs/[[...slug]]'>
): Promise<Metadata> {
  const params = await props.params;
  const resolvedPage = await resolveDocsPage(params.slug);
  if (!resolvedPage) notFound();

  const page = resolvedPage.page;
  const image = getPageImage(page).url;

  return {
    title: page.data.title,
    description: page.data.description,
    metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
    openGraph: {
      images: image,
    },
  };
}
