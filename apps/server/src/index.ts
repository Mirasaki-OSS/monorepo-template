import { serve } from '@hono/node-server';
import app from './app';
import { parsedEnv } from './env';

const server = serve(
	{
		fetch: app.fetch,
		port: parsedEnv.SERVER_PORT,
	},
	(info) => {
		console.log(
			`Server is running on address ${info.address}:${info.port} (family: ${info.family})`
		);
	}
);

process.on('SIGINT', () => {
	server.close();
	process.exit(0);
});
process.on('SIGTERM', () => {
	server.close((err) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		process.exit(0);
	});
});
