'use client';

import {
	type ApiKeyAuthClient,
	useAuth,
	useAuthPlugin,
	useCreateApiKey,
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
import { apiKeyPluginRef } from '@md-oss/design-system/lib/auth/plugin-refs';
import { Key } from 'lucide-react';
import { type SyntheticEvent, useState } from 'react';
import { NewApiKeyDialog } from './new-api-key-dialog';

export type CreateApiKeyDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreateApiKeyDialog({
	open,
	onOpenChange,
}: CreateApiKeyDialogProps) {
	const { authClient, localization } = useAuth();
	const { localization: apiKeyLocalization } = useAuthPlugin(apiKeyPluginRef);

	const { mutate: createApiKey, isPending: isCreating } = useCreateApiKey(
		authClient as ApiKeyAuthClient
	);

	const [isNewKeyDialogOpen, setIsNewKeyDialogOpen] = useState(false);
	const [keyName, setKeyName] = useState<string | null>(null);
	const [secretKey, setSecretKey] = useState<string | null>(null);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			setKeyName(null);
			setSecretKey(null);
		}

		onOpenChange(nextOpen);
	};

	const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.target as HTMLFormElement);
		const name = (formData.get('name') as string).trim();

		createApiKey(name ? { name } : undefined, {
			onSuccess: (result) => {
				handleOpenChange(false);
				setKeyName(name);
				setSecretKey(result.key);
				setIsNewKeyDialogOpen(true);
			},
		});
	};

	return (
		<>
			<AlertDialog open={open} onOpenChange={handleOpenChange}>
				<AlertDialogContent>
					<form onSubmit={handleSubmit} className="flex flex-col gap-6">
						<AlertDialogHeader>
							<AlertDialogMedia>
								<Key />
							</AlertDialogMedia>

							<AlertDialogTitle>
								{apiKeyLocalization.createApiKey}
							</AlertDialogTitle>

							<AlertDialogDescription>
								{apiKeyLocalization.apiKeysDescription}
							</AlertDialogDescription>
						</AlertDialogHeader>

						<Field>
							<Label htmlFor="api-key-name">{apiKeyLocalization.name}</Label>

							<Input
								id="api-key-name"
								name="name"
								autoFocus
								placeholder={localization.settings.optional}
								disabled={isCreating}
							/>

							<FieldError />
						</Field>

						<AlertDialogFooter>
							<AlertDialogCancel disabled={isCreating}>
								{localization.settings.cancel}
							</AlertDialogCancel>

							<Button type="submit" disabled={isCreating}>
								{isCreating && <Spinner />}

								{apiKeyLocalization.createApiKey}
							</Button>
						</AlertDialogFooter>
					</form>
				</AlertDialogContent>
			</AlertDialog>

			<NewApiKeyDialog
				open={isNewKeyDialogOpen}
				onOpenChange={setIsNewKeyDialogOpen}
				secretKey={secretKey}
				name={keyName}
			/>
		</>
	);
}
