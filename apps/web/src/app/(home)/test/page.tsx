'use client';

// [DEV] Docs customization and configuration:
// http://localhost:3000/docs
// https://www.fumadocs.dev/docs/ui/search
// https://www.fumadocs.dev/docs/ui/layouts/root-provider#theme-provider

// [DEV] Editor Component playgrounds:
// https://playground.lexical.dev/
// https://tiptap.dev/

import { AdaptiveDialogPanel } from '@md-oss/design-system/components/adaptive/dialog';
import {
  type AdaptiveTabItem,
  AdaptiveTabs,
} from '@md-oss/design-system/components/adaptive/tabs';
import { ContentMarquee } from '@md-oss/design-system/components/animated/content-marquee';
import { StaggeredList } from '@md-oss/design-system/components/animated/staggered-list';
import { AccessDenied } from '@md-oss/design-system/components/sections/access-denied';
import { PageContainer } from '@md-oss/design-system/components/sections/page-container';
import { ParticleBackground } from '@md-oss/design-system/components/sections/particle-background';
import { ConfirmationDialog } from '@md-oss/design-system/components/state/confirmation-dialog';
import { DateRenderer } from '@md-oss/design-system/components/state/date-renderer';
import { FullPageLoader } from '@md-oss/design-system/components/state/full-page-loader';
import {
  LoaderWithContainer,
  Loader as MDLoader,
} from '@md-oss/design-system/components/state/loader';
import {
  LoadingOverlay,
  ProgressBar,
} from '@md-oss/design-system/components/state/loading-overlay';
import {
  CodeBlock,
  registerCodeBlockLanguage,
} from '@md-oss/design-system/components/ui/aceternity/code-block';
import { Button } from '@md-oss/design-system/components/ui/button';
import { ExternalLink } from '@md-oss/design-system/components/ui/extended/external-link';
import {
  InlineSelectEditor,
  InlineStringListEditor,
  InlineTextEditor,
} from '@md-oss/design-system/components/ui/extended/inline-edit';
import { Spoiler } from '@md-oss/design-system/components/ui/extended/spoiler';
import { useConfirmationStore } from '@md-oss/design-system/hooks/use-confirmation-store';
import { RocketIcon } from 'lucide-react';
import { useState } from 'react';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import Loader from '@/components/loader';
import SchemaObjectFormTest from './schema-object-form';

registerCodeBlockLanguage('jsx', jsx);
registerCodeBlockLanguage('tsx', tsx);
registerCodeBlockLanguage('rust', rust);

const marqueeItems = [
  'Type-safe primitives',
  'Slot-based customization',
  'Accessible defaults',
  'Modern motion',
  'Composable sections',
  'Extended UI',
].map((label) => (
  <div
    key={label}
    className="rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium whitespace-nowrap shadow-sm backdrop-blur"
  >
    {label}
  </div>
));

const LargeDummyContent = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 20 }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: This is just dummy content for demonstration purposes.
      <p key={i}>
        This is some <ExternalLink href="#">dummy content</ExternalLink> to
        demonstrate the particle background. It should be long enough to allow
        scrolling and show how the particles behave in a larger space.
      </p>
    ))}
  </div>
);

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'In Review', value: 'review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Merged', value: 'merged' },
];

const tabItems: AdaptiveTabItem[] = [
  {
    value: 'overview',
    label: 'Overview',
    icon: null,
    content: (viewType) => (
      <div className={viewType === 'mobile' ? 'mt-2 space-y-2' : 'space-y-2'}>
        <p className="text-sm">This is the overview tab content.</p>
        <p className="text-xs text-muted-foreground">
          Adaptive tabs switch between vertical tabs (desktop) and a
          dialog-based menu (mobile) automatically.
        </p>
      </div>
    ),
  },
  {
    value: 'details',
    label: 'Details',
    icon: null,
    content: (viewType) => (
      <div className={viewType === 'mobile' ? 'mt-2 space-y-2' : 'space-y-2'}>
        <p className="text-sm">This is the details tab content.</p>
        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
          <li>Mobile: Dialog-based tab selector</li>
          <li>Desktop: Vertical tabs layout</li>
          <li>Supports icons and custom content</li>
        </ul>
      </div>
    ),
  },
  {
    value: 'settings',
    label: 'Settings',
    icon: null,
    content: (viewType) => (
      <div className={viewType === 'mobile' ? 'mt-2 space-y-2' : 'space-y-2'}>
        <p className="text-sm">This is the settings tab content.</p>
        <p className="text-xs text-muted-foreground">
          Customize classNames and slotProps for full styling control.
        </p>
      </div>
    ),
  },
];

