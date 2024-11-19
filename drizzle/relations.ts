import { relations } from 'drizzle-orm/relations';
import {
	Tournament,
	Slides,
	User,
	Event,
	Invite,
	Score,
	Team,
	Role,
	Track,
	_ESEventRoles,
	_InviteEvents,
	Admins
} from './schema';

export const SlidesRelations = relations(Slides, ({ one }) => ({
	tournament: one(Tournament, {
		fields: [Slides.tournamentId],
		references: [Tournament.id]
	})
}));

export const TournamentRelations = relations(Tournament, ({ many }) => ({
	slides: many(Slides),
	events: many(Event),
	invites: many(Invite),
	roles: many(Role),
	teams: many(Team),
	tracks: many(Track)
}));

export const EventRelations = relations(Event, ({ one, many }) => ({
	audited: one(User, {
		fields: [Event.auditedUserId],
		references: [User.id]
	}),
	tournament: one(Tournament, {
		fields: [Event.tournamentId],
		references: [Tournament.id]
	}),
	scores: many(Score),
	supervisors: many(_ESEventRoles),
	invites: many(_InviteEvents)
}));

export const UserRelations = relations(User, ({ many }) => ({
	events: many(Event),
	roles: many(Role)
}));

export const InviteRelations = relations(Invite, ({ one, many }) => ({
	tournament: one(Tournament, {
		fields: [Invite.tournamentId],
		references: [Tournament.id]
	}),
	events: many(_InviteEvents)
}));

export const ScoreRelations = relations(Score, ({ one }) => ({
	event: one(Event, {
		fields: [Score.eventId],
		references: [Event.id]
	}),
	team: one(Team, {
		fields: [Score.teamId],
		references: [Team.id]
	})
}));

export const TeamRelations = relations(Team, ({ one, many }) => ({
	scores: many(Score),
	tournament: one(Tournament, {
		fields: [Team.tournamentId],
		references: [Tournament.id]
	}),
	track: one(Track, {
		fields: [Team.trackId],
		references: [Track.id]
	})
}));

export const RoleRelations = relations(Role, ({ one, many }) => ({
	tournament: one(Tournament, {
		fields: [Role.tournamentId],
		references: [Tournament.id]
	}),
	user: one(User, {
		fields: [Role.userId],
		references: [User.id]
	}),
	supEvents: many(_ESEventRoles)
}));

export const TrackRelations = relations(Track, ({ one, many }) => ({
	teams: many(Team),
	tournament: one(Tournament, {
		fields: [Track.tournamentId],
		references: [Tournament.id]
	})
}));

export const _ESEventRolesRelations = relations(_ESEventRoles, ({ one }) => ({
	event: one(Event, {
		fields: [_ESEventRoles.A],
		references: [Event.id]
	}),
	role: one(Role, {
		fields: [_ESEventRoles.B],
		references: [Role.id]
	})
}));

export const _InviteEventsRelations = relations(_InviteEvents, ({ one }) => ({
	event: one(Event, {
		fields: [_InviteEvents.A],
		references: [Event.id]
	}),
	invite: one(Invite, {
		fields: [_InviteEvents.B],
		references: [Invite.link]
	})
}));

export const AdminsRelations = relations(Admins, ({ one }) => ({
	user: one(User, {
		fields: [Admins.id],
		references: [User.id]
	})
}));
