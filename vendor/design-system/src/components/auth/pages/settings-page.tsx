import {
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import {
	dehydrate,
	HydrationBoundary,
	type QueryClient,
} from '@tanstack/react-query';
import { Settings } from '../settings/settings';
import {
	extendedViewPaths,
	mergeViewPaths,
	type PartialExtendedViewPaths,
} from './view-paths';

type SettingsPageProps = {
	path: string;
	queryClient: QueryClient;
	notFound: () => never;
	viewPaths?: PartialExtendedViewPaths;
	className?: string;
	classNames?: {
		settings?: string;
	};
	slotProps?: {
		settings?: WithAsComponent<React.ComponentPropsWithoutRef<typeof Settings>>;
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		hydrationBoundary?: WithAsComponent<
			React.ComponentPropsWithoutRef<typeof HydrationBoundary>
		>;
	};
};

export default async function SettingsPage({
	path,
	notFound,
	queryClient,
	className,
	classNames,
	slotProps,
	viewPaths: customViewPaths,
}: SettingsPageProps) {
	const mergedViewPaths = mergeViewPaths(extendedViewPaths, customViewPaths);

	if (!Object.values(mergedViewPaths.settings).includes(path)) {
		notFound();
		return null;
	}

	const [HydrationBoundaryEl, hydrationBoundarySlotProps] = resolveSlot(
		HydrationBoundary,
		slotProps?.hydrationBoundary
	);

	const hydrationBoundaryProps: React.ComponentPropsWithoutRef<
		typeof HydrationBoundary
	> = {
		state: dehydrate(queryClient),
		...hydrationBoundarySlotProps,
	};

	const [ContainerEl, containerSlotProps] = resolveSlot(
		'div',
		slotProps?.container
	);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{ className: 'w-full max-w-3xl mx-auto p-4 md:p-6' },
		containerSlotProps,
		className
	);

	const [SettingsEl, settingsSlotProps] = resolveSlot(
		Settings,
		slotProps?.settings
	);

	const settingsProps = mergePropsWithClassName(
		{ path },
		settingsSlotProps,
		classNames?.settings
	);

	return (
		<HydrationBoundaryEl {...hydrationBoundaryProps}>
			<ContainerEl {...containerProps}>
				<SettingsEl {...settingsProps} />
			</ContainerEl>
		</HydrationBoundaryEl>
	);
}
