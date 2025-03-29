import * as schema from './schema';

export const Divisions = schema.Divisions.enumValues;
export type Divisions = (typeof schema.Divisions.enumValues)[number];
export const ScoreStatus = schema.ScoreStatus.enumValues;
export type ScoreStatus = (typeof schema.ScoreStatus.enumValues)[number];
export const States = schema.States.enumValues;
export type States = (typeof schema.States.enumValues)[number];
export const TournamentLevels = schema.TournamentLevels.enumValues;
export type TournamentLevels =
	(typeof schema.TournamentLevels.enumValues)[number];
export const TrialStaus = schema.TrialStatus.enumValues;
export type TrialStatus = (typeof schema.TrialStatus.enumValues)[number];
export const UserRole = schema.UserRole.enumValues;
export type UserRole = (typeof schema.UserRole.enumValues)[number];
export const PerEventNOptions = schema.PerEventNOptions.enumValues;
export type PerEventNOptions =
	(typeof schema.PerEventNOptions.enumValues)[number];

export type Slides = typeof schema.Slides.$inferSelect;
export type Event = typeof schema.Event.$inferSelect;
export type Invite = typeof schema.Invite.$inferSelect;
export type Score = typeof schema.Score.$inferSelect;
export type Role = typeof schema.Role.$inferSelect;
export type Team = typeof schema.Team.$inferSelect;
export type Tournament = typeof schema.Tournament.$inferSelect;
export type Track = typeof schema.Track.$inferSelect;
export type User = typeof schema.User.$inferSelect;
