'use client';

import {
	type ApiKeyAuthClient,
	useAuth,
	useAuthPlugin,
	useListApiKeys,
} from '@better-auth-ui/react';
import { Button } from '@md-oss/design-system/components/ui/button';
import { Card, CardContent } from '@md-oss/design-system/components/ui/card';
import { Separator } from '@md-oss/design-system/components/ui/separator';
import { apiKeyPluginRef } from '@md-oss/design-system/lib/auth/plugin-refs';
import { cn } from '@md-oss/design-system/lib/utils';
import { useState } from 'react';
import { ApiKey } from './api-key';
import { ApiKeySkeleton } from './api-key-skeleton';
import { ApiKeysEmpty } from './api-keys-empty';
import { CreateApiKeyDialog } from './create-api-key-dialog';

export type ApiKeysProps = {
	className?: string;
};

export function ApiKeys({ className }: ApiKeysProps) {
	const { authClient } = useAuth();
	const { localization: apiKeyLocalization } = useAuthPlugin(apiKeyPluginRef);

	const { data: listData, isPending } = useListApiKeys(
		authClient as ApiKeyAuthClient
	);

	const [createOpen, setCreateOpen] = useState(false);

	return (
		<div className={cn('flex flex-col gap-3', className)}>
			<div className="flex items-end justify-between gap-3">
				<h2 className="truncate text-sm font-semibold">
					{apiKeyLocalization.apiKeys}
				</h2>

				<Button
					className="shrink-0"
					size="sm"
					disabled={isPending}
					onClick={() => setCreateOpen(true)}
				>
					{apiKeyLocalization.createApiKey}
				</Button>
			</div>

			<Card className="p-0">
				<CardContent className="p-0">
					{isPending ? (
						<ApiKeySkeleton />
					) : !listData?.apiKeys.length ? (
						<ApiKeysEmpty onCreatePress={() => setCreateOpen(true)} />
					) : (
						listData.apiKeys.map((key, index) => (
							<div key={key.id}>
								{index > 0 && <Separator />}

								<ApiKey apiKey={key} />
							</div>
						))
					)}
				</CardContent>
			</Card>

			<CreateApiKeyDialog open={createOpen} onOpenChange={setCreateOpen} />
		</div>
	);
}
