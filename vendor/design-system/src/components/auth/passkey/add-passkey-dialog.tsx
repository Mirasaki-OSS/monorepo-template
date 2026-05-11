'use client';

import {
	type PasskeyAuthClient,
	useAddPasskey,
	useAuth,
	useAuthPlugin,
} from '@better-auth-ui/react';
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from '@md-oss/design-system/components/ui/alert-dialog';
import { Button } from '@md-oss/design-system/components/ui/button';
import { Field, FieldError } from '@md-oss/design-system/components/ui/field';
import { Input } from '@md-oss/design-system/components/ui/input';
import { Label } from '@md-oss/design-system/components/ui/label';
import { Spinner } from '@md-oss/design-system/components/ui/spinner';
import { passkeyPluginRef } from '@md-oss/design-system/lib/auth/plugin-refs';
import { Fingerprint } from 'lucide-react';
import type { SyntheticEvent } from 'react';

export type AddPasskeyDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function AddPasskeyDialog({
	open,
	onOpenChange,
}: AddPasskeyDialogProps) {
	const { authClient, localization } = useAuth();
	const { localization: passkeyLocalization } = useAuthPlugin(passkeyPluginRef);

	const { mutate: addPasskey, isPending: isAdding } = useAddPasskey(
		authClient as PasskeyAuthClient
	);

	const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.target as HTMLFormElement);
		const name = (formData.get('name') as string)?.trim();

		addPasskey(name ? { name } : undefined, {
			onSuccess: () => onOpenChange(false),
		});
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<form onSubmit={handleSubmit} className="flex flex-col gap-6">
					<AlertDialogHeader>
						<AlertDialogMedia>
							<Fingerprint />
						</AlertDialogMedia>

						<AlertDialogTitle>
							{passkeyLocalization.addPasskey}
						</AlertDialogTitle>

						<AlertDialogDescription>
							{passkeyLocalization.passkeysDescription}
						</AlertDialogDescription>
					</AlertDialogHeader>

					<Field>
						<Label htmlFor="passkey-name">{passkeyLocalization.name}</Label>

						<Input
							id="passkey-name"
							name="name"
							autoFocus
							placeholder={localization.settings.optional}
							disabled={isAdding}
						/>

						<FieldError />
					</Field>

					<AlertDialogFooter>
						<AlertDialogCancel disabled={isAdding}>
							{localization.settings.cancel}
						</AlertDialogCancel>

						<Button type="submit" disabled={isAdding}>
							{isAdding && <Spinner />}

							{passkeyLocalization.addPasskey}
						</Button>
					</AlertDialogFooter>
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
