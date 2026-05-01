'use client';

import {
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import React from 'react';

type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const BREAKPOINT_VISIBILITY: Record<BreakpointKey, string> = {
	xs: 'block sm:hidden',
	sm: 'hidden sm:block md:hidden',
	md: 'hidden md:block lg:hidden',
	lg: 'hidden lg:block xl:hidden',
	xl: 'hidden xl:block 2xl:hidden',
	'2xl': 'hidden 2xl:block',
};

const BREAKPOINT_ORDER: BreakpointKey[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

function formatFps(value: number) {
	if (!Number.isFinite(value)) {
		return '-- FPS';
	}

	return `${value.toFixed(1)} FPS`;
}

function getFpsToneClassName(value: number) {
	if (value >= 55) {
		return 'text-emerald-300';
	}

	if (value >= 30) {
		return 'text-amber-300';
	}

	return 'text-rose-300';
}

export type TailwindIndicatorProps = {
	className?: string;
	classNames?: {
		label?: string;
	};
	labels?: Partial<Record<BreakpointKey, React.ReactNode>>;
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		label?: React.HTMLAttributes<HTMLSpanElement>;
	};
};

export function TailwindIndicator({
	className,
	classNames,
	labels,
	slotProps,
}: TailwindIndicatorProps): React.JSX.Element {
	const [ContainerEl, containerSlotProps] = resolveSlot(
		'div',
		slotProps?.container
	);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			'aria-label': 'Current Tailwind breakpoint',
			className:
				'inline-flex items-center rounded-full border border-white/12 bg-neutral-950/85 px-3 py-1.5 font-mono text-[11px] font-medium tracking-[0.18em] text-white shadow-[0_12px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md supports-[backdrop-filter]:bg-neutral-950/70',
		},
		containerSlotProps,
		className
	);

	const labelProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLSpanElement>
	>(
		{ className: 'uppercase text-white/90' },
		slotProps?.label,
		classNames?.label
	);

	return (
		<ContainerEl {...containerProps}>
			{BREAKPOINT_ORDER.map((breakpoint) => (
				<span
					key={breakpoint}
					{...labelProps}
					className={`${labelProps.className ?? ''} ${BREAKPOINT_VISIBILITY[breakpoint]}`.trim()}
				>
					{labels?.[breakpoint] ?? breakpoint}
				</span>
			))}
		</ContainerEl>
	);
}

export type FPSCounterProps = {
	className?: string;
	classNames?: {
		value?: string;
	};
	updateIntervalMs?: number;
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		value?: React.HTMLAttributes<HTMLSpanElement>;
	};
};

export function FPSCounter({
	className,
	classNames,
	updateIntervalMs = 1000,
	slotProps,
}: FPSCounterProps): React.JSX.Element {
	const [fps, setFps] = React.useState(0);
	const lastFrameTimeRef = React.useRef<number | null>(null);
	const frameCountRef = React.useRef(0);
	const lastSampleTimeRef = React.useRef<number | null>(null);

	const onFrame = React.useEffectEvent((timestamp: number) => {
		if (lastFrameTimeRef.current === null) {
			lastFrameTimeRef.current = timestamp;
			lastSampleTimeRef.current = timestamp;
			return;
		}

		frameCountRef.current += 1;

		if (
			lastSampleTimeRef.current !== null &&
			timestamp - lastSampleTimeRef.current >= updateIntervalMs
		) {
			const elapsedSeconds = (timestamp - lastSampleTimeRef.current) / 1000;
			setFps(frameCountRef.current / elapsedSeconds);
			frameCountRef.current = 0;
			lastSampleTimeRef.current = timestamp;
		}

		lastFrameTimeRef.current = timestamp;
	});

	React.useEffect(() => {
		let animationFrameId = 0;

		const tick = (timestamp: number) => {
			onFrame(timestamp);
			animationFrameId = window.requestAnimationFrame(tick);
		};

		animationFrameId = window.requestAnimationFrame(tick);

		return () => {
			window.cancelAnimationFrame(animationFrameId);
		};
	}, [onFrame]);

	const [ContainerEl, containerSlotProps] = resolveSlot(
		'div',
		slotProps?.container
	);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			'aria-live': 'off',
			className:
				'inline-flex items-center gap-2 rounded-full border border-white/12 bg-neutral-950/85 px-3 py-1.5 font-mono text-[11px] font-medium tracking-[0.16em] text-white/70 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md supports-[backdrop-filter]:bg-neutral-950/70',
		},
		containerSlotProps,
		className
	);

	const valueProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLSpanElement>
	>(
		{
			className: `tabular-nums uppercase ${getFpsToneClassName(fps)}`,
		},
		slotProps?.value,
		classNames?.value
	);

	return (
		<ContainerEl {...containerProps}>
			<span className="text-white/45">Perf</span>
			<span {...valueProps}>{formatFps(fps)}</span>
		</ContainerEl>
	);
}

export type DevUtilitiesProps = {
	enabled?: boolean;
	className?: string;
	classNames?: {
		tailwindIndicator?: string;
		fpsCounter?: string;
	};
	hideTailwindIndicator?: boolean;
	hideFPSCounter?: boolean;
	tailwindIndicatorProps?: Omit<TailwindIndicatorProps, 'className'>;
	fpsCounterProps?: Omit<FPSCounterProps, 'className'>;
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
	};
};

export function DevUtilities({
	enabled = false,
	className,
	classNames,
	hideTailwindIndicator = false,
	hideFPSCounter = false,
	tailwindIndicatorProps,
	fpsCounterProps,
	slotProps,
}: DevUtilitiesProps): React.JSX.Element | null {
	if (!enabled) {
		return null;
	}

	const [ContainerEl, containerSlotProps] = resolveSlot(
		'div',
		slotProps?.container
	);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className:
				'pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2',
		},
		containerSlotProps,
		className
	);

	if (hideTailwindIndicator && hideFPSCounter) {
		return null;
	}

	return (
		<ContainerEl {...containerProps}>
			{!hideFPSCounter && (
				<FPSCounter {...fpsCounterProps} className={classNames?.fpsCounter} />
			)}
			{!hideTailwindIndicator && (
				<TailwindIndicator
					{...tailwindIndicatorProps}
					className={classNames?.tailwindIndicator}
				/>
			)}
		</ContainerEl>
	);
}
