import { AdaptiveTooltipProvider } from '@md-oss/design-system/components/adaptive/tooltip';
import { ThemeProvider } from '@md-oss/design-system/components/theme/provider';
import { TouchContextProvider } from '@md-oss/design-system/lib/context/touch';
import React from 'react';

type DesignSystemProviderProps = {
	children: React.ReactNode;
	themeProviderProps?: React.ComponentProps<typeof ThemeProvider>;
	tooltipProviderProps?: React.ComponentProps<typeof AdaptiveTooltipProvider>;
	useTouchContext?: boolean;
	useAdaptiveTooltip?: boolean;
};

function DesignSystemProvider({
	children,
	themeProviderProps,
	tooltipProviderProps,
	useTouchContext = false,
	useAdaptiveTooltip = false,
}: DesignSystemProviderProps) {
	const TouchContextComponent = useTouchContext
		? TouchContextProvider
		: React.Fragment;
	const TooltipProviderComponent = useAdaptiveTooltip
		? AdaptiveTooltipProvider
		: React.Fragment;

	return (
		<ThemeProvider {...themeProviderProps}>
			<TouchContextComponent>
				<TooltipProviderComponent {...tooltipProviderProps}>
					{children}
				</TooltipProviderComponent>
			</TouchContextComponent>
		</ThemeProvider>
	);
}

export { DesignSystemProvider, type DesignSystemProviderProps };