async function wait(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default function TestPage() {
  const [title, setTitle] = useState(
    'feat(design-system): ship inline edit collection'
  );
  const [summary, setSummary] = useState(
    'Adds low-shift inline editing primitives for text, select, and string lists.'
  );
  const [status, setStatus] = useState('review');
  const [labels, setLabels] = useState(['design-system', 'ui', 'inline-edit']);
  const [reviewChecklist, setReviewChecklist] = useState([
    'Keyboard shortcuts verified',
    'Loading state visible',
    'No layout jump on edit',
  ]);
  const [showFullPageLoader, setShowFullPageLoader] = useState(false);
  const [isLoadingOverlay, setIsLoadingOverlay] = useState(false);
  const [progress, setProgress] = useState(40);
  const [staggeredReplayKey, setStaggeredReplayKey] = useState(0);
  const { openConfirmation } = useConfirmationStore();

  return (
    <>
      <ParticleBackground
        className="fixed"
        particleCount={100}
        particleSize={2}
        particleSpeed={0.5}
        lineDistance={100}
        color="#ff0000"
      />
      <PageContainer className="relative flex flex-col gap-4 *:relative *:border *:border-red-500/60 *:before:absolute *:before:-top-2 *:before:left-2 *:before:text-[10px] *:before:px-1 *:before:bg-red-500 *:before:text-white">
        <Loader />
        <MDLoader />
        <LoaderWithContainer
          slotProps={{
            loader: {
              asComponent: RocketIcon,
            },
          }}
        />
        <AccessDenied variant="default" />
        <AccessDenied variant="card" />
        <Spoiler variant="minimal">
          <CodeBlock
            filename="example.js"
            title={<h3>Example Code</h3>}
            language="javascript"
            highlightLines={[1, 5, 6]}
            code={`function greet(name) {
  return 'Hello, ' + name + '!';
}

console.log(greet('World'));
console.log(greet('This is a veeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeery long string with little-to-no word break'));`}
          />
        </Spoiler>
        <Spoiler variant="card">
          <LargeDummyContent />
        </Spoiler>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/70 px-4 py-6">
          <ContentMarquee
            items={marqueeItems}
            speed="slow"
            className="max-w-full"
            classNames={{
              track: 'gap-3',
            }}
          />
        </div>

        <section className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4">
          <h2 className="text-lg font-semibold">Adaptive Tabs</h2>
          <AdaptiveTabs
            tabs={tabItems}
            defaultValue="overview"
            title="Select Tab"
            description="Choose a tab to view its content"
            onValueChange={(value) => console.log('Tab changed:', value)}
            classNames={{
              wrapper: 'w-full',
            }}
          />
        </section>

        <section className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4">
          <h2 className="text-lg font-semibold">Adaptive Dialog Panel</h2>
          <AdaptiveDialogPanel
            trigger={<Button variant="outline">Open Adaptive Panel</Button>}
            title="Edit Pull Request"
            description="Desktop renders as Dialog, mobile renders as Drawer."
            closeAction={<Button variant="outline">Cancel</Button>}
            slotProps={{
              close: { asChild: true },
            }}
            footer={<Button>Save Changes</Button>}
            classNames={{
              body: 'space-y-3',
            }}
          >
            <p className="text-sm text-muted-foreground">
              This panel is a responsive shell primitive intended for forms and
              review flows.
            </p>
            <InlineTextEditor
              value={title}
              onSave={async (nextValue) => {
                await wait(250);
                setTitle(nextValue);
              }}
              placeholders={{
                idle: 'Set title',
                editing: 'Update title',
              }}
            />
          </AdaptiveDialogPanel>
        </section>

        <section className="space-y-4 rounded-2xl border border-border/70 bg-card/70 p-4">
          <h2 className="text-lg font-semibold">Inline Edit Collection</h2>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              PR title style inline editing
            </p>
            <InlineTextEditor
              value={title}
              onSave={async (nextValue) => {
                await wait(500);
                setTitle(nextValue);
              }}
              placeholders={{
                idle: 'Click to set title',
                editing: 'Enter PR title',
              }}
              classNames={{
                trigger: 'text-base font-semibold',
                input: 'text-base font-semibold',
              }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Multiline summary editor
            </p>
            <InlineTextEditor
              mode="multiline"
              value={summary}
              onSave={async (nextValue) => {
                await wait(500);
                setSummary(nextValue);
              }}
              placeholders={{
                idle: 'Click to add summary',
                editing: 'Write a concise summary (Ctrl/Cmd+Enter to save)',
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Inline select editor
              </p>
              <InlineSelectEditor
                value={status}
                options={statusOptions}
                onSave={async (nextValue) => {
                  await wait(450);
                  setStatus(nextValue);
                }}
                renderValue={(value) => (
                  <span className="capitalize">{value.replace('-', ' ')}</span>
                )}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Read-only and disabled states
              </p>
              <InlineTextEditor
                editable={false}
                value="Read-only preview value"
                onSave={() => {}}
              />
              <InlineTextEditor
                disabled
                value="Disabled editor trigger"
                onSave={() => {}}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                String list editor: chips
              </p>
              <InlineStringListEditor
                value={labels}
                onChange={setLabels}
                mode="chips"
                placeholder="Add label"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                String list editor: list + multiline composer
              </p>
              <InlineStringListEditor
                value={reviewChecklist}
                onChange={setReviewChecklist}
                mode="list"
                composerMode="multiline"
                placeholder="Add checklist item"
              />
            </div>
          </div>
        </section>

        {/* ── ConfirmationDialog ─────────────────────────────────── */}
        <section>
          <ConfirmationDialog />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              onClick={() =>
                openConfirmation({
                  title: 'Delete item',
                  description:
                    'This action cannot be undone. The item will be permanently removed.',
                  cancelLabel: 'Cancel',
                  actionLabel: 'Delete',
                  actionProps: { variant: 'destructive' },
                  cancelProps: {},
                  onAction: () => console.log('Deleted'),
                  onCancel: () => console.log('Cancelled'),
                })
              }
            >
              Open destructive confirmation
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                openConfirmation({
                  title: 'Save changes',
                  description: 'Are you sure you want to save these changes?',
                  cancelLabel: 'Discard',
                  actionLabel: 'Save',
                  actionProps: {},
                  cancelProps: {},
                  onAction: () => console.log('Saved'),
                  onCancel: () => console.log('Discarded'),
                })
              }
            >
              Open save confirmation
            </Button>
          </div>
        </section>

        {/* ── DateRenderer ───────────────────────────────────────── */}
        <section>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-32 shrink-0">
                5s ago:
              </span>
              <DateRenderer date={new Date(Date.now() - 5_000)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-32 shrink-0">
                3min ago:
              </span>
              <DateRenderer date={new Date(Date.now() - 3 * 60_000)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-32 shrink-0">
                2h ago:
              </span>
              <DateRenderer date={new Date(Date.now() - 2 * 3_600_000)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-32 shrink-0">
                In 10min:
              </span>
              <DateRenderer date={new Date(Date.now() + 10 * 60_000)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-32 shrink-0">
                Force relative:
              </span>
              <DateRenderer
                date={new Date('2020-01-01')}
                forceRelative
                className="text-muted-foreground"
              />
            </div>
          </div>
        </section>

        {/* ── FullPageLoader ─────────────────────────────────────── */}
        <section>
          {showFullPageLoader && <FullPageLoader />}
          <Button
            onClick={() => {
              setShowFullPageLoader(true);
              setTimeout(() => setShowFullPageLoader(false), 2000);
            }}
          >
            Show full-page loader (2s)
          </Button>
        </section>

        {/* ── LoadingOverlay + ProgressBar ───────────────────────── */}
        <section>
          <div className="flex flex-col gap-4">
            <div className="relative h-32 rounded-lg border border-border overflow-hidden">
              <p className="p-4 text-sm">Content underneath the overlay</p>
              <LoadingOverlay isLoading={isLoadingOverlay} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setIsLoadingOverlay(true);
                  setTimeout(() => setIsLoadingOverlay(false), 2000);
                }}
              >
                Show loading overlay (2s)
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                ProgressBar at {progress}%
              </p>
              <ProgressBar progress={progress} />
              <div className="flex gap-2">
                {[0, 25, 50, 75, 100].map((v) => (
                  <Button
                    key={v}
                    variant="outline"
                    size="sm"
                    onClick={() => setProgress(v)}
                  >
                    {v}%
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── StaggeredList ──────────────────────────────────────── */}
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Staggered List</h2>
              <p className="text-xs text-muted-foreground">
                Items animate on mount. Use Replay to trigger the stagger
                sequence again after scrolling into this section.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStaggeredReplayKey((prev) => prev + 1)}
            >
              Replay animation
            </Button>
          </div>

          <StaggeredList
            key={staggeredReplayKey}
            className="flex flex-col gap-2"
          >
            {[
              'First item',
              'Second item',
              'Third item',
              'Fourth item',
              'Fifth item',
            ].map((item) => (
              <div
                key={item}
                className="rounded-md border border-border bg-card px-4 py-2 text-sm"
              >
                {item}
              </div>
            ))}
          </StaggeredList>
        </section>
        <SchemaObjectFormTest />
      </PageContainer>
    </>
  );
}
