import { ResponsiveTooltipProvider } from '@md-oss/design-system/components/responsive/tooltip';
import { ThemeProvider } from '@md-oss/design-system/components/theme/provider';
import { TouchContextProvider } from '@md-oss/design-system/lib/context/touch';
import React from 'react';

type DesignSystemProviderProps = {
	children: React.ReactNode;
	themeProviderProps?: React.ComponentProps<typeof ThemeProvider>;
	tooltipProviderProps?: React.ComponentProps<typeof ResponsiveTooltipProvider>;
	useTouchContext?: boolean;
	useResponsiveTooltip?: boolean;
};

function DesignSystemProvider({
	children,
	themeProviderProps,
	tooltipProviderProps,
	useTouchContext = false,
	useResponsiveTooltip = false,
}: DesignSystemProviderProps) {
	const TouchContextComponent = useTouchContext
		? TouchContextProvider
		: React.Fragment;
	const TooltipProviderComponent = useResponsiveTooltip
		? ResponsiveTooltipProvider
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
