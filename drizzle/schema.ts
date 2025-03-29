import {
	pgSchema,
	uniqueIndex,
	bigint,
	text,
	jsonb,
	boolean,
	bigserial,
	smallint,
	uuid,
	timestamp,
	doublePrecision,
	real,
	date,
	index
} from 'drizzle-orm/pg-core';

export const scoring = pgSchema('scoring');
export const Divisions = scoring.enum('Divisions', ['A', 'B', 'C']);
export const ScoreStatus = scoring.enum('ScoreStatus', [
	'COMPETED',
	'PARTICIPATION',
	'NOSHOW',
	'DISQUALIFICATION'
]);
export const States = scoring.enum('States', [
	'AL',
	'AK',
	'AZ',
	'AR',
	'CA',
	'nCA',
	'sCA',
	'CO',
	'CT',
	'DE',
	'DC',
	'FL',
	'GA',
	'HI',
	'ID',
	'IL',
	'IN',
	'IA',
	'KS',
	'KY',
	'LA',
	'ME',
	'MD',
	'MA',
	'MI',
	'MN',
	'MS',
	'MO',
	'MT',
	'NE',
	'NV',
	'NH',
	'NJ',
	'NM',
	'NY',
	'NC',
	'ND',
	'OH',
	'OK',
	'OR',
	'PA',
	'RI',
	'SC',
	'SD',
	'TN',
	'TX',
	'UT',
	'VT',
	'VA',
	'WA',
	'WV',
	'WI',
	'WY',
	'INTERNATIONAL'
]);
export const TournamentLevels = scoring.enum('TournamentLevels', [
	'INVITATIONAL',
	'REGIONAL',
	'STATE',
	'NATIONAL'
]);
export const TrialStatus = scoring.enum('TrialStatus', [
	'SCORING',
	'TRIAL',
	'TRIALED'
]);
export const UserRole = scoring.enum('UserRole', ['TD', 'SM', 'ES']);
export const PerEventNOptions = scoring.enum('PerEventNOptions', [
	'NONE',
	'PLACE',
	'PARTICIPATION'
]);

export const Slides = scoring.table('Slides', {
	tournamentId: bigint('tournamentId', { mode: 'bigint' })
		.primaryKey()
		.references(() => Tournament.id, { onDelete: 'cascade' }),
	channelId: text('channelId'),
	settings: jsonb('settings').$type<DbJson.SlidesSettings>(),
	batches: jsonb('batches').$type<DbJson.SlidesBatches>(),
	done: boolean('done').default(false).notNull()
});

export const Event = scoring.table(
	'Event',
	{
		id: bigserial('id', { mode: 'bigint' }).primaryKey().notNull(),
		name: text('name').notNull(),
		trialStatus: TrialStatus('trialStatus').default('SCORING').notNull(),
		highScoring: boolean('highScoring').default(true).notNull(),
		locked: boolean('locked').default(false).notNull(),
		medals: smallint('medals'),
		enableChecklist: boolean('enableChecklist').default(false).notNull(),
		auditedUserId: uuid('auditedUserId').references(() => User.id, {
			onDelete: 'set null'
		}),
		auditedAt: timestamp('auditedAt', {
			precision: 3,
			withTimezone: true,
			mode: 'date'
		}),
		tournamentId: bigint('tournamentId', { mode: 'bigint' })
			.notNull()
			.references(() => Tournament.id, { onDelete: 'cascade' }),
		lastExportedAt: timestamp('lastExportedAt', {
			precision: 3,
			withTimezone: true,
			mode: 'date'
		})
	},
	(table) => {
		return {
			tournamentId_idx: index().using('btree', table.tournamentId),
			auditedUserId_idx: index().using('btree', table.auditedUserId)
		};
	}
);

export const Invite = scoring.table(
	'Invite',
	{
		link: text('link').primaryKey().notNull(),
		email: text('email'),
		tournamentId: bigint('tournamentId', { mode: 'bigint' })
			.notNull()
			.references(() => Tournament.id, { onDelete: 'cascade' }),
		role: UserRole('role').default('ES').notNull()
	},
	(table) => {
		return {
			tournamentId_idx: index().using('btree', table.tournamentId)
		};
	}
);

export const Score = scoring.table(
	'Score',
	{
		id: bigserial('id', { mode: 'bigint' }).primaryKey().notNull(),
		teamId: bigint('teamId', { mode: 'bigint' })
			.notNull()
			.references(() => Team.id, { onDelete: 'cascade' }),
		eventId: bigint('eventId', { mode: 'bigint' })
			.notNull()
			.references(() => Event.id, { onDelete: 'cascade' }),
		rawScore: doublePrecision('rawScore'),
		tier: smallint('tier'),
		tiebreak: real('tiebreak'),
		status: ScoreStatus('status').notNull(),
		notes: text('notes'),
		checklist: jsonb('checklist').$type<DbJson.ChecklistData>(),
		checklistUuid: uuid('checklistUuid').defaultRandom().notNull()
	},
	(table) => {
		return {
			eventId_teamId_key: uniqueIndex('Score_eventId_teamId_key').using(
				'btree',
				table.eventId,
				table.teamId
			),
			eventId_idx: index().using('btree', table.eventId),
			teamId_idx: index().using('btree', table.teamId)
		};
	}
);

