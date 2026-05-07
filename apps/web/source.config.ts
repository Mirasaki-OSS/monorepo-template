import { remarkMdxFiles } from 'fumadocs-core/mdx-plugins/remark-mdx-files';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import indexFilePlugin from 'fumadocs-mdx/plugins/index-file';
import jsonSchemaPlugin from 'fumadocs-mdx/plugins/json-schema';
import lastModifiedPlugin from 'fumadocs-mdx/plugins/last-modified';
import rehypeKatex from 'rehype-katex';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkGithubBlockquoteAlert from 'remark-github-blockquote-alert';
import remarkMath from 'remark-math';
import { z } from 'zod';

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema.extend({
      description: pageSchema.shape.description.nonoptional(),
      icon: pageSchema.shape.icon.optional(),
      full: pageSchema.shape.full.optional().default(false),
      renderInlineTOC: z.boolean(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  plugins: [lastModifiedPlugin(), jsonSchemaPlugin(), indexFilePlugin()],
  mdxOptions: {
    remarkPlugins: [
      remarkDirective,
      remarkMdxFiles,
      remarkGfm,
      remarkGithubBlockquoteAlert,
      remarkMath,
    ],
    rehypePlugins: (v) => [rehypeKatex, ...v],
  },
});
