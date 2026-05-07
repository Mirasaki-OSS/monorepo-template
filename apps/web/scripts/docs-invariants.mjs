import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const APP_ROOT = process.cwd();
const REPO_ROOT = path.resolve(APP_ROOT, '..', '..');
const DOCS_ROOT = path.join(APP_ROOT, 'content', 'docs');
const MANIFEST_PATH = path.join(
  APP_ROOT,
  '.source',
  'docs-route-manifest.json'
);
const DOC_FILE_EXTENSIONS = new Set(['.md', '.mdx']);

const slugKey = (segments) => segments.join('/');

const normalizeSlugSegment = (segment) => {
  return segment
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
};

const toSlugSegmentsFromDocsFile = (relativePath) => {
  const normalized = relativePath.replace(/\\/g, '/').replace(/\.[^.]+$/u, '');
  const parts = normalized.split('/').map(normalizeSlugSegment).filter(Boolean);
  if (parts[parts.length - 1] === 'index') {
    return parts.slice(0, -1);
  }

  return parts;
};

const findMdxFiles = async (dir, prefix = '') => {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const nested = await findMdxFiles(full, relative);
      files.push(...nested);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (entry.isFile() && DOC_FILE_EXTENSIONS.has(extension)) {
      files.push(relative);
    }
  }

  return files;
};

const checkReadable = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const readJsonIfExists = async (filePath) => {
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
};

const getCanonicalRoutes = async () => {
  const routes = [];
  const missing = [];

  const rootReadmePath = path.join(REPO_ROOT, 'README.md');
  if (!(await checkReadable(rootReadmePath))) {
    missing.push({
      slug: [],
      expectedPath: path.relative(REPO_ROOT, rootReadmePath),
    });
  } else {
    routes.push({
      slug: [],
      sourcePath: path.relative(REPO_ROOT, rootReadmePath),
      kind: 'readme',
    });
  }

  const sections = [
    { dir: 'apps', prefix: 'apps' },
    { dir: 'packages', prefix: 'packages' },
    { dir: 'vendor', prefix: 'vendor' },
  ];

  for (const section of sections) {
    const sectionDir = path.join(REPO_ROOT, section.dir);
    let entries = [];
    try {
      entries = await readdir(sectionDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const pkgDir = path.join(sectionDir, entry.name);
      const packageJsonPath = path.join(pkgDir, 'package.json');
      const readmePath = path.join(pkgDir, 'README.md');
      const docsDir = path.join(pkgDir, 'docs');
      const docsMetaPath = path.join(docsDir, 'meta.json');
      const hasPackageJson = await checkReadable(packageJsonPath);

      if (!hasPackageJson) {
        continue;
      }

      const slug = [section.prefix, entry.name];
      if (!(await checkReadable(readmePath))) {
        missing.push({
          slug,
          expectedPath: path.relative(REPO_ROOT, readmePath),
          reason: 'package/vendor landing page requires README.md',
        });
        continue;
      }

      routes.push({
        slug,
        sourcePath: path.relative(REPO_ROOT, readmePath),
        kind: 'readme',
      });

      const docsFiles = await findMdxFiles(docsDir);

      if (docsFiles.length > 0) {
        const docsMeta = (await readJsonIfExists(docsMetaPath)) ?? {};

        for (const relativeDocPath of docsFiles) {
          const routeSlug = [
            ...slug,
            ...toSlugSegmentsFromDocsFile(relativeDocPath),
          ];
          if (slugKey(routeSlug) === slugKey(slug)) {
            continue;
          }

          routes.push({
            slug: routeSlug,
            sourcePath: path
              .relative(REPO_ROOT, path.join(docsDir, relativeDocPath))
              .replace(/\\/g, '/'),
            kind: 'docs-folder',
          });
        }

        if (docsMeta && typeof docsMeta !== 'object') {
          missing.push({
            slug,
            expectedPath: path.relative(REPO_ROOT, docsMetaPath),
            reason: 'docs/meta.json must be a JSON object when present',
          });
        }
      }
    }
  }

  return { routes, missing };
};

const getDocsOnlyRoutes = async () => {
  const files = await findMdxFiles(DOCS_ROOT);

  return files
    .filter((relativePath) => {
      const normalized = relativePath.replace(/\\/g, '/');
      // Exclude materialized routes: apps/, packages/, vendor/, and root index
      return !(
        normalized.startsWith('apps/') ||
        normalized.startsWith('packages/') ||
        normalized.startsWith('vendor/') ||
        normalized === 'index.mdx'
      );
    })
    .map((relativePath) => ({
      slug: toSlugSegmentsFromDocsFile(relativePath),
      sourcePath: path
        .join('apps/web/content/docs', relativePath)
        .replace(/\\/g, '/'),
      kind: 'docs-only',
    }));
};

const main = async () => {
  const { routes: canonicalRoutes, missing } = await getCanonicalRoutes();
  const docsOnlyRoutes = await getDocsOnlyRoutes();

  const canonicalSet = new Set(
    canonicalRoutes.map((route) => slugKey(route.slug))
  );
  const docsSet = new Set(docsOnlyRoutes.map((route) => slugKey(route.slug)));
  const collisions = [];

  for (const key of canonicalSet) {
    if (docsSet.has(key)) {
      collisions.push(key);
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    repoRoot: REPO_ROOT,
    summary: {
      canonicalRoutes: canonicalRoutes.length,
      docsOnlyRoutes: docsOnlyRoutes.length,
      collisions: collisions.length,
      missingCanonicalPages: missing.length,
    },
    canonicalRoutes,
    docsOnlyRoutes,
    collisions,
    missingCanonicalPages: missing,
  };

  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

  const errors = [];
  if (missing.length > 0) {
    errors.push(
      ...missing.map(
        (item) =>
          `Missing canonical docs source for /docs/${item.slug.join('/')} -> ${item.expectedPath} (${item.reason})`
      )
    );
  }

  if (collisions.length > 0) {
    errors.push(
      ...collisions.map(
        (slug) =>
          `Slug collision between docs-only and canonical README routes: /docs/${slug}`
      )
    );
  }

  if (errors.length > 0) {
    console.error('Docs invariants failed:\n');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Docs invariants passed.');
  console.log(`Manifest written to ${path.relative(REPO_ROOT, MANIFEST_PATH)}`);
};

await main();
