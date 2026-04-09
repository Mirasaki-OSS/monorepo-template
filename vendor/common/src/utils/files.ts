import { writeFile } from 'node:fs/promises';

const writeJsonFile = async (filePath: string, data: unknown) => {
	await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

export { writeJsonFile };
