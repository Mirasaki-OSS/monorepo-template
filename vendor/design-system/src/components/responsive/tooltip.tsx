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
	type TooltipProps,
	TooltipProvider,
	type TooltipProviderProps,
	TooltipTrigger,
	type TooltipTriggerProps,
} from '@md-oss/design-system/components/ui/tooltip';
import { useTouchContext } from '@md-oss/design-system/lib/context/touch';
import type { TooltipContentProps } from 'recharts';

const ResponsiveTooltipProvider = (props: TooltipProviderProps) => {
	return <TooltipProvider delayDuration={0} {...props} />;
};

const ResponsiveTooltip = (props: TooltipProps & PopoverProps) => {
	const isTouch = useTouchContext();

	return isTouch ? <Popover {...props} /> : <Tooltip {...props} />;
};

const ResponsiveTooltipTrigger = (
	props: TooltipTriggerProps & PopoverTriggerProps
) => {
	const isTouch = useTouchContext();

	return isTouch ? (
		<PopoverTrigger {...props} />
	) : (
		<TooltipTrigger {...props} />
	);
};

const ResponsiveTooltipContent = (
	props: TooltipContentProps & PopoverContentProps
) => {
	const isTouch = useTouchContext();

	return isTouch ? (
		<PopoverContent {...props} />
	) : (
		<TooltipContent {...props} />
	);
};

export {
	ResponsiveTooltip,
	ResponsiveTooltipContent,
	ResponsiveTooltipProvider,
	ResponsiveTooltipTrigger,
};
