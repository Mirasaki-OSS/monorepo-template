'use client';

import { cn } from '@md-oss/design-system/lib/utils';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Textarea } from './textarea';

interface JSONEditorProps
	extends Omit<
		React.ComponentProps<typeof Textarea>,
		'value' | 'onChange' | 'onError'
	> {
	value?: unknown;
	onChange?: (value: unknown) => void;
	onJsonError?: (error: Error | null) => void;
}

function JSONEditor({
	value,
	onChange,
	onJsonError,
	className,
	...props
}: JSONEditorProps) {
	const externalStringValue = useMemo(() => {
		if (typeof value === 'string') {
			return value;
		}

		if (value === undefined) {
			return '';
		}

		return JSON.stringify(value, null, 2);
	}, [value]);

	const [textValue, setTextValue] = useState(externalStringValue);

	useEffect(() => {
		setTextValue(externalStringValue);
	}, [externalStringValue]);

	const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const text = event.target.value;
		setTextValue(text);

		if (!text.trim()) {
			onJsonError?.(null);
			onChange?.(null);
			return;
		}

		try {
			const parsed = JSON.parse(text);
			onJsonError?.(null);
			onChange?.(parsed);
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Invalid JSON');
			onJsonError?.(err);
		}
	};

	return (
		<Textarea
			data-slot="json-editor"
			{...props}
			value={textValue}
			onChange={handleChange}
			className={cn(
				'font-mono text-xs',
				props.disabled && 'cursor-not-allowed opacity-50',
				className
			)}
		/>
	);
}

export { JSONEditor, type JSONEditorProps };
