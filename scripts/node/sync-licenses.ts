#!/usr/bin/env -S pnpm tsx
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function main() {
	const root = path.resolve(__dirname, '..', '..');
	const licensePath = path.join(root, 'LICENSE');
	const vendorDir = path.join(root, 'vendor');

	try {
		await fs.access(licensePath);
	} catch {
		console.error(`Root LICENSE not found at ${licensePath}`);
		process.exit(1);
	}

	let licenseContent: string;
	try {
		licenseContent = await fs.readFile(licensePath, 'utf8');
	} catch (error) {
		console.error('Failed to read root LICENSE', error);
		process.exit(1);
	}

	let entries: string[];
	try {
		entries = await fs.readdir(vendorDir);
	} catch (error) {
		console.error(`Failed to read vendor directory at ${vendorDir}`, error);
		process.exit(1);
	}

	let copied = 0;
	for (const entry of entries) {
		const pkgDir = path.join(vendorDir, entry);
		const pkgJson = path.join(pkgDir, 'package.json');
		const targetLicense = path.join(pkgDir, 'LICENSE');

		try {
			const stat = await fs.stat(pkgDir);
			if (!stat.isDirectory()) continue;
			await fs.access(pkgJson);
		} catch {
			continue; // skip non-packages
		}

		try {
			await fs.writeFile(targetLicense, licenseContent, 'utf8');
			copied += 1;
		} catch (error) {
			console.error(`Failed to write LICENSE for ${entry}`, error);
		}
	}

	console.log(`Copied LICENSE to ${copied} package(s) in vendor/`);
}

void main();
