'use client';

import {
	type ApiKeyAuthClient,
	type ListedApiKey,
	useAuth,
	useAuthPlugin,
	useDeleteApiKey,
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
import { Field } from '@md-oss/design-system/components/ui/field';
import { Input } from '@md-oss/design-system/components/ui/input';
import { Label } from '@md-oss/design-system/components/ui/label';
import { Spinner } from '@md-oss/design-system/components/ui/spinner';
import { apiKeyPluginRef } from '@md-oss/design-system/lib/auth/plugin-refs';
import { Key } from 'lucide-react';

export type DeleteApiKeyDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	apiKey: ListedApiKey;
};

export function DeleteApiKeyDialog({
	open,
	onOpenChange,
	apiKey,
}: DeleteApiKeyDialogProps) {
	const { authClient, localization } = useAuth();
	const { localization: apiKeyLocalization } = useAuthPlugin(apiKeyPluginRef);
	const preview = `${apiKey.start}${'*'.repeat(16)}`;
	const previewId = `delete-api-key-preview-${apiKey.id}`;
	const { mutate: deleteApiKey, isPending: isDeleting } = useDeleteApiKey(
		authClient as ApiKeyAuthClient,
		{
			onSuccess: () => onOpenChange(false),
		}
	);

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogMedia>
						<Key />
					</AlertDialogMedia>

					<AlertDialogTitle>{apiKeyLocalization.deleteApiKey}</AlertDialogTitle>

					<AlertDialogDescription>
						{apiKeyLocalization.deleteApiKeyWarning}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<Field>
					<Label htmlFor={previewId}>
						{apiKey.name || apiKeyLocalization.apiKey}
					</Label>

					<Input
						id={previewId}
						value={preview}
						readOnly
						className="font-mono text-xs"
						disabled
					/>
				</Field>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>
						{localization.settings.cancel}
					</AlertDialogCancel>

					<Button
						type="button"
						variant="destructive"
						disabled={isDeleting}
						onClick={() => deleteApiKey({ keyId: apiKey.id })}
					>
						{isDeleting && <Spinner />}

						{apiKeyLocalization.deleteApiKey}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
