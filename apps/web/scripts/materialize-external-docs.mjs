import { execSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const APP_ROOT = process.cwd();
const REPO_ROOT = path.resolve(APP_ROOT, '..', '..');
const DOCS_ROOT = path.join(APP_ROOT, 'content', 'docs');
const MANIFEST_PATH = path.join(APP_ROOT, '.source', 'materialized-docs.json');

const DOC_EXTENSIONS = new Set(['.md', '.mdx']);

const getGitRemoteUrl = () => {
  try {
    return execSync('git config --get remote.origin.url', {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
};

const normalizeGitHubRepoUrl = (remoteUrl) => {
  if (!remoteUrl) {
    return null;
  }

  const sshMatch = remoteUrl.match(/^git@github\.com:(.+?)(?:\.git)?$/u);
  if (sshMatch?.[1]) {
    return `https://github.com/${sshMatch[1]}`;
  }

  const httpsMatch = remoteUrl.match(
    /^https:\/\/github\.com\/(.+?)(?:\.git)?$/u
  );
  if (httpsMatch?.[1]) {
    return `https://github.com/${httpsMatch[1]}`;
  }

  return null;
};

const getGitBranch = () => {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return 'main';
  }
};

const GITHUB_REPO_URL = normalizeGitHubRepoUrl(getGitRemoteUrl());
const GITHUB_BRANCH = process.env.DOCS_GITHUB_BRANCH || getGitBranch();

const toKebabCase = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/u, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'index';

const prettifyTitle = (value) => {
  const stripped = value
    .replace(/\.[^.]+$/u, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  if (stripped.length === 0) {
    return 'Documentation';
  }

  return stripped
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
};

const extractFrontmatterAndBody = (
  content,
  fallbackTitle,
  fallbackDescription = ''
) => {
  const lines = content.split('\n');
  const mutableLines = [...lines];

  let extractedTitle;
  let extractedDescription;

  let titleLineIndex = -1;
  let isInCodeFence = false;
  for (let index = 0; index < mutableLines.length; index += 1) {
    const line = mutableLines[index] ?? '';
    if (/^(?:```|~~~)/u.test(line.trim())) {
      isInCodeFence = !isInCodeFence;
      continue;
    }

    if (isInCodeFence) {
      continue;
    }

    if (/^#\s+(.+)$/u.test(line)) {
      titleLineIndex = index;
      break;
    }
  }

  if (titleLineIndex >= 0) {
    const headingMatch = mutableLines[titleLineIndex]?.match(/^#\s+(.+)$/u);
    extractedTitle = headingMatch?.[1]?.trim();

    // Remove extracted title heading from body content.
    mutableLines.splice(titleLineIndex, 1);
    while (mutableLines[titleLineIndex] === '') {
      mutableLines.splice(titleLineIndex, 1);
    }
  }

  isInCodeFence = false;
  for (let index = 0; index < mutableLines.length; index += 1) {
    const trimmed = mutableLines[index]?.trim() ?? '';

    if (/^(?:```|~~~)/u.test(trimmed)) {
      isInCodeFence = !isInCodeFence;
      continue;
    }

    if (isInCodeFence) {
      continue;
    }

    if (trimmed.length === 0) {
      continue;
    }

    if (trimmed.startsWith('#')) {
      continue;
    }

    if (trimmed.startsWith('![') || trimmed.startsWith('<')) {
      continue;
    }

    if (/^\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)$/u.test(trimmed)) {
      continue;
    }

    if (/^(?:[-*+]\s+|\d+\.\s+|>\s*|\|.*\||:?-+:?\s*\|)/u.test(trimmed)) {
      continue;
    }

    if (/^[\p{L}\p{N}\s_-]{1,60}:$/u.test(trimmed)) {
      continue;
    }

    extractedDescription = normalizeDescriptionToPlainText(trimmed);
    // Remove extracted description from body content.
    mutableLines.splice(index, 1);
    break;
  }

  const body = mutableLines.join('\n').replace(/^\n+/u, '');

  return {
    title: extractedTitle || fallbackTitle,
    description: extractedDescription || fallbackDescription,
    body,
  };
};

const stripLeadTitleAndDescription = (content) => {
  const mutableLines = content.split('\n');

  const titleLineIndex = mutableLines.findIndex((line) =>
    /^#\s+(.+)$/u.test(line)
  );

  if (titleLineIndex >= 0) {
    mutableLines.splice(titleLineIndex, 1);
    while (mutableLines[titleLineIndex] === '') {
      mutableLines.splice(titleLineIndex, 1);
    }
  }

  let descriptionStart = -1;
  let descriptionEnd = -1;

  for (let index = 0; index < mutableLines.length; index += 1) {
    const trimmed = mutableLines[index]?.trim() ?? '';
    if (trimmed.length === 0) {
      continue;
    }

    if (
      /^\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)$/u.test(trimmed) ||
      trimmed.startsWith('![')
    ) {
      continue;
    }

    if (
      trimmed.startsWith('#') ||
      trimmed.startsWith('>') ||
      /^(?:[-*+]\s+|\d+\.\s+|\|.*\||:?-+:?\s*\|)/u.test(trimmed) ||
      /^(?:```|~~~)/u.test(trimmed)
    ) {
      continue;
    }

    descriptionStart = index;
    descriptionEnd = index + 1;
    while (descriptionEnd < mutableLines.length) {
      const nextTrimmed = mutableLines[descriptionEnd]?.trim() ?? '';
      if (nextTrimmed.length === 0) {
        break;
      }
      descriptionEnd += 1;
    }
    break;
  }

  if (descriptionStart >= 0 && descriptionEnd > descriptionStart) {
    mutableLines.splice(descriptionStart, descriptionEnd - descriptionStart);
  }

  return mutableLines.join('\n').replace(/^\n+/u, '');
};

const quoteYamlString = (value) => {
  return JSON.stringify(value);
};

const normalizeDescriptionToPlainText = (value) => {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^\w])__([^_]+)__($|[^\w])/g, '$1$2$3')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/(^|[^\w])_([^_]+)_($|[^\w])/g, '$1$2$3')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeCodeFences = (content) => {
  return content.replace(/^```env\s*$/gim, '```bash');
};

const convertHtmlCommentsToMdx = (content) => {
  // Convert HTML comments to MDX comments
  // <!-- ... --> becomes {/* ... */}
  return content.replace(/<!--\s*([\s\S]*?)\s*-->/g, (_match, comment) => {
    return `{/* ${comment.trim()} */}`;
  });
};

const isRelativeMarkdownTarget = (target) => {
  return !/^(?:[a-z][a-z\d+.-]*:|\/|#)/iu.test(target);
};

const toGitHubBlobUrl = (target, sourceFilePath) => {
  if (!GITHUB_REPO_URL || !isRelativeMarkdownTarget(target)) {
    return target;
  }

  const [targetWithoutHash, hash = ''] = target.split('#');
  const [targetPath, search = ''] = targetWithoutHash.split('?');
  const resolvedPath = path.resolve(path.dirname(sourceFilePath), targetPath);
  const relativePath = path
    .relative(REPO_ROOT, resolvedPath)
    .replace(/\\/g, '/');

  if (relativePath.startsWith('..')) {
    return target;
  }

  const suffix = `${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
  return `${GITHUB_REPO_URL}/blob/${GITHUB_BRANCH}/${relativePath}${suffix}`;
};

const rewriteRelativeMarkdownLinks = (content, sourceFilePath) => {
  let isInFence = false;

  return content
    .split('\n')
    .map((line) => {
      if (/^```/u.test(line.trim())) {
        isInFence = !isInFence;
        return line;
      }

      if (isInFence) {
        return line;
      }

      return line.replace(
        /(?<!!)\[([^\]]+)\]\(([^)\s]+)(\s+"[^"]*")?\)/gu,
        (_match, label, target, title = '') => {
          return `[${label}](${toGitHubBlobUrl(target, sourceFilePath)}${title})`;
        }
      );
    })
    .join('\n');
};

const getIndexFrontmatter = async (
  docsDir,
  fileName = 'index-frontmatter.yaml'
) => {
  const indexFrontmatterPath = path.join(docsDir, fileName);
  try {
    const content = await readFile(indexFrontmatterPath, 'utf8');
    // Remove leading/trailing YAML markers if present
    let cleaned = content.trim();
    if (cleaned.startsWith('---')) {
      cleaned = cleaned.slice(3).trim();
    }
    if (cleaned.endsWith('---')) {
      cleaned = cleaned.slice(0, -3).trim();
    }
    return cleaned;
  } catch {
    return null;
  }
};

const ensureRequiredFrontmatter = (
  content,
  fallbackTitle,
  fallbackDescription = ''
) => {
  const normalizedContent = normalizeCodeFences(content);

  if (normalizedContent.startsWith('---\n')) {
    return normalizedContent;
  }

  const extracted = extractFrontmatterAndBody(
    normalizedContent,
    fallbackTitle,
    fallbackDescription
  );

  const frontmatter = [
    '---',
    `title: ${quoteYamlString(extracted.title)}`,
    `description: ${quoteYamlString(extracted.description)}`,
    'renderInlineTOC: false',
    '---',
    '',
  ].join('\n');

  return `${frontmatter}${extracted.body}`;
};

const exists = async (targetPath) => {
  try {
    await readdir(targetPath);
    return true;
  } catch {
    try {
      await readFile(targetPath, 'utf8');
      return true;
    } catch {
      return false;
    }
  }
};

const getWorkspacePackages = async (sectionDir) => {
  let entries = [];
  try {
    entries = await readdir(sectionDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const result = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packagePath = path.join(sectionDir, entry.name);
    const hasPackageJson = await exists(path.join(packagePath, 'package.json'));
    if (!hasPackageJson) {
      continue;
    }

    result.push({
      name: entry.name,
      path: packagePath,
    });
  }

  return result;
};

const getDocsFiles = async (directory, prefix = '') => {
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const nested = await getDocsFiles(fullPath, relative);
      files.push(...nested);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    files.push(relative);
  }

  return files;
};

const normalizeDocsRelativePath = (relativePath) => {
  const normalized = relativePath.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);

  if (parts.length === 0) {
    return normalized;
  }

  const fileName = parts.at(-1);
  if (!fileName) {
    return normalized;
  }

  const extension = path.extname(fileName).toLowerCase();
  const baseName = fileName.slice(0, fileName.length - extension.length);
  const normalizedFileName = `${toKebabCase(baseName)}${extension}`;
  const normalizedDirs = parts.slice(0, -1).map(toKebabCase);

  return [...normalizedDirs, normalizedFileName].join('/');
};

