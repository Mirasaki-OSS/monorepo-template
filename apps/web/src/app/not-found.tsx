'use client';

import { AmbientBlobField } from '@md-oss/design-system/components/animated/ambient-blob';
import { buttonVariants } from '@md-oss/design-system/components/ui/button';
import { cn } from '@md-oss/design-system/lib/utils';
import Link from 'next/link';
import { githubUrl } from '@/lib/github';

export default function NotFound() {
  return (
    <div className="flex grow relative place-items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.22),transparent_32%),radial-gradient(circle_at_85%_12%,hsl(25_95%_58%/.22),transparent_30%),radial-gradient(circle_at_50%_100%,hsl(190_90%_45%/.16),transparent_42%)]" />

      <AmbientBlobField className="blur dark:blur-2xl" />

      <section className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border/70 bg-background/65 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,hsl(var(--background)/.95),hsl(var(--background)/.55))]" />
        <div className="absolute -right-14 -top-14 -z-10 size-44 rounded-full border border-primary/30" />
        <div className="absolute -bottom-16 -left-14 -z-10 size-52 rounded-full border border-orange-400/30" />

        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground sm:text-sm">
          Error 404
        </p>

        <h1 className="text-balance text-5xl font-black leading-[0.92] tracking-[-0.035em] sm:text-7xl">
          This page drifted
          <span className="bg-linear-to-r from-primary via-orange-500 to-cyan-500 bg-clip-text text-transparent">
            {' '}
            off the map
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          The route you requested does not exist, has moved, or is temporarily
          unavailable. If this looks wrong, please report it so we can fix it.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className={buttonVariants({
              size: 'lg',
              variant: 'default',
            })}
          >
            Back to Home
          </Link>

          <Link
            href={githubUrl('/issues/new')}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({
                size: 'lg',
                variant: 'outline',
              }),
              'border-border/70 bg-background/55 hover:bg-background'
            )}
          >
            Report an Issue
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Hint: check the URL for typos, then try again.
        </p>
      </section>
    </div>
  );
}
