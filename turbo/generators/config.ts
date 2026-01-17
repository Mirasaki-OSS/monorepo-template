import type { PlopTypes } from '@turbo/gen';

const SCOPE = '@md-oss';

export default function generator(plop: PlopTypes.NodePlopAPI): void {
	plop.setHelper(
		'scopedName',
		(name: string) => `${SCOPE}/${plop.getHelper('kebabCase')(name)}`
	);

	plop.setGenerator('package', {
		description:
			'Scaffold a new TypeScript package matching monorepo conventions',
		prompts: [
			{
				type: 'input',
				name: 'name',
				message: 'Package name (without scope):',
				validate: (input: string) => {
					if (!input || !input.trim()) return 'Name is required';
					const kebab = plop.getHelper('kebabCase')(input);
					const valid = /^[a-z][a-z0-9-]*$/.test(kebab);
					return valid ? true : 'Use kebab-case: letters, numbers, dashes';
				},
			},
			{
				type: 'input',
				name: 'description',
				message: 'Description:',
				default: 'Shared utilities',
			},
			{
				type: 'confirm',
				name: 'example',
				message: 'Include example function in src/index.ts?',
				default: true,
			},
		],
		actions: [
			{
				type: 'addMany',
				base: 'turbo/generators/templates/package',
				destination: 'packages/{{kebabCase name}}',
				templateFiles: 'turbo/generators/templates/package/**/*.hbs',
			},
		],
	});
}
