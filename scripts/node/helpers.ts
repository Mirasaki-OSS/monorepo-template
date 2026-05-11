// Note: Also included in @md-oss/common, but we want to avoid having local dependencies
// for @md-oss/scripts, because most other packages depend on it during dev+build

export const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
};
