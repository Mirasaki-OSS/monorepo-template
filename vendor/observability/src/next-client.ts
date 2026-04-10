export function useLogger(
	service: string,
	componentOrAction: string
): {
	logger: Console;
	metadata: {
		service: string;
		component: string;
	};
} {
	return {
		logger: console,
		metadata: {
			service,
			component: componentOrAction,
		},
	};
}
