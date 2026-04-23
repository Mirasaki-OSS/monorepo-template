import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

import indexFilePlugin from 'fumadocs-mdx/plugins/index-file';
import jsonSchemaPlugin from 'fumadocs-mdx/plugins/json-schema';
import lastModifiedPlugin from 'fumadocs-mdx/plugins/last-modified';

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
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
    // MDX options
  },
});
