import { faker } from '@faker-js/faker';

const rolePriority = ['admin', 'moderator', 'user'];

function resolveRoleByIndex(index, options) {
	if (index < options.adminCount) {
		return 'admin';
	}

	if (index < options.adminCount + options.moderatorCount) {
		return 'moderator';
	}

	return 'user';
}

function createRoleList(primaryRole) {
	const roleSet = new Set([primaryRole]);

	if (primaryRole === 'admin' && faker.number.int({ min: 0, max: 100 }) > 70) {
		roleSet.add('moderator');
	}

	return rolePriority.filter((role) => roleSet.has(role)).join(',');
}

function createFakeUsers(options) {
	faker.seed(options.seed);
	const rows = [];

	for (let index = 0; index < options.count; index += 1) {
		const first = faker.person.firstName();
		const last = faker.person.lastName();
		const id = faker.string.uuid();
		const usernameBase = `${first}.${last}`
			.toLowerCase()
			.replace(/[^a-z0-9.]/g, '')
			.slice(0, 20);
		const username = `${usernameBase}${(index + 1).toString(36)}`;
		const role = resolveRoleByIndex(index, options);
		const createdAt = faker.date.between({
			from: '2021-01-01T00:00:00.000Z',
			to: new Date(),
		});

		rows.push({
			id,
			name: `${first} ${last}`,
			email: faker.internet.email({ firstName: first, lastName: last }),
			emailVerified: faker.datatype.boolean(0.85),
			image: faker.image.avatar(),
			username,
			displayUsername: `@${username}`,
			bio: faker.person.bio(),
			createdAt,
			updatedAt: createdAt,
			roles: createRoleList(role),
			banned: false,
			banReason: null,
			banExpiresAt: null,
		});
	}

	return rows;
}

export { createFakeUsers };