export const Role = scoring.table(
	'Role',
	{
		id: bigserial('id', { mode: 'bigint' }).primaryKey().notNull(),
		userId: uuid('userId')
			.notNull()
			.references(() => User.id, { onDelete: 'cascade' }),
		role: UserRole('role').notNull(),
		tournamentId: bigint('tournamentId', { mode: 'bigint' })
			.notNull()
			.references(() => Tournament.id, { onDelete: 'cascade' })
	},
	(table) => {
		return {
			userId_tournamentId_key: uniqueIndex(
				'Role_userId_tournamentId_key'
			).using('btree', table.userId, table.tournamentId),
			userId_idx: index().using('btree', table.userId),
			tournamentId_idx: index().using('btree', table.tournamentId)
		};
	}
);

export const Team = scoring.table(
	'Team',
	{
		id: bigserial('id', { mode: 'bigint' }).primaryKey().notNull(),
		number: smallint('number').notNull(),
		school: text('school').notNull(),
		abbreviation: text('abbreviation'),
		suffix: text('suffix'),
		city: text('city'),
		state: States('state').notNull(),
		trackId: bigint('trackId', { mode: 'bigint' }).references(() => Track.id, {
			onDelete: 'set null'
		}),
		exhibition: boolean('exhibition').default(false).notNull(),
		penalties: smallint('penalties'),
		tournamentId: bigint('tournamentId', { mode: 'bigint' })
			.notNull()
			.references(() => Tournament.id, { onDelete: 'cascade' })
	},
	(table) => {
		return {
			tournamentId_number_key: uniqueIndex(
				'Team_tournamentId_number_key'
			).using('btree', table.tournamentId, table.number),
			tournamentId_idx: index().using('btree', table.tournamentId),
			trackId_idx: index().using('btree', table.trackId)
		};
	}
);

export const Tournament = scoring.table('Tournament', {
	name: text('name').notNull(),
	location: text('location').notNull(),
	state: States('state').notNull(),
	level: TournamentLevels('level').notNull(),
	year: smallint('year').notNull(),
	medals: smallint('medals').default(6).notNull(),
	trophies: smallint('trophies').default(3).notNull(),
	bids: smallint('bids'),
	bidsPerSchool: smallint('bidsPerSchool'),
	drops: smallint('drops'),
	shortName: text('shortName'),
	awardsDate: date('awardsDate', { mode: 'date' }).notNull(),
	endDate: date('endDate', { mode: 'date' }).notNull(),
	nOffset: smallint('nOffset'),
	perEventN: PerEventNOptions('perEventN').default('NONE').notNull(),
	startDate: date('startDate', { mode: 'date' }).notNull(),
	division: Divisions('division').notNull(),
	enableTracks: boolean('enableTracks').default(false).notNull(),
	id: bigserial('id', { mode: 'bigint' }).primaryKey().notNull(),
	approved: boolean('approved').default(false).notNull(),
	requestingApproval: boolean('requestingApproval').default(false).notNull()
});

export const Track = scoring.table(
	'Track',
	{
		id: bigserial('id', { mode: 'bigint' }).primaryKey().notNull(),
		name: text('name').notNull(),
		medals: smallint('medals'),
		trophies: smallint('trophies'),
		tournamentId: bigint('tournamentId', { mode: 'bigint' })
			.notNull()
			.references(() => Tournament.id, { onDelete: 'cascade' })
	},
	(table) => {
		return {
			tournamentId_idx: index().using('btree', table.tournamentId)
		};
	}
);

export const User = scoring.table('User', {
	id: uuid('id').primaryKey().notNull(),
	name: text('name').notNull()
});

export const _ESEventRoles = scoring.table(
	'_ESEventRoles',
	{
		A: bigint('A', { mode: 'bigint' })
			.notNull()
			.references(() => Event.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		B: bigint('B', { mode: 'bigint' })
			.notNull()
			.references(() => Role.id, { onDelete: 'cascade', onUpdate: 'cascade' })
	},
	(table) => {
		return {
			AB_unique: uniqueIndex('_ESEventRoles_AB_unique').using(
				'btree',
				table.A,
				table.B
			),
			A_idx: index().using('btree', table.A),
			B_idx: index().using('btree', table.B)
		};
	}
);

export const _InviteEvents = scoring.table(
	'_InviteEvents',
	{
		A: bigint('A', { mode: 'bigint' })
			.notNull()
			.references(() => Event.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		B: text('B')
			.notNull()
			.references(() => Invite.link, {
				onDelete: 'cascade',
				onUpdate: 'cascade'
			})
	},
	(table) => {
		return {
			AB_unique: uniqueIndex('_InviteEvents_AB_unique').using(
				'btree',
				table.A,
				table.B
			),
			A_idx: index().using('btree', table.A),
			B_idx: index().using('btree', table.B)
		};
	}
);

export const Admins = scoring.table('Admins', {
	id: uuid('userId')
		.primaryKey()
		.notNull()
		.references(() => User.id, { onDelete: 'cascade' })
});
