'use client';

import { ClientOnly } from '@md-oss/design-system/components/client-only';
import {
	CopyButton,
	type CopyButtonProps,
} from '@md-oss/design-system/components/ui/extended/copy-button';
import { cn, mergePropsWithClassName } from '@md-oss/design-system/lib/utils';
import { useTheme } from 'next-themes';
import React from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
	atomDark,
	oneLight,
} from 'react-syntax-highlighter/dist/cjs/styles/prism';

export type CodeBlockLanguage = Record<string, unknown>;

const registeredCodeBlockLanguages = new Set<string>();

export function registerCodeBlockLanguage(
	name: string,
	language: CodeBlockLanguage
): void {
	if (registeredCodeBlockLanguages.has(name)) {
		return;
	}
	SyntaxHighlighter.registerLanguage(name, language);
	registeredCodeBlockLanguages.add(name);
}

export function registerCodeBlockLanguages(
	languages: Record<string, CodeBlockLanguage>
): void {
	for (const [name, language] of Object.entries(languages)) {
		registerCodeBlockLanguage(name, language);
	}
}

export type CodeBlockTab = {
	name: string;
	code: string;
	language?: string;
	highlightLines?: number[];
};

export type TabButtonSlotProps = Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'onClick' | 'type' | 'role' | 'aria-selected' | 'aria-controls' | 'id'
>;

export type CodeBlockCopyButtonProps = Omit<
	CopyButtonProps,
	'text' | 'getText' | 'hideLabel'
>;

export type CodeBlockProps = {
	language: string;
	languages?: Record<string, CodeBlockLanguage>;
	filename?: React.ReactNode;
	title?: React.ReactNode;
	highlightLines?: number[];
	showLineNumbers?: boolean;
	wrapLongLines?: boolean;
	className?: string;
	classNames?: {
		head?: string;
		tabsList?: string;
		tabButton?: string;
		tabButtonActive?: string;
		tabButtonInactive?: string;
		metaRow?: string;
		filename?: string;
		copyButton?: string;
	};
	slotProps?: {
		root?: React.HTMLAttributes<HTMLDivElement>;
		head?: React.HTMLAttributes<HTMLDivElement>;
		tabsList?: React.HTMLAttributes<HTMLDivElement>;
		tabButton?: TabButtonSlotProps;
		metaRow?: React.HTMLAttributes<HTMLDivElement>;
		filename?: React.HTMLAttributes<HTMLDivElement>;
		copyButton?: CodeBlockCopyButtonProps;
	};
	onCopyToClipboard?: (content: string) => void;
} & (
	| {
			code: string;
			tabs?: never;
	  }
	| {
			code?: never;
			tabs: CodeBlockTab[];
	  }
);

