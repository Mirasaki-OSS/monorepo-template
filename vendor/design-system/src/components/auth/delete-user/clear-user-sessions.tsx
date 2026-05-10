'use client';

import { authQueryKeys } from '@better-auth-ui/core';
import { useAuth, useAuthPlugin, useListAccounts } from '@better-auth-ui/react';
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
import { Spinner } from '@md-oss/design-system/components/ui/spinner';
import { clearUserSessionsPlugin } from '@md-oss/design-system/lib/auth/clear-user-sessions-plugin';
import { useClearUserSessions } from '@md-oss/design-system/lib/auth/mutations/clear-sessions-mutation';
import { cn } from '@md-oss/design-system/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { type SyntheticEvent, useState } from 'react';
import { toast } from 'sonner';

export type ClearUserSessionProps = {
	className?: string;
};

/**
 * Danger-zone card to clear all user sessions, with a confirmation dialog and toasts.
 */
export function ClearUserSessions({ className }: ClearUserSessionProps) {
	const { authClient, basePaths, localization, viewPaths, navigate } =
		useAuth();

	const { localization: clearUserSessionsLocalization, clearCurrentSession } =
		useAuthPlugin(clearUserSessionsPlugin);

	const { data: accounts } = useListAccounts(authClient);

	const queryClient = useQueryClient();

	const [confirmOpen, setConfirmOpen] = useState(false);

	const { mutate: clearUserSessions, isPending } =
		useClearUserSessions(authClient);

	const handleDialogOpenChange = (open: boolean) => {
		setConfirmOpen(open);
	};

	const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();

		clearUserSessions(
			{},
			{
				onSuccess: () => {
					setConfirmOpen(false);

					if (clearCurrentSession) {
						toast.success(
							clearUserSessionsLocalization.clearUserSessionsSuccess
						);
						queryClient.removeQueries({ queryKey: authQueryKeys.all });
						navigate({
							to: `${basePaths.auth}/${viewPaths.auth.signIn}`,
							replace: true,
						});
					} else {
						toast.success(
							clearUserSessionsLocalization.clearUserSessionsSuccess
						);
					}
				},
			}
		);
	};

	return (
		<Card className={cn('border-destructive', className)}>
			<CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-medium leading-tight">
						{clearUserSessionsLocalization.clearSessions}
					</p>

					<p className="text-muted-foreground text-xs mt-0.5">
						{clearUserSessionsLocalization.clearUserSessionsDescription}
					</p>
				</div>

				<AlertDialog open={confirmOpen} onOpenChange={handleDialogOpenChange}>
					<AlertDialogTrigger asChild>
						<Button variant="destructive" size="sm" disabled={!accounts}>
							{clearUserSessionsLocalization.clearSessions}
						</Button>
					</AlertDialogTrigger>

					<AlertDialogContent>
						<form onSubmit={handleSubmit} className="flex flex-col gap-6">
							<AlertDialogHeader>
								<AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
									<TriangleAlert />
								</AlertDialogMedia>

								<AlertDialogTitle>
									{clearUserSessionsLocalization.clearSessions}
								</AlertDialogTitle>

								<AlertDialogDescription>
									{clearUserSessionsLocalization.clearUserSessionsDescription}
								</AlertDialogDescription>
							</AlertDialogHeader>

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

									{clearUserSessionsLocalization.clearSessions}
								</Button>
							</AlertDialogFooter>
						</form>
					</AlertDialogContent>
				</AlertDialog>
			</CardContent>
		</Card>
	);
}
