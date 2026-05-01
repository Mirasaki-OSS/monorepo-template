import { parseError } from '@md-oss/common/http/guards';
import { requiredKeys } from '@md-oss/common/schemas/schema-object-form';
import { Loader } from '@md-oss/design-system/components/state/loader';
import { Badge } from '@md-oss/design-system/components/ui/badge';
import { Button } from '@md-oss/design-system/components/ui/button';
import { Callout } from '@md-oss/design-system/components/ui/extended/callout';
import { cn } from '@md-oss/design-system/lib/utils';
import { SaveIcon, Undo2Icon } from 'lucide-react';
import React, { useCallback, useEffect, useMemo } from 'react';
import type {
	SubmitErrorHandler,
	SubmitHandler,
	UseFormReturn,
} from 'react-hook-form';
import { toast } from 'sonner';
import type z from 'zod/v4';

export type FieldPath = string | number | symbol;

export type UseSchemaObjectFormControllerProps<Schema extends z.ZodObject> = {
	data: z.infer<Schema> | null;
	disabled?: boolean;
	onValid: SubmitHandler<z.infer<Schema>>;
	onInvalid?: SubmitErrorHandler<z.infer<Schema>>;
	onError?: (error: string) => void;
	omitSubmit?: boolean;
	omitReset?: boolean;
	children?: React.ReactNode;
	htmlFormProps?: Omit<
		React.HTMLAttributes<HTMLFormElement>,
		'onSubmit' | 'children'
	>;
};

export type CommonInputProps = React.InputHTMLAttributes<HTMLInputElement> &
	React.ButtonHTMLAttributes<HTMLButtonElement>;

export const commonInputProps = <Values extends Record<string, unknown>>(
	form: UseFormReturn<Values>,
	fieldName: keyof Values,
	placeholder: string | null,
	disabled: boolean
): CommonInputProps => {
	const fieldNameString = fieldName.toString();
	const error =
		form.formState.errors?.root?.message || form.formState.errors[fieldName];
	const base: CommonInputProps = {
		disabled,
		'aria-label':
			fieldNameString.charAt(0).toUpperCase() + fieldNameString.slice(1),
		'aria-invalid': !!error,
		'aria-describedby': `${fieldNameString}-helper`,
	};

	if (placeholder) {
		base.placeholder = placeholder;
	}

	if (disabled) {
		base['aria-disabled'] = true;
		base.className = 'pointer-events-none opacity-50';
		base.readOnly = true;
		base.tabIndex = -1;
		base.onFocus = (e) => {
			e.target?.blur();
		};
	}

	return base;
};

export interface UseSchemaObjectFormControllerReturn<
	Values extends Record<string, unknown>,
> {
	state: {
		getError: () => string | null;
		setError: (error: string | null) => void;
		handleFormValid: SubmitHandler<Values>;
		handleFormInvalid: SubmitErrorHandler<Values>;
		requiredKeys: string[];
	};
	onSubmit: (e?: React.BaseSyntheticEvent) => void;
	ModifiedBadge: React.FC<{ schemaKey: keyof Values; className?: string }>;
	RequiredIndicator: React.FC<{ schemaKey: keyof Values }>;
	RichLabel: React.FC<{
		schemaKey: keyof Values;
		children: React.ReactNode;
		className?: string;
		omitModifiedBadge?: boolean;
		omitRequiredIndicator?: boolean;
	}>;
	FormControls: React.FC;
	FormError: React.FC;
	wasFieldModified: (path: FieldPath | FieldPath[]) => boolean;
	commonInputProps: (
		name: keyof Values,
		placeholder?: string | null,
		disabled?: boolean
	) => CommonInputProps;
}

