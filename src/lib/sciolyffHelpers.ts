import type { Event, Team, Tournament, Track } from '$drizzle/types';
import type { computeEventRankings } from './scoreHelpers';

import yaml from 'js-yaml';

export function shortName(name?: string): string | undefined {
	if (name == undefined) {
		return undefined;
	}
	const subs = [
		['University of', 'U of'],
		['Science Olympiad'],
		['Tournament'],
		['Elementary School'],
		['Middle School'],
		['High School'],
		['Academy'],
		['University'],
		[' at ']
	];
	return subs
		.reduce(
			(name, sub) =>
				name.replace(
					new RegExp(`(\\s+|^)${sub[0].toLowerCase()}(\\s+|$)`, 'gi'),
					sub[1] ? ' ' + sub[1] + ' ' : ' '
				),
			name
		)
		.split(/\s+/)
		.filter((w) => w.length > 0)
		.map((w) =>
			['at', 'of', 'and', 'the'].includes(w)
				? w
				: w.charAt(0).toUpperCase() + w.slice(1)
		)
		.join(' ');
}

export function formatSchool(team: Team, maxLength = -1) {
	const abbr = abbrSchool(team.abbreviation || team.school);
	if (maxLength < 0 || abbr.length <= maxLength) {
		return abbr;
	}
	return abbr.slice(0, maxLength) + '…';
}

export function abbrSchool(school: string) {
	return school
		.replace('Elementary School', 'Elementary')
		.replace(/Elementary[ /-]Middle School/, 'EMS')
		.replace('Middle School', 'MS')
		.replace('Junior High School', 'JHS')
		.replace(/Middle[ /-]High School/, 'MHS')
		.replace(/Junior[ /-]Senior High School/, 'Jr/Sr HS')
		.replace('High School', 'HS')
		.replace('Secondary School', 'Secondary');
}

export function seasonYear(date: Date): number {
	const seasonStart = new Date(date.getFullYear(), 6, 15); // july 15
	if (date >= seasonStart) {
		return date.getFullYear() + 1;
	}
	return date.getFullYear();
}

export function generateFilename(tournament: Tournament) {
	// ^(19|20)\d{2}-[01]\d-[0-3]\d_([\w]+_invitational|([ns]?[A-Z]{2})_[\w]+_regional|([ns]?[A-Z]{2})_states|nationals)_(no_builds_)?[abc]$
	let output = '';
	output += tournament.startDate.getUTCFullYear();
	output +=
		'-' + (tournament.startDate.getUTCMonth() + 1).toString().padStart(2, '0');
	output += '-' + tournament.startDate.getUTCDate().toString().padStart(2, '0');
	switch (tournament.level) {
		case 'NATIONAL':
			output += '_nationals';
			break;
		case 'STATE':
			output += `_${tournament.state}_states`;
			break;
		case 'REGIONAL':
			output += `_${tournament.state}_${(
				tournament.shortName ?? tournament.name
			)
				.toLowerCase()
				.split('regional')[0]
				.replace(/\./g, '')
				.replace(/[^\w]/g, '_')}regional`;
			break;
		default:
			output += `_${(tournament.shortName ?? tournament.name)
				.toLowerCase()
				.split('invitational')[0]
				.replace(/\./g, '')
				.replace(/[^\w]/g, '_')}invitational`;
			break;
	}
	output += '_' + tournament.division.toLowerCase();
	return output;
}

export type Histos = Map<
	bigint,
	{
		start: number;
		width: number;
		counts: number[];
		info: Record<string, string>;
	}
>;

export function generateSciolyFF(
	tournament: Tournament,
	events: Event[],
	tracks: Track[],
	teams: (Team & { track: Track | null })[],
	rankings: ReturnType<typeof computeEventRankings>,
	histos?: Histos
) {
	const levelLookup = {
		INVITATIONAL: 'Invitational',
		REGIONAL: 'Regionals',
		STATE: 'States',
		NATIONAL: 'Nationals'
	} as const;
	const sciolyffRep = {
		Tournament: {
			name:
				tournament.level === 'INVITATIONAL' || tournament.level === 'REGIONAL'
					? tournament.name
					: undefined,
			'short name':
				tournament.level === 'INVITATIONAL' || tournament.level === 'REGIONAL'
					? (tournament.shortName ?? undefined)
					: undefined,
			location: tournament.location,
			state: tournament.state,
			level: levelLookup[tournament.level],
			division: tournament.division,
			year: tournament.year,
			'start date': tournament.startDate.toISOString().split('T')[0],
			'end date': tournament.endDate.toISOString().split('T')[0],
			'awards date': tournament.awardsDate.toISOString().split('T')[0],
			medals: tournament.medals,
			trophies: tournament.trophies,
			bids: tournament.bids ?? undefined,
			'bids per school': tournament.bidsPerSchool ?? 1,
			'n offset': tournament.nOffset ?? undefined,
			'worst placings dropped': tournament.drops ?? undefined
		},
		Events: events.map((e) => ({
			name: e.name,
			trial: e.trialStatus === 'TRIAL' ? true : undefined,
			trialed: e.trialStatus === 'TRIALED' ? true : undefined,
			medals: e.medals ?? undefined
		})),
		Tracks:
			tournament.enableTracks && tracks.length
				? tracks.map((t) => ({
						name: t.name,
						medals: t.medals ?? undefined,
						trophies: t.trophies ?? undefined
					}))
				: undefined,
		Teams: teams.map((t) => ({
			number: t.number,
			school: t.school,
			'school abbreviation': t.abbreviation ?? undefined,
			suffix: t.suffix ?? undefined,
			city: t.city ?? undefined,
			state: t.state,
			track: t.track?.name ?? undefined,
			exhibition: t.exhibition || undefined
		})),
		Placings: rankings.map((s) => ({
			team: s.team.number,
			event: s.event.name,
			participated:
				s.ranking === 'PARTICIPATION'
					? true
					: s.ranking === 'NOSHOW'
						? false
						: undefined,
			disqualified: s.status === 'DISQUALIFICATION' ? true : undefined,
			place: typeof s.ranking === 'number' ? s.ranking : undefined,
			tie: s.tie || undefined
		})),
		Penalties:
			teams.flatMap((t) =>
				t.penalties == null
					? []
					: [
							{
								team: t.number,
								points: t.penalties
							}
						]
			) || undefined,
		Histograms: histos && {
			type: 'data',
			data: events.map((e) => ({ ...histos.get(e.id), event: e.name }))
		}
	};

	return yaml.dump(sciolyffRep);
}
