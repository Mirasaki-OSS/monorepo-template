'use client';

import { Button } from '@md-oss/design-system/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@md-oss/design-system/components/ui/dialog';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@md-oss/design-system/components/ui/tabs';
import { useIsMobile } from '@md-oss/design-system/hooks/use-mobile';
import {
	cn,
	mergePropsWithClassName,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import { ChevronDown } from 'lucide-react';
import React from 'react';

export type AdaptiveTabViewType = 'mobile' | 'desktop';

export type AdaptiveTabItem = {
	value: string;
	label: string;
	icon?: React.ReactNode;
	content:
		| React.ReactNode
		| ((viewType: AdaptiveTabViewType) => React.JSX.Element);
};

export type AdaptiveTabsProps = {
	tabs: AdaptiveTabItem[];
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	title?: string;
	description?: string;
	className?: string;
	classNames?: {
		wrapper?: string;
		mobileMenuTrigger?: string;
		tabList?: string;
		tabTrigger?: string;
		tabContent?: string;
	};
	slotProps?: {
		wrapper?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		mobileMenuTrigger?: React.ComponentProps<typeof Button>;
		tabsList?: React.ComponentProps<typeof TabsList>;
		tabsTrigger?: Partial<React.ComponentProps<typeof TabsTrigger>>;
		tabsContent?: Partial<React.ComponentProps<typeof TabsContent>>;
		mobileDialog?: React.ComponentProps<typeof Dialog>;
		mobileDialogTrigger?: React.ComponentProps<typeof DialogTrigger>;
		mobileDialogContent?: React.ComponentProps<typeof DialogContent>;
		mobileDialogHeader?: React.ComponentProps<typeof DialogHeader>;
		mobileDialogTitle?: React.ComponentProps<typeof DialogTitle>;
		mobileDialogDescription?: React.ComponentProps<typeof DialogDescription>;
	};
};

export function AdaptiveTabs({
	tabs,
	defaultValue,
	onValueChange,
	title = 'Options',
	description = 'Select a tab',
	className,
	classNames,
	slotProps,
}: AdaptiveTabsProps): React.JSX.Element {
	const isMobile = useIsMobile();
	const [activeTab, setActiveTab] = React.useState(
		defaultValue || tabs[0]?.value || ''
	);
	const [mobileDialogOpen, setMobileDialogOpen] = React.useState(false);

	const activeTabData = tabs.find((tab) => tab.value === activeTab);

	const handleTabChange = (value: string) => {
		setActiveTab(value);
		setMobileDialogOpen(false);
		onValueChange?.(value);
	};

	if (isMobile) {
		return (
			<MobileView
				tabs={tabs}
				activeTab={activeTab}
				activeTabData={activeTabData}
				mobileDialogOpen={mobileDialogOpen}
				setMobileDialogOpen={setMobileDialogOpen}
				handleTabChange={handleTabChange}
				title={title}
				description={description}
				className={className}
				classNames={classNames}
				slotProps={slotProps}
			/>
		);
	}

	return (
		<DesktopView
			tabs={tabs}
			activeTab={activeTab}
			onValueChange={handleTabChange}
			className={className}
			classNames={classNames}
			slotProps={slotProps}
		/>
	);
}

function MobileView({
	tabs,
	activeTab,
	activeTabData,
	mobileDialogOpen,
	setMobileDialogOpen,
	handleTabChange,
	title,
	description,
	className,
	classNames,
	slotProps,
}: {
	tabs: AdaptiveTabItem[];
	activeTab: string;
	activeTabData: AdaptiveTabItem | undefined;
	mobileDialogOpen: boolean;
	setMobileDialogOpen: (open: boolean) => void;
	handleTabChange: (value: string) => void;
	title: string;
	description: string;
	className?: string;
	classNames?: AdaptiveTabsProps['classNames'];
	slotProps?: AdaptiveTabsProps['slotProps'];
}): React.JSX.Element {
	const wrapperProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>({}, slotProps?.wrapper, classNames?.wrapper, className);

	const triggerProps = mergePropsWithClassName<
		React.ComponentProps<typeof Button>
	>(
		{
			variant: 'outline',
			className:
				'w-full justify-between transition-all duration-200 hover:bg-accent',
		},
		slotProps?.mobileMenuTrigger,
		classNames?.mobileMenuTrigger
	);

	return (
		<div {...wrapperProps}>
			<Dialog
				open={mobileDialogOpen}
				onOpenChange={setMobileDialogOpen}
				{...slotProps?.mobileDialog}
			>
				<DialogTrigger asChild {...slotProps?.mobileDialogTrigger}>
					<Button {...triggerProps}>
						<span className="flex items-center gap-2">
							{activeTabData?.icon}
							{activeTabData?.label || 'Select a tab'}
						</span>
						<ChevronDown className="h-4 w-4 opacity-50" />
					</Button>
				</DialogTrigger>
				<DialogContent
					className="sm:max-w-md"
					{...slotProps?.mobileDialogContent}
				>
					<DialogHeader {...slotProps?.mobileDialogHeader}>
						<DialogTitle {...slotProps?.mobileDialogTitle}>{title}</DialogTitle>
						<DialogDescription {...slotProps?.mobileDialogDescription}>
							{description}
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-2">
						{tabs.map((tab) => (
							<Button
								key={tab.value}
								variant={activeTab === tab.value ? 'default' : 'outline'}
								className={cn(
									'justify-start gap-2 transition-all duration-200',
									activeTab === tab.value &&
										'bg-primary text-primary-foreground',
									classNames?.tabTrigger
								)}
								onClick={() => handleTabChange(tab.value)}
							>
								{tab.icon}
								{tab.label}
							</Button>
						))}
					</div>
				</DialogContent>
			</Dialog>

			<div
				className={cn(
					'animate-in fade-in-0 duration-300',
					classNames?.tabContent
				)}
			>
				{typeof activeTabData?.content === 'function'
					? activeTabData.content('mobile')
					: activeTabData?.content}
			</div>
		</div>
	);
}

function DesktopView({
	tabs,
	activeTab,
	onValueChange,
	className,
	classNames,
	slotProps,
}: {
	tabs: AdaptiveTabItem[];
	activeTab: string;
	onValueChange?: (value: string) => void;
	className?: string;
	classNames?: AdaptiveTabsProps['classNames'];
	slotProps?: AdaptiveTabsProps['slotProps'];
}): React.JSX.Element {
	const wrapperProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>({}, slotProps?.wrapper, classNames?.wrapper, className);

	const tabsListProps = mergePropsWithClassName<
		React.ComponentProps<typeof TabsList>
	>(
		{
			className: cn(
				'flex flex-col h-min w-64 items-stretch justify-start gap-1 p-2 bg-card text-card-foreground rounded-xl border transition-all duration-200'
			),
		},
		slotProps?.tabsList,
		classNames?.tabList
	);

	return (
		<div {...wrapperProps}>
			<Tabs
				value={activeTab}
				onValueChange={(value) => {
					onValueChange?.(value);
				}}
				orientation="vertical"
			>
				<div className="flex flex-row gap-2">
					<TabsList {...tabsListProps}>
						{tabs.map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className={cn(
									'justify-start gap-2 px-4 py-3 data-[state=active]:bg-background transition-all duration-200 hover:bg-accent/50 data-[state=active]:shadow-sm',
									classNames?.tabTrigger
								)}
								{...slotProps?.tabsTrigger}
							>
								{tab.icon}
								<span className="font-medium">{tab.label}</span>
							</TabsTrigger>
						))}
					</TabsList>

					<div className="flex-1 min-w-0">
						{tabs.map((tab) => (
							<TabsContent
								key={tab.value}
								value={tab.value}
								className={cn(
									'mt-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
									classNames?.tabContent
								)}
								{...slotProps?.tabsContent}
							>
								{typeof tab.content === 'function'
									? tab.content('desktop')
									: tab.content}
							</TabsContent>
						))}
					</div>
				</div>
			</Tabs>
		</div>
	);
}