export const CodeBlock = ({
	language,
	languages = {},
	filename,
	title,
	code,
	highlightLines = [],
	showLineNumbers = true,
	wrapLongLines = true,
	tabs = [],
	className,
	classNames,
	slotProps,
	onCopyToClipboard,
}: CodeBlockProps) => {
	const [activeTab, setActiveTab] = React.useState(0);
	const lineNumberGutter = '2.125rem';
	const tabsId = React.useId();
	const { resolvedTheme } = useTheme();
	const isDarkTheme = resolvedTheme === 'dark';

	const tabsExist = tabs.length > 0;
	const hasMeta = !tabsExist && (title || filename);

	React.useEffect(() => {
		if (languages) {
			registerCodeBlockLanguages(languages);
		}
	}, [languages]);

	React.useEffect(() => {
		if (activeTab >= tabs.length) {
			setActiveTab(0);
		}
	}, [activeTab, tabs.length]);

	const activeCode = tabsExist ? tabs[activeTab]?.code : code;
	const activeLanguage = tabsExist
		? tabs[activeTab]?.language || language
		: language;
	const activeHighlightLines = tabsExist
		? tabs[activeTab]?.highlightLines || []
		: highlightLines;

	const rootProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className:
				'relative w-full rounded-lg border bg-zinc-50 p-4 pt-1 font-mono text-sm dark:bg-zinc-900',
		},
		slotProps?.root,
		className
	);

	const headProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>({ className: 'flex flex-col gap-2' }, slotProps?.head, classNames?.head);

	const tabsListProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{ role: 'tablist', className: 'flex overflow-x-auto' },
		slotProps?.tabsList,
		classNames?.tabsList
	);

	const metaRowProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{ className: 'flex justify-between items-center py-2' },
		slotProps?.metaRow,
		classNames?.metaRow
	);

	const filenameProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{ className: 'text-xs text-zinc-500 dark:text-zinc-400' },
		slotProps?.filename,
		classNames?.filename
	);

	const copyButtonProps = mergePropsWithClassName<CodeBlockCopyButtonProps>(
		{
			className:
				'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
		},
		slotProps?.copyButton,
		classNames?.copyButton
	);

	return (
		<div {...rootProps}>
			<div {...headProps}>
				{tabsExist && (
					<div {...tabsListProps}>
						{tabs.map((tab, index) => (
							<button
								key={`${tab.name}-${index}`}
								type="button"
								onClick={() => setActiveTab(index)}
								id={`${tabsId}-tab-${index}`}
								role="tab"
								aria-controls={`${tabsId}-panel`}
								aria-selected={activeTab === index}
								{...mergePropsWithClassName<TabButtonSlotProps>(
									{
										className: 'px-3 py-2 text-xs transition-colors font-sans',
									},
									slotProps?.tabButton,
									classNames?.tabButton,
									activeTab === index
										? 'text-foreground'
										: 'text-muted-foreground hover:text-foreground',
									activeTab === index
										? classNames?.tabButtonActive
										: classNames?.tabButtonInactive
								)}
							>
								{tab.name}
							</button>
						))}
					</div>
				)}
				{hasMeta && (
					<div {...metaRowProps}>
						<div {...filenameProps}>{title || filename}</div>
						<CopyButton
							{...copyButtonProps}
							getText={() => activeCode || ''}
							hideLabel
							disabled={!activeCode}
							onCopied={onCopyToClipboard}
						/>
					</div>
				)}
			</div>
			<ClientOnly
				fallback={
					<pre
						className={cn(
							'rounded-sm bg-transparent p-0 text-sm text-muted-foreground',
							wrapLongLines
								? 'overflow-x-hidden whitespace-pre-wrap wrap-break-word'
								: 'overflow-auto whitespace-pre',
							showLineNumbers ? 'pl-0' : ''
						)}
						style={{
							lineHeight: '1.5',
							paddingLeft: showLineNumbers ? lineNumberGutter : undefined,
						}}
					>
						{String(activeCode)}
					</pre>
				}
			>
				<SyntaxHighlighter
					id={`${tabsId}-panel`}
					role={tabsExist ? 'tabpanel' : undefined}
					aria-labelledby={tabsExist ? `${tabsId}-tab-${activeTab}` : undefined}
					language={activeLanguage}
					style={isDarkTheme ? atomDark : oneLight}
					customStyle={{
						margin: 0,
						padding: 0,
						background: 'transparent',
						fontSize: '0.875rem',
						overflowX: wrapLongLines ? 'visible' : 'auto',
						overflowY: 'auto',
					}}
					wrapLines={true}
					wrapLongLines={wrapLongLines}
					showLineNumbers={showLineNumbers}
					lineNumberStyle={
						showLineNumbers
							? {
									display: 'inline-block',
									width: lineNumberGutter,
									minWidth: lineNumberGutter,
									marginLeft: wrapLongLines
										? `-${lineNumberGutter}`
										: undefined,
									paddingRight: '0.75rem',
									textAlign: 'right',
									userSelect: 'none',
								}
							: undefined
					}
					lineProps={(lineNumber) => ({
						style: {
							backgroundColor: activeHighlightLines.includes(lineNumber)
								? isDarkTheme
									? 'rgba(255,255,255,0.1)'
									: 'rgba(15,23,42,0.08)'
								: 'transparent',
							display: 'block',
							width: '100%',
							...(showLineNumbers && wrapLongLines
								? {
										paddingInlineStart: lineNumberGutter,
									}
								: {}),
							...(wrapLongLines
								? { whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
								: { whiteSpace: 'pre' }),
						},
					})}
					PreTag="div"
				>
					{String(activeCode)}
				</SyntaxHighlighter>
			</ClientOnly>
		</div>
	);
};
