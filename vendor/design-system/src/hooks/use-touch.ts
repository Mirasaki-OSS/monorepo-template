import * as React from 'react';

export function useIsTouchDevice(): [
	boolean | undefined,
	React.Dispatch<React.SetStateAction<boolean | undefined>>,
] {
	const [isTouchDevice, setIsTouchDevice] = React.useState<
		boolean | undefined
	>();

	React.useEffect(() => {
		setIsTouchDevice(
			Boolean(
				window.matchMedia('(pointer: coarse)').matches ||
					'ontouchstart' in window ||
					navigator.maxTouchPoints > 0
			)
		);
	}, []);

	return [isTouchDevice, setIsTouchDevice];
}
