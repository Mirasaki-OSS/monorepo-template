'use client';

import {
	cn,
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import { m, useReducedMotion } from 'motion/react';
import React from 'react';

type AmbientBlobTone = 'rose' | 'cyan' | 'violet' | 'amber' | 'emerald';
type AmbientBlobSize = 'sm' | 'md' | 'lg' | 'xl';
type AmbientBlobIntensity = 'soft' | 'medium' | 'strong';
type AmbientBlobDrift = 'horizontal' | 'vertical';

const TONE_CLASS_NAMES: Record<AmbientBlobTone, string> = {
	rose: 'bg-gradient-to-br from-rose-400/80 via-fuchsia-400/55 to-orange-300/20 dark:from-rose-500/55 dark:via-fuchsia-600/35 dark:to-orange-400/10',
	cyan: 'bg-gradient-to-br from-cyan-300/75 via-sky-400/55 to-blue-500/20 dark:from-cyan-400/55 dark:via-sky-500/35 dark:to-blue-600/10',
	violet:
		'bg-gradient-to-br from-violet-400/75 via-purple-500/55 to-indigo-500/20 dark:from-violet-500/50 dark:via-purple-600/35 dark:to-indigo-600/10',
	amber:
		'bg-gradient-to-br from-amber-300/80 via-orange-400/50 to-yellow-200/20 dark:from-amber-400/55 dark:via-orange-500/35 dark:to-yellow-300/10',
	emerald:
		'bg-gradient-to-br from-emerald-300/75 via-teal-400/55 to-cyan-300/20 dark:from-emerald-400/55 dark:via-teal-500/35 dark:to-cyan-400/10',
};

const SIZE_CLASS_NAMES: Record<AmbientBlobSize, string> = {
	sm: 'size-44',
	md: 'size-64',
	lg: 'size-80',
	xl: 'size-[26rem]',
};

const INTENSITY_CLASS_NAMES: Record<AmbientBlobIntensity, string> = {
	soft: 'opacity-45',
	medium: 'opacity-60',
	strong: 'opacity-75',
};

const DRIFT_DISTANCE: Record<AmbientBlobIntensity, number> = {
	soft: 36,
	medium: 64,
	strong: 92,
};

const DEFAULT_BLOBS: AmbientBlobDefinition[] = [
	{
		id: 'rose-corner',
		tone: 'rose',
		size: 'xl',
		intensity: 'medium',
		drift: 'horizontal',
		delayMs: 0,
		durationMs: 36000,
		style: { top: '-8rem', left: '-7rem' },
	},
	{
		id: 'cyan-edge',
		tone: 'cyan',
		size: 'lg',
		intensity: 'soft',
		drift: 'vertical',
		delayMs: 2800,
		durationMs: 42000,
		style: { top: '42%', left: '-8rem' },
	},
	{
		id: 'violet-corner',
		tone: 'violet',
		size: 'lg',
		intensity: 'strong',
		drift: 'horizontal',
		delayMs: 5200,
		durationMs: 40000,
		style: { right: '-5rem', bottom: '-7rem' },
		className: '-translate-x-[22%]',
	},
];

function createBlobMotionKeyframes(
	drift: AmbientBlobDrift,
	intensity: AmbientBlobIntensity
) {
	const primaryDistance = DRIFT_DISTANCE[intensity];
	const secondaryDistance = Math.round(primaryDistance * 0.45);

	const xOffsets =
		drift === 'horizontal'
			? [0, primaryDistance, -Math.round(primaryDistance * 0.55), 0]
			: [0, -secondaryDistance, secondaryDistance, 0];
	const yOffsets =
		drift === 'vertical'
			? [0, primaryDistance, -Math.round(primaryDistance * 0.55), 0]
			: [0, -secondaryDistance, secondaryDistance, 0];

	return {
		x: xOffsets,
		y: yOffsets,
		rotate: [0, 120, 240, 360],
		scale: [0.72, 1, 1.08, 0.84],
		opacity: [0.14, 0.28, 0.22, 0.1],
	};
}

export type AmbientBlobProps = {
	className?: string;
	classNames?: {
		glow?: string;
		ring?: string;
	};
	tone?: AmbientBlobTone;
	size?: AmbientBlobSize;
	intensity?: AmbientBlobIntensity;
	drift?: AmbientBlobDrift;
	durationMs?: number;
	delayMs?: number;
	style?: React.CSSProperties;
	slotProps?: {
		container?: React.HTMLAttributes<HTMLDivElement>;
		glow?: React.HTMLAttributes<HTMLDivElement>;
		ring?: React.HTMLAttributes<HTMLDivElement>;
	};
};

export function AmbientBlob({
	className,
	classNames,
	tone = 'violet',
	size = 'lg',
	intensity = 'medium',
	drift = 'horizontal',
	durationMs = 36000,
	delayMs = 0,
	style,
	slotProps,
}: AmbientBlobProps): React.JSX.Element {
	const prefersReducedMotion = useReducedMotion();
	const keyframes = React.useMemo(
		() => createBlobMotionKeyframes(drift, intensity),
		[drift, intensity]
	);
	const firstX = keyframes.x[0] ?? 0;
	const firstY = keyframes.y[0] ?? 0;
	const firstRotate = keyframes.rotate[0] ?? 0;
	const firstScale = keyframes.scale[0] ?? 0.72;
	const firstOpacity = keyframes.opacity[0] ?? 0.14;

	const motionInitial = prefersReducedMotion
		? {
				x: 0,
				y: 0,
				rotate: 0,
				scale: 1,
				opacity: 1,
			}
		: {
				x: firstX,
				y: firstY,
				rotate: firstRotate,
				scale: firstScale,
				opacity: firstOpacity,
			};

	const motionAnimate = prefersReducedMotion
		? undefined
		: {
				x: keyframes.x,
				y: keyframes.y,
				rotate: keyframes.rotate,
				scale: keyframes.scale,
				opacity: keyframes.opacity,
			};

	const motionTransition = prefersReducedMotion
		? undefined
		: {
				duration: durationMs / 1000,
				delay: delayMs / 1000,
				repeat: Number.POSITIVE_INFINITY,
				ease: 'easeInOut' as const,
				times: [0, 1 / 3, 2 / 3, 1],
			};

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			'aria-hidden': true,
			className:
				'pointer-events-none absolute isolate rounded-full will-change-transform',
			style,
		},
		slotProps?.container,
		SIZE_CLASS_NAMES[size],
		className
	);

	const glowProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className: cn(
				'absolute inset-0 rounded-full blur-3xl saturate-150',
				'mix-blend-screen dark:mix-blend-lighten',
				TONE_CLASS_NAMES[tone],
				INTENSITY_CLASS_NAMES[intensity]
			),
		},
		slotProps?.glow,
		classNames?.glow
	);

	const ringProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className:
				'absolute inset-[14%] rounded-full border border-white/18 bg-white/[0.03] backdrop-blur-[2px] dark:border-white/10 dark:bg-white/[0.02]',
		},
		slotProps?.ring,
		classNames?.ring
	);

	return (
		<div {...containerProps}>
			<m.div
				className="absolute inset-0 rounded-full will-change-transform"
				initial={motionInitial}
				animate={motionAnimate}
				transition={motionTransition}
			>
				<div {...glowProps} />
				<div {...ringProps} />
			</m.div>
		</div>
	);
}

export type AmbientBlobDefinition = AmbientBlobProps & {
	id?: string;
};

export type AmbientBlobFieldProps = {
	className?: string;
	classNames?: {
		blob?: string;
	};
	blobs?: AmbientBlobDefinition[];
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
	};
};

export function AmbientBlobField({
	className,
	classNames,
	blobs = DEFAULT_BLOBS,
	slotProps,
}: AmbientBlobFieldProps): React.JSX.Element {
	const [ContainerEl, containerSlotProps] = resolveSlot(
		'div',
		slotProps?.container
	);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			'aria-hidden': true,
			className: 'pointer-events-none fixed inset-0 -z-10 overflow-hidden',
		},
		containerSlotProps,
		className
	);

	return (
		<ContainerEl {...containerProps}>
			{blobs.map(({ id, className: blobClassName, ...blobProps }, index) => (
				<AmbientBlob
					key={id ?? index}
					{...blobProps}
					className={cn(classNames?.blob, blobClassName)}
				/>
			))}
		</ContainerEl>
	);
}
