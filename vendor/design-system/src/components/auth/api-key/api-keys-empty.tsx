'use client';

import { useAuthPlugin } from '@better-auth-ui/react';
import { Button } from '@md-oss/design-system/components/ui/button';
import { Card, CardContent } from '@md-oss/design-system/components/ui/card';
import { apiKeyPlugin } from '@md-oss/design-system/lib/auth/api-key-plugin';
import { Key } from 'lucide-react';

export type ApiKeysEmptyProps = {
	onCreatePress: () => void;
};

export function ApiKeysEmpty({ onCreatePress }: ApiKeysEmptyProps) {
	const { localization: apiKeyLocalization } = useAuthPlugin(apiKeyPlugin);

	return (
		<Card className="bg-transparent border-0 ring-0 shadow-none">
			<CardContent className="flex flex-col items-center justify-center gap-4">
				<div className="flex size-10 items-center justify-center rounded-md bg-muted">
					<Key className="size-4.5" />
				</div>

				<div className="flex flex-col items-center justify-center gap-1 text-center">
					<p className="text-sm font-semibold">
						{apiKeyLocalization.noApiKeys}
					</p>

					<p className="text-muted-foreground text-xs">
						{apiKeyLocalization.apiKeysDescription}
					</p>
				</div>

				<Button size="sm" onClick={onCreatePress}>
					{apiKeyLocalization.createApiKey}
				</Button>
			</CardContent>
		</Card>
	);
}
