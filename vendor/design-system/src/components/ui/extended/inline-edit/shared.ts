import React from 'react';

export type InlineEditorMode = 'single-line' | 'multiline';

export function useInlineSaveState<T>(value: T) {
	const [isEditing, setIsEditing] = React.useState(false);
	const [isSaving, setIsSaving] = React.useState(false);
	const [draft, setDraft] = React.useState(value);

	React.useEffect(() => {
		if (!isEditing) {
			setDraft(value);
		}
	}, [value, isEditing]);

	return {
		draft,
		isEditing,
		isSaving,
		setDraft,
		setIsEditing,
		setIsSaving,
	};
}

export function runHandlerAndContinue<E extends { defaultPrevented: boolean }>(
	event: E,
	handler: ((event: E) => void) | undefined,
	continuation: () => void
) {
	handler?.(event);
	if (!event.defaultPrevented) {
		continuation();
	}
}
