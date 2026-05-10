import {
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import type React from 'react';
import { Auth } from '../auth';
import {
	extendedViewPaths,
	mergeViewPaths,
	type PartialExtendedViewPaths,
} from './view-paths';

type AuthPageProps = {
	path: string;
	className?: string;
	notFound: () => never;
	viewPaths?: PartialExtendedViewPaths;
	classNames?: {
		auth?: string;
	};
	slotProps?: {
		auth?: WithAsComponent<React.ComponentPropsWithoutRef<typeof Auth>>;
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
	};
};

export default async function AuthPage({
	path,
	className,
	notFound,
	slotProps,
	classNames,
	viewPaths: customViewPaths,
}: AuthPageProps) {
	const mergedViewPaths = mergeViewPaths(extendedViewPaths, customViewPaths);

	if (!Object.values(mergedViewPaths.auth).includes(path)) {
		notFound();
		return null;
	}

	const [ContainerEl, containerSlotProps] = resolveSlot(
		'div',
		slotProps?.container
	);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{ className: 'flex justify-center my-auto p-4 md:p-6' },
		containerSlotProps,
		className
	);

	const [AuthEl, authSlotProps] = resolveSlot(Auth, slotProps?.auth);

	const authProps = mergePropsWithClassName(
		{ className: 'w-full max-w-md', path },
		authSlotProps,
		classNames?.auth
	);

	return (
		<ContainerEl {...containerProps}>
			<AuthEl {...authProps} />
		</ContainerEl>
	);
}
