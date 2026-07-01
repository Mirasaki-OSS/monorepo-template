import { faker } from '@faker-js/faker';

const rolePriority = ['admin', 'moderator', 'user'];

const banReasons = [
	'Repeated harassment of other users',
	'Spamming promotional content',
	'Circumventing a prior ban via multiple accounts',
	'Posting inappropriate or illegal content',
	'Violating community guidelines',
	'Fraudulent activity detected',
	'Impersonating another user or public figure',
	'Automated bot / scraping behavior detected',
	'Coordinated inauthentic behavior',
	'Sharing personal information of others without consent',
];

const displayUsernameStyles = [
	(u) => `@${u}`,
	(u) => u,
	(u) => u.replace('.', '_'),
	(u) => u.toUpperCase(),
	(u) => `${u}__`,
	(u) => `~${u}`,
];

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

function createBanFields(role) {
	// Admins and moderators are never banned in seed data
	if (role !== 'user') {
		return { banned: false, banReason: null, banExpiresAt: null };
	}

	// ~6 % of regular users are banned
	if (faker.number.int({ min: 1, max: 100 }) > 6) {
		return { banned: false, banReason: null, banExpiresAt: null };
	}

	const banReason = faker.helpers.arrayElement(banReasons);
	const banKind = faker.helpers.weightedArrayElement([
		{ weight: 40, value: 'permanent' },
		{ weight: 35, value: 'future' },
		{ weight: 25, value: 'expired' },
	]);

	let banExpiresAt = null;
	if (banKind === 'future') {
		banExpiresAt = faker.date.future({ years: 2 });
	} else if (banKind === 'expired') {
		banExpiresAt = faker.date.past({ years: 1 });
	}

	return { banned: true, banReason, banExpiresAt };
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

		// updatedAt is at or after createdAt
		const updatedAt = faker.date.between({ from: createdAt, to: new Date() });

		// ~80 % have an avatar, rest have no image
		const image = faker.datatype.boolean(0.8) ? faker.image.avatar() : null;

		// ~70 % have a bio
		const bio = faker.datatype.boolean(0.7) ? faker.person.bio() : null;

		// Vary display username style
		const displayUsername = faker.helpers.arrayElement(displayUsernameStyles)(
			username
		);

		const { banned, banReason, banExpiresAt } = createBanFields(role);

		rows.push({
			id,
			name: `${first} ${last}`,
			email: faker.internet.email({ firstName: first, lastName: last }),
			emailVerified: faker.datatype.boolean(0.85),
			image,
			username,
			displayUsername,
			bio,
			createdAt,
			updatedAt,
			roles: createRoleList(role),
			banned,
			banReason,
			banExpiresAt,
			clientMetadata: {},
			clientReadonlyMetadata: {},
			serverMetadata: {},
		});
	}

	return rows;
}

export { createFakeUsers };