const copyPackageDocs = async (sourceDir, targetDir) => {
  const readmePath = path.join(sourceDir, 'README.md');
  const readmeExists = await exists(readmePath);
  if (!readmeExists) {
    throw new Error(
      `Missing README.md: ${path.relative(REPO_ROOT, readmePath)}`
    );
  }

  await mkdir(targetDir, { recursive: true });

  const readmeContent = rewriteRelativeMarkdownLinks(
    await readFile(readmePath, 'utf8'),
    readmePath
  );
  const packageName = path.basename(sourceDir);
  const docsDir = path.join(sourceDir, 'docs');
  const customFrontmatter = await getIndexFrontmatter(docsDir);

  let preparedReadme;
  if (customFrontmatter) {
    // Use custom frontmatter from index-frontmatter.yaml
    preparedReadme = `---\n${customFrontmatter}\n---\n\n${readmeContent}`;
  } else {
    // Fall back to extraction
    preparedReadme = ensureRequiredFrontmatter(
      readmeContent,
      prettifyTitle(packageName),
      `${prettifyTitle(packageName)} documentation.`
    );
  }

  // Convert HTML comments to MDX comments for MDX compatibility
  preparedReadme = convertHtmlCommentsToMdx(preparedReadme);

  await writeFile(path.join(targetDir, 'index.mdx'), preparedReadme, 'utf8');

  const docsFiles = await getDocsFiles(docsDir);
  if (docsFiles.length === 0) {
    return {
      docsFiles: 0,
      hasMeta: false,
    };
  }

  const metaPath = path.join(docsDir, 'meta.json');
  const hasMeta = await exists(metaPath);
  if (hasMeta) {
    await cp(metaPath, path.join(targetDir, 'meta.json'));
  }

  let copiedDocsFiles = 0;
  for (const relativePath of docsFiles) {
    const normalizedRelativePath = normalizeDocsRelativePath(relativePath);
    const ext = path.extname(normalizedRelativePath).toLowerCase();

    if (!DOC_EXTENSIONS.has(ext)) {
      continue;
    }

    const noExt = normalizedRelativePath.replace(/\.[^.]+$/u, '');
    if (noExt === 'index') {
      // Root index is always sourced from README landing page.
      continue;
    }

    const from = path.join(docsDir, relativePath);
    const to = path.join(targetDir, normalizedRelativePath);
    const fileContent = rewriteRelativeMarkdownLinks(
      await readFile(from, 'utf8'),
      from
    );
    const fallbackTitle = prettifyTitle(path.basename(normalizedRelativePath));
    const preparedContent = ensureRequiredFrontmatter(
      fileContent,
      fallbackTitle,
      `${fallbackTitle} documentation.`
    );

    await mkdir(path.dirname(to), { recursive: true });
    await writeFile(to, preparedContent, 'utf8');
    copiedDocsFiles += 1;
  }

  return {
    docsFiles: copiedDocsFiles,
    hasMeta,
  };
};