export const useSchemaObjectFormController = <Schema extends z.ZodObject>(
	form: UseFormReturn<z.infer<Schema>>,
	schema: Schema,
	options: {
		omitKeyDown?: boolean;
	} & Pick<
		UseSchemaObjectFormControllerProps<Schema>,
		| 'onValid'
		| 'onInvalid'
		| 'onError'
		| 'disabled'
		| 'omitReset'
		| 'omitSubmit'
	>,
	commonFieldOptions?: {
		disabled?: boolean;
	}
): UseSchemaObjectFormControllerReturn<z.infer<Schema>> => {
	type Values = z.infer<Schema>;
	type LocalReturn = UseSchemaObjectFormControllerReturn<Values>;
	const [formError, _setFormError] = React.useState<string | null>(null);
	const {
		omitKeyDown,
		disabled,
		omitReset,
		omitSubmit,
		onValid,
		onInvalid,
		onError,
	} = options;
	const usesControls = !omitSubmit || !omitReset;
	const {
		handleSubmit,
		formState: { isDirty, isSubmitting, dirtyFields },
	} = form;
	const requiredSchemaKeys = useMemo(() => requiredKeys(schema), [schema]);

	const setFormError = (error: string | null): void => {
		_setFormError(error);
		if (error) {
			toast.error('There was an issue', {
				description: error,
				duration: 5000,
			});
		}
	};

	const handleFormValid: SubmitHandler<Values> = useCallback(
		async (values, event) => {
			try {
				setFormError(null);
				await onValid(values, event);
				form.reset(values);
			} catch (err) {
				const parsed = parseError(
					err,
					'FORM_SUBMIT_FAILED',
					'There was an issue submitting the form.'
				);
				setFormError(parsed.body.message);
				onError?.(parsed.body.message);
			}
		},
		[onValid, form, onError]
	);

	const handleFormInvalid: SubmitErrorHandler<Values> = useCallback(
		(errors, event) => {
			const [key, error] = Object.entries(errors)[0] ?? [];
			if (key && error?.message) {
				setFormError(error.message.toString());
				const fieldElement = document.querySelector(`[name="${key}"]`) as
					| HTMLInputElement
					| HTMLTextAreaElement
					| HTMLSelectElement
					| null;
				if (fieldElement) {
					if ('focus' in fieldElement) {
						fieldElement.focus();
					}
					fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}
			onInvalid?.(errors, event);
		},
		[onInvalid]
	);

	const onSubmit = useCallback(
		(e?: React.BaseSyntheticEvent): void => {
			handleSubmit(handleFormValid, handleFormInvalid)(e);
		},
		[handleSubmit, handleFormValid, handleFormInvalid]
	);

	useEffect(() => {
		if (omitKeyDown) return;

		const onKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
				e.preventDefault();
				e.stopPropagation();
				onSubmit({
					...e,
					nativeEvent: e,
					isDefaultPrevented: () => false,
					isPropagationStopped: () => false,
					persist: () => {},
				});
			}
		};

		window.addEventListener('keydown', onKeyDown);

		return () => window.removeEventListener('keydown', onKeyDown);
	}, [onSubmit, omitKeyDown]);

	const isModified = (dirtyFields: unknown, path: FieldPath[]) => {
		if (!dirtyFields || typeof dirtyFields !== 'object') return false;

		const [key, ...rest] = path;

		if (!key || !(key in dirtyFields)) {
			return false;
		}

		const current = (dirtyFields as Record<FieldPath, unknown>)[key];

		if (rest.length === 0) {
			return current === true;
		}

		return isModified(current, rest);
	};

	const wasFieldModified: LocalReturn['wasFieldModified'] = (path) => {
		const pathArray = Array.isArray(path) ? path : [path];
		return isModified(dirtyFields, pathArray);
	};

	const ModifiedBadge: LocalReturn['ModifiedBadge'] = ({
		schemaKey,
		className,
	}) => {
		if (!wasFieldModified(schemaKey)) return null;
		return (
			<Badge
				size={'sm'}
				variant="secondary"
				className={cn(
					'h-3.5 p-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
					'text-[0.65rem] font-semibold',
					className
				)}
			>
				Modified
			</Badge>
		);
	};

	const RequiredIndicator: LocalReturn['RequiredIndicator'] = ({
		schemaKey,
	}) => {
		if (!requiredSchemaKeys.includes(schemaKey.toString())) return null;
		return <span className={cn('text-red-500')}>*</span>;
	};

	const RichLabel: LocalReturn['RichLabel'] = ({
		schemaKey,
		children,
		className,
		omitModifiedBadge = false,
		omitRequiredIndicator = false,
	}) => {
		return (
			<span className={cn('flex items-center gap-1', className)}>
				{children}
				{!omitRequiredIndicator && <RequiredIndicator schemaKey={schemaKey} />}
				{!omitModifiedBadge && <ModifiedBadge schemaKey={schemaKey} />}
			</span>
		);
	};

	const FormControls: LocalReturn['FormControls'] = () => {
		if (!usesControls) return null;
		return (
			<div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4')}>
				{!omitSubmit && (
					<Button
						type="submit"
						disabled={disabled || !isDirty || isSubmitting}
						aria-label="Submit form"
						aria-busy={isSubmitting}
					>
						{isSubmitting ? (
							<Loader />
						) : (
							<>
								<SaveIcon /> Submit
							</>
						)}
					</Button>
				)}
				{!omitReset && (
					<Button
						type="button"
						variant="outline"
						disabled={disabled || !isDirty || isSubmitting}
						onClick={() => form.reset()}
						aria-label="Reset form"
					>
						<Undo2Icon /> Reset
					</Button>
				)}
			</div>
		);
	};

	const FormError: LocalReturn['FormError'] = () => {
		if (!formError) return null;
		return (
			<Callout
				title="Form Error"
				variant="error"
				handleClose={() => setFormError(null)}
			>
				{formError}
			</Callout>
		);
	};

	return {
		state: {
			getError: (): string | null => formError,
			setError: setFormError,
			handleFormValid,
			handleFormInvalid,
			requiredKeys: requiredSchemaKeys,
		},
		onSubmit,
		ModifiedBadge,
		RequiredIndicator,
		RichLabel,
		FormControls,
		FormError,
		wasFieldModified,
		commonInputProps: (
			name: keyof Values,
			placeholder: string | null = null,
			disabled: boolean = commonFieldOptions?.disabled ?? false
		): CommonInputProps => commonInputProps(form, name, placeholder, disabled),
	};
};
