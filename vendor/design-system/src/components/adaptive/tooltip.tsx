'use client';

import {
	Popover,
	PopoverContent,
	type PopoverContentProps,
	type PopoverProps,
	PopoverTrigger,
	type PopoverTriggerProps,
} from '@md-oss/design-system/components/ui/popover';
import {
	Tooltip,
	TooltipContent,
	type TooltipContentProps,
	type TooltipProps,
	TooltipProvider,
	type TooltipProviderProps,
	TooltipTrigger,
	type TooltipTriggerProps,
} from '@md-oss/design-system/components/ui/tooltip';
import { useTouchContext } from '@md-oss/design-system/lib/context/touch';
import type React from 'react';

function AdaptiveTooltipProvider(
	props: TooltipProviderProps
): React.JSX.Element {
	return <TooltipProvider delayDuration={0} {...props} />;
}

function AdaptiveTooltip(
	props: TooltipProps & PopoverProps
): React.JSX.Element {
	const isTouch = useTouchContext();

	return isTouch ? <Popover {...props} /> : <Tooltip {...props} />;
}

function AdaptiveTooltipTrigger(
	props: TooltipTriggerProps & PopoverTriggerProps
): React.JSX.Element {
	const isTouch = useTouchContext();

	return isTouch ? (
		<PopoverTrigger {...props} />
	) : (
		<TooltipTrigger {...props} />
	);
}

function AdaptiveTooltipContent(
	props: TooltipContentProps & PopoverContentProps
): React.JSX.Element {
	const isTouch = useTouchContext();

	return isTouch ? (
		<PopoverContent {...props} />
	) : (
		<TooltipContent {...props} />
	);
}

export {
	AdaptiveTooltip,
	AdaptiveTooltipContent,
	AdaptiveTooltipProvider,
	AdaptiveTooltipTrigger,
};
