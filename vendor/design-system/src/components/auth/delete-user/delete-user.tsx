'use client';

import { authQueryKeys } from '@better-auth-ui/core';
import {
	useAuth,
	useAuthPlugin,
	useDeleteUser,
	useListAccounts,
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
	AlertDialogTrigger,
} from '@md-oss/design-system/components/ui/alert-dialog';
import { Button } from '@md-oss/design-system/components/ui/button';
import { Card, CardContent } from '@md-oss/design-system/components/ui/card';
import { Field, FieldError } from '@md-oss/design-system/components/ui/field';
import { Input } from '@md-oss/design-system/components/ui/input';
import { Label } from '@md-oss/design-system/components/ui/label';
import { Spinner } from '@md-oss/design-system/components/ui/spinner';
import { deleteUserPluginRef } from '@md-oss/design-system/lib/auth/plugin-refs';
import { cn } from '@md-oss/design-system/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { type SyntheticEvent, useState } from 'react';
import { toast } from 'sonner';

export type DeleteUserProps = {
	className?: string;
};

/**
 * Danger-zone card to delete the authenticated account, with a confirmation dialog and toasts.
 */
export function DeleteUser({ className }: DeleteUserProps) {
	const { authClient, basePaths, localization, viewPaths, navigate } =
		useAuth();

	const {
		localization: deleteUserLocalization,
		sendDeleteAccountVerification,
	} = useAuthPlugin(deleteUserPluginRef);

	const { data: accounts } = useListAccounts(authClient);

	const queryClient = useQueryClient();

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [password, setPassword] = useState('');

	const hasCredentialAccount = accounts?.some(
		(account) => account.providerId === 'credential'
	);
	const needsPassword = !sendDeleteAccountVerification && hasCredentialAccount;

	const { mutate: deleteUser, isPending } = useDeleteUser(authClient);

	const handleDialogOpenChange = (open: boolean) => {
		setConfirmOpen(open);
		setPassword('');
	};

	const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();

		const params = {
			...(needsPassword ? { password } : {}),
		};

		deleteUser(params, {
			onSuccess: () => {
				setConfirmOpen(false);
				setPassword('');

				if (sendDeleteAccountVerification) {
					toast.success(deleteUserLocalization.deleteUserVerificationSent);
				} else {
					toast.success(deleteUserLocalization.deleteUserSuccess);
					queryClient.removeQueries({ queryKey: authQueryKeys.all });
					navigate({
						to: `${basePaths.auth}/${viewPaths.auth.signIn}`,
						replace: true,
					});
				}
			},
		});
	};

	return (
		<Card className={cn('border-destructive', className)}>
			<CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-medium leading-tight">
						{deleteUserLocalization.deleteUser}
					</p>

					<p className="text-muted-foreground text-xs mt-0.5">
						{deleteUserLocalization.deleteUserDescription}
					</p>
				</div>

				<AlertDialog open={confirmOpen} onOpenChange={handleDialogOpenChange}>
					<AlertDialogTrigger asChild>
						<Button variant="destructive" size="sm" disabled={!accounts}>
							{deleteUserLocalization.deleteUser}
						</Button>
					</AlertDialogTrigger>

					<AlertDialogContent>
						<form onSubmit={handleSubmit} className="flex flex-col gap-6">
							<AlertDialogHeader>
								<AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
									<TriangleAlert />
								</AlertDialogMedia>

								<AlertDialogTitle>
									{deleteUserLocalization.deleteUser}
								</AlertDialogTitle>

								<AlertDialogDescription>
									{deleteUserLocalization.deleteUserDescription}
								</AlertDialogDescription>
							</AlertDialogHeader>

							{needsPassword && (
								<Field>
									<Label htmlFor="delete-password">
										{localization.auth.password}
									</Label>

									<Input
										id="delete-password"
										name="password"
										type="password"
										autoComplete="current-password"
										placeholder={localization.auth.passwordPlaceholder}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										disabled={isPending}
										required
									/>

									<FieldError />
								</Field>
							)}

							<AlertDialogFooter>
								<AlertDialogCancel disabled={isPending}>
									{localization.settings.cancel}
								</AlertDialogCancel>

								<Button
									type="submit"
									variant="destructive"
									disabled={isPending}
								>
									{isPending && <Spinner />}

									{deleteUserLocalization.deleteUser}
								</Button>
							</AlertDialogFooter>
						</form>
					</AlertDialogContent>
				</AlertDialog>
			</CardContent>
		</Card>
	);
}
