'use client';

import type { AuthPluginBase, SettingsView } from '@better-auth-ui/core';
import { useAuth, useAuthenticate } from '@better-auth-ui/react';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@md-oss/design-system/components/ui/tabs';
import { cn } from '@md-oss/design-system/lib/utils';
import {
	FingerprintPatternIcon,
	IdCardIcon,
	type LucideIcon,
	Share2Icon,
	ShieldCheckIcon,
	UserRoundKeyIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import type { ExtendedViewPaths } from '../pages/view-paths';
import { AccountSettings } from './account/account-settings';
import { LinkedAccountSettings } from './linked-accounts/linked-accounts-settings';
import { SecuritySettings } from './security/security-settings';
import { SessionsSettings } from './sessions/sessions-settings';

type ExtendedSettingsView =
	| SettingsView
	| 'sessions'
	| 'linkedAccounts'
	| 'apiKeys';

export type SettingsIcons = Record<ExtendedSettingsView, LucideIcon>;

export const defaultSettingsIcons: SettingsIcons = {
	account: IdCardIcon,
	linkedAccounts: Share2Icon,
	security: ShieldCheckIcon,
	sessions: FingerprintPatternIcon,
	apiKeys: UserRoundKeyIcon,
};

export type SettingsProps = {
	className?: string;
	path?: string;
	/** @remarks `ExtendedSettingsView` */
	view?: ExtendedSettingsView;
	hideNav?: boolean;
	icons?: Partial<SettingsIcons>;
};

/**
 * Renders the settings UI and activates the appropriate settings view based on `view` or `path`.
 *
 * @param className - Additional CSS class names applied to the root container
 * @param path - Route path used to resolve which settings view to activate when `view` is not provided
 * @param view - Explicit settings view to activate (for example, `"account"` or `"security"`)
 * @param hideNav - When `true`, hides the settings navigation tabs
 * @param icons - Custom icons for the settings views
 * @returns A JSX element rendering the settings layout and the selected settings panel
 */
export function Settings({
	className,
	view,
	path,
	hideNav,
	icons,
}: SettingsProps) {
	const { authClient, basePaths, localization, viewPaths, Link, plugins } =
		useAuth();
	useAuthenticate(authClient);

	if (!view && !path) {
		throw new Error(
			'[Better Auth UI] Either `view` or `path` must be provided'
		);
	}

	const settingsPathViews = useMemo(
		() =>
			Object.fromEntries(
				Object.entries({
					...viewPaths.settings,
				}).map(([k, v]) => [v, k])
			) as Record<string, SettingsView>,
		[viewPaths.settings]
	);

	const currentView = view || (path ? settingsPathViews[path] : undefined);

	const castPlugins = plugins as (AuthPluginBase & {
		settingsTabs?: {
			id: string;
			viewPathSettingsKey: string;
			pluginLocalizationKey: string;
			component: React.ComponentType;
		}[];
	})[];

	const settingsTabsFromPlugins = castPlugins.flatMap((plugin) =>
		plugin.settingsTabs
			? plugin.settingsTabs.map((tab) => ({
					id: tab.id,
					viewPathSettingsKey: tab.viewPathSettingsKey,
					pluginLocalizationKey: tab.pluginLocalizationKey,
					component: tab.component,
				}))
			: []
	);

	const usesStandaloneLinkedAccountsView =
		'linkedAccounts' in viewPaths.settings &&
		typeof viewPaths.settings.linkedAccounts === 'string';

	const usesStandaloneSessionsView =
		'sessions' in viewPaths.settings &&
		typeof viewPaths.settings.sessions === 'string';

	const castViewPaths = viewPaths as ExtendedViewPaths;

	const preventDefaultHandler = (e: React.MouseEvent) => {
		e.preventDefault();
	};

	const TabsTriggerWithOverflow = ({
		children,
		...props
	}: React.ComponentProps<typeof TabsTrigger>) => (
		<TabsTrigger
			{...props}
			className={cn(
				'min-w-max select-none flex items-center justify-center gap-1.5',
				props.className
			)}
			onDragStart={preventDefaultHandler}
			onDrag={preventDefaultHandler}
			onDragEnd={preventDefaultHandler}
		>
			{children}
		</TabsTrigger>
	);

	const mergedIcons = { ...defaultSettingsIcons, ...icons };

	const RenderIcon = ({ view }: { view: ExtendedSettingsView | string }) => {
		const LucideIconComponent = mergedIcons[view as ExtendedSettingsView];

		if (!LucideIconComponent) {
			console.warn(
				`No icon found for view "${view}". Please provide an icon for this view in the "icons" prop.`
			);
			return null;
		}

		return <LucideIconComponent className="h-4! w-4! shrink-0 grow-0" />;
	};

	return (
		<Tabs
			value={currentView}
			className={cn('w-full gap-4 md:gap-6', className)}
		>
			<div className={cn(hideNav && 'hidden')}>
				<TabsList
					aria-label={localization.settings.settings}
					className="w-full flex flex-row flex-wrap items-start min-h-max"
				>
					<TabsTriggerWithOverflow value="account" asChild>
						<Link href={`${basePaths.settings}/${viewPaths.settings.account}`}>
							<RenderIcon view="account" />
							{localization.settings.account}
						</Link>
					</TabsTriggerWithOverflow>

					<TabsTriggerWithOverflow value="security" asChild>
						<Link href={`${basePaths.settings}/${viewPaths.settings.security}`}>
							<RenderIcon view="security" />
							{localization.settings.security}
						</Link>
					</TabsTriggerWithOverflow>

					{usesStandaloneLinkedAccountsView && (
						<TabsTriggerWithOverflow value="linkedAccounts" asChild>
							<Link
								href={`${basePaths.settings}/${castViewPaths.settings.linkedAccounts}`}
							>
								<RenderIcon view="linkedAccounts" />
								{'linkedAccounts' in localization.settings &&
								typeof localization.settings.linkedAccounts === 'string'
									? localization.settings.linkedAccounts
									: 'Connections'}
							</Link>
						</TabsTriggerWithOverflow>
					)}

					{usesStandaloneSessionsView && (
						<TabsTriggerWithOverflow value="sessions" asChild>
							<Link
								href={`${basePaths.settings}/${castViewPaths.settings.sessions}`}
							>
								<RenderIcon view="sessions" />
								{'sessions' in localization.settings &&
								typeof localization.settings.sessions === 'string'
									? localization.settings.sessions
									: 'Sessions'}
							</Link>
						</TabsTriggerWithOverflow>
					)}

					{settingsTabsFromPlugins.map((tab) => {
						const plugin = plugins.find((p) => p.id === tab.id);

						if (!plugin) {
							console.warn(
								`Plugin with id "${tab.id}" not found for settings tab.`
							);
							return null;
						}

						const localizationKey =
							tab.pluginLocalizationKey as keyof typeof localization;
						const localizedLabel = plugin.localization
							? plugin.localization[localizationKey] || tab.id
							: tab.id;

						if (typeof localizedLabel !== 'string') {
							console.warn(
								`Localization for key "${localizationKey}" not found in plugin "${plugin.id}".`
							);
							return null;
						}

						const viewPath =
							viewPaths.settings[
								tab.viewPathSettingsKey as keyof typeof viewPaths.settings
							];

						if (!viewPath) {
							console.warn(
								`View path for settings key "${tab.viewPathSettingsKey}" not found in viewPaths.settings.`
							);
							return null;
						}

						return (
							<TabsTriggerWithOverflow
								key={tab.id}
								value={tab.viewPathSettingsKey}
								asChild
							>
								<Link href={`${basePaths.settings}/${viewPath}`}>
									<RenderIcon view={tab.viewPathSettingsKey} />
									{localizedLabel}
								</Link>
							</TabsTriggerWithOverflow>
						);
					})}
				</TabsList>
			</div>

			<TabsContent value="account" tabIndex={-1}>
				<AccountSettings />
			</TabsContent>

			<TabsContent value="security" tabIndex={-1}>
				<SecuritySettings />
			</TabsContent>

			{usesStandaloneLinkedAccountsView && (
				<TabsContent value="linkedAccounts" tabIndex={-1}>
					<LinkedAccountSettings />
				</TabsContent>
			)}

			{usesStandaloneSessionsView && (
				<TabsContent value="sessions" tabIndex={-1}>
					<SessionsSettings />
				</TabsContent>
			)}

			{settingsTabsFromPlugins.map((tab) => {
				const viewPath =
					viewPaths.settings[
						tab.viewPathSettingsKey as keyof typeof viewPaths.settings
					];

				if (!viewPath) {
					console.warn(
						`View path for settings key "${tab.viewPathSettingsKey}" not found in viewPaths.settings. Skipping rendering of settings tab content for plugin "${tab.id}".`
					);
					return null;
				}

				return (
					<TabsContent
						key={tab.id}
						value={tab.viewPathSettingsKey}
						tabIndex={-1}
					>
						<tab.component />
					</TabsContent>
				);
			})}
		</Tabs>
	);
}