const removeMaterializationPlaceholders = (content) => {
  // We expect an exact statement `<!-- START_REMOVE_WHEN_MATERIALIZING_DOCS -->` to mark the start of a placeholder block,
  // and `<!-- END_REMOVE_WHEN_MATERIALIZING_DOCS -->` to mark the end. Everything between will be removed.
  const startMarker = '<!-- START_REMOVE_WHEN_MATERIALIZING_DOCS -->';
  const endMarker = '<!-- END_REMOVE_WHEN_MATERIALIZING_DOCS -->';

  let result = content;
  let startIndex = result.indexOf(startMarker);
  while (startIndex !== -1) {
    const endIndex = result.indexOf(endMarker, startIndex + startMarker.length);
    if (endIndex === -1) {
      break;
    }

    result =
      result.slice(0, startIndex) + result.slice(endIndex + endMarker.length);
    startIndex = result.indexOf(startMarker);
  }

  return result;
};

const materialize = async () => {
  const generatedRoots = [
    path.join(DOCS_ROOT, 'apps'),
    path.join(DOCS_ROOT, 'packages'),
    path.join(DOCS_ROOT, 'vendor'),
  ];

  for (const generatedRoot of generatedRoots) {
    await rm(generatedRoot, { recursive: true, force: true });
    await mkdir(generatedRoot, { recursive: true });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    root: null,
    apps: [],
    packages: [],
    vendor: [],
  };

  // Materialize root README
  const rootReadmePath = path.join(REPO_ROOT, 'README.md');
  try {
    const rootReadmeContent = rewriteRelativeMarkdownLinks(
      await readFile(rootReadmePath, 'utf8'),
      rootReadmePath
    );
    const rootFrontmatter = await getIndexFrontmatter(
      path.join(REPO_ROOT, 'docs')
    );

    const rootBodyWithoutLead = stripLeadTitleAndDescription(
      removeMaterializationPlaceholders(normalizeCodeFences(rootReadmeContent))
    );

    let preparedRootReadme;
    if (rootFrontmatter) {
      // Use custom frontmatter from docs/index-frontmatter.yaml
      preparedRootReadme = `---\n${rootFrontmatter}\n---\n\n${rootBodyWithoutLead}`;
    } else {
      // Fall back to extraction
      preparedRootReadme = ensureRequiredFrontmatter(
        rootReadmeContent,
        'Repository',
        'Main project documentation and overview.'
      );
    }

    // Convert HTML comments to MDX comments for MDX compatibility
    preparedRootReadme = convertHtmlCommentsToMdx(preparedRootReadme);
    await mkdir(DOCS_ROOT, { recursive: true });
    await writeFile(
      path.join(DOCS_ROOT, 'index.mdx'),
      preparedRootReadme,
      'utf8'
    );
    summary.root = {
      sourcePath: 'README.md',
    };
  } catch {
    // Root README is optional
  }

  const sections = [
    { source: 'apps', target: 'apps' },
    { source: 'packages', target: 'packages' },
    { source: 'vendor', target: 'vendor' },
  ];

  for (const section of sections) {
    const sourceRoot = path.join(REPO_ROOT, section.source);
    const targetRoot = path.join(DOCS_ROOT, section.target);
    const packages = await getWorkspacePackages(sourceRoot);

    for (const pkg of packages) {
      const targetDir = path.join(targetRoot, pkg.name);
      const result = await copyPackageDocs(pkg.path, targetDir);

      summary[section.target].push({
        name: pkg.name,
        targetPath: path.relative(REPO_ROOT, targetDir).replace(/\\/g, '/'),
        docsFiles: result.docsFiles,
        hasMeta: result.hasMeta,
      });
    }
  }

  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(summary, null, 2), 'utf8');

  console.log('External docs materialized.');
  console.log(`Manifest written to ${path.relative(REPO_ROOT, MANIFEST_PATH)}`);
};

await materialize();
