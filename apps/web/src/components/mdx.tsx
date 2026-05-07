import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import type { ImgHTMLAttributes } from 'react';
import { Mermaid } from './mdx/mermaid';

const toDimension = (value: string | number | undefined, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return fallback;
};

function DocsImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const { src, alt, style, width, height, className, title, loading } = props;

  if (typeof src !== 'string' || src.length === 0) {
    return null;
  }

  const lowerSrc = src.toLowerCase();
  const isSvg =
    lowerSrc.endsWith('.svg') || lowerSrc.includes('img.shields.io');
  const resolvedWidth = toDimension(width, 1200);
  const resolvedHeight = toDimension(height, 630);

  return (
    <Image
      src={src}
      alt={alt ?? ''}
      width={resolvedWidth}
      height={resolvedHeight}
      unoptimized={isSvg}
      className={className}
      title={title}
      loading={loading ?? 'lazy'}
      style={{ width: 'auto', height: 'auto', ...style }}
    />
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    img: DocsImage,
    Mermaid,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
