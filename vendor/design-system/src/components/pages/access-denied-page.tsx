type AccessDeniedPageProps = {
	title?: string;
	description?: string;
};

export function AccessDeniedPage({
	title = 'Access Denied',
	description = 'You do not have permission to access this page.',
}: AccessDeniedPageProps) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-4">
			<h1 className="text-2xl font-bold">{title}</h1>
			<p className="text-muted-foreground">{description}</p>
		</div>
	);
}
