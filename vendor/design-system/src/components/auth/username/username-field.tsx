'use client';

import {
	type UsernameAuthClient,
	useAuth,
	useAuthPlugin,
	useIsUsernameAvailable,
} from '@better-auth-ui/react';
import type { AdditionalFieldProps } from '@md-oss/design-system/components/auth/additional-field';
import { Field, FieldError } from '@md-oss/design-system/components/ui/field';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@md-oss/design-system/components/ui/input-group';
import { Label } from '@md-oss/design-system/components/ui/label';
import { Spinner } from '@md-oss/design-system/components/ui/spinner';
import { usernamePlugin } from '@md-oss/design-system/lib/auth/username-plugin';
import { useDebouncer } from '@tanstack/react-pacer';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Renderer for the `username` additional field. Owns availability checking,
 * length limits, and visual indicators. `isInvalid` reflects only browser
 * validation (minLength, required, etc.) — availability feedback is shown
 * via the icon and `aria-label` without affecting the field's invalid state.
 */
export function UsernameField({
	name,
	field,
	isPending,
}: AdditionalFieldProps) {
	const { authClient } = useAuth();
	const {
		localization,
		minUsernameLength,
		maxUsernameLength,
		isUsernameAvailable: checkAvailability,
	} = useAuthPlugin(usernamePlugin);

	const currentUsername = String(field.defaultValue ?? '');
	const [value, setValue] = useState(currentUsername);
	const [error, setError] = useState<string>();

	const {
		mutate: requestAvailability,
		data: availability,
		error: availabilityError,
		reset: resetAvailability,
	} = useIsUsernameAvailable(authClient as UsernameAuthClient, {
		onError: () => {},
	});

	const debouncer = useDebouncer(
		(next: string) => {
			const trimmed = next.trim();
			if (!trimmed || trimmed === currentUsername) {
				resetAvailability();
				return;
			}

			requestAvailability({ username: trimmed });
		},
		{ wait: 500 }
	);

	function handleChange(next: string) {
		setValue(next);
		setError(undefined);
		resetAvailability();

		if (checkAvailability) {
			debouncer.maybeExecute(next);
		}
	}

	const isCheckingAvailability =
		!!checkAvailability && !!value.trim() && value.trim() !== currentUsername;

	return (
		<Field data-invalid={!!error}>
			<Label htmlFor={name}>{field.label}</Label>

			<InputGroup>
				<InputGroupInput
					id={name}
					name={name}
					type="text"
					autoComplete="username"
					minLength={minUsernameLength}
					maxLength={maxUsernameLength}
					disabled={isPending}
					required={field.required}
					readOnly={field.readOnly}
					value={value}
					onChange={(e) => handleChange(e.target.value)}
					onInvalid={(e) => {
						e.preventDefault();
						setError((e.target as HTMLInputElement).validationMessage);
					}}
					aria-invalid={!!error}
					placeholder={field.placeholder}
				/>

				{isCheckingAvailability && (
					<InputGroupAddon
						align="inline-end"
						aria-label={
							availability?.available
								? localization.usernameAvailable
								: availability?.available === false
									? localization.usernameTaken
									: undefined
						}
					>
						{availability?.available ? (
							<Check className="size-4 text-foreground" />
						) : availabilityError || availability?.available === false ? (
							<X className="size-4 text-destructive" />
						) : (
							<Spinner />
						)}
					</InputGroupAddon>
				)}
			</InputGroup>

			<FieldError>{error}</FieldError>
		</Field>
	);
}
