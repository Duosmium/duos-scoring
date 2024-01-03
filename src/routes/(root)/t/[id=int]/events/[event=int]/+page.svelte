<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	import {
		TableBodyCell,
		TableHeadCell,
		Button,
		Heading,
		Modal,
		Input,
		P,
		Select,
		Textarea,
		ButtonGroup,
		Label,
		List,
		Li,
		Alert,
		Checkbox
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import { ScoreStatus, type Score } from '@prisma/client';
	import papaparse from 'papaparse';
	import { addToastMessage } from '$lib/components/Toasts.svelte';
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';

	export let data: PageData;

	beforeNavigate(({ cancel }) => {
		if (!clean) {
			showConfirmDiscard = true;
			cancel();
		}
	});

	const highScoring = [
		{ value: 'true', name: 'High Score Wins' },
		{ value: 'false', name: 'Low Score Wins' }
	];

	const statusLookup = {
		NA: 'N/A',
		COMPETED: 'CO',
		PARTICIPATION: 'PO',
		NOSHOW: 'NS',
		DISQUALIFICATION: 'DQ'
	} as const;
	const scoreStatuses = [
		{ value: 'NA', name: 'N/A' },
		{ value: 'COMPETED', name: 'CO' },
		{ value: 'PARTICIPATION', name: 'PO' },
		{ value: 'NOSHOW', name: 'NS' },
		{ value: 'DISQUALIFICATION', name: 'DQ' }
	];
	const scoreAliases = [
		{ value: 'NA', name: 'N/A' },
		{ value: 'COMPETED', name: 'CO' },
		{ value: 'COMPETED', name: 'C' },
		{ value: 'PARTICIPATION', name: 'PO' },
		{ value: 'NOSHOW', name: 'NS' },
		{ value: 'DISQUALIFICATION', name: 'DQ' }
	];
	const statusOrder = {
		COMPETED: 0,
		PARTICIPATION: 1,
		NOSHOW: 2,
		DISQUALIFICATION: 3,
		NA: 4,
		CO: 0,
		PO: 1,
		NS: 2,
		DQ: 3,
		'N/A': 4
	} as const;

	$: locked = data.event.locked;

	function generateModifiedTeams(data: PageData) {
		const scores = (typeof data.scores === 'boolean' ? [] : data.scores).reduce((acc, s) => {
			acc.set(s.team.id, s);
			return acc;
		}, new Map<bigint, Score>());
		return data.teams.map((t) => {
			let origScore = scores.get(t.id);
			let score = origScore
				? {
						...origScore,
						rawScore: { old: origScore.rawScore, new: origScore.rawScore, dirty: false },
						tier: { old: origScore.tier, new: origScore.tier, dirty: false },
						tiebreak: { old: origScore.tiebreak, new: origScore.tiebreak, dirty: false },
						status: {
							old: (origScore.status ?? 'NA') as ScoreStatus | 'NA',
							new: (origScore.status ?? 'NA') as ScoreStatus | 'NA',
							dirty: false
						},
						notes: { old: origScore.notes, new: origScore.notes, dirty: false }
				  }
				: {
						id: undefined as bigint | undefined,
						rawScore: { old: null, new: null, dirty: false } as {
							old: number | null;
							new: number | null;
							dirty: boolean;
						},
						tier: { old: null, new: null, dirty: false } as {
							old: number | null;
							new: number | null;
							dirty: boolean;
						},
						tiebreak: { old: null, new: null, dirty: false } as {
							old: number | null;
							new: number | null;
							dirty: boolean;
						},
						status: { old: 'NA', new: 'NA', dirty: false } as {
							old: ScoreStatus | 'NA';
							new: ScoreStatus | 'NA';
							dirty: boolean;
						},
						notes: { old: null, new: null, dirty: false } as {
							old: string | null;
							new: string | null;
							dirty: boolean;
						}
				  };
			return {
				...t,
				score,
				ranking: null as unknown as number | keyof typeof statusOrder
			};
		});
	}

	let sortBy = 'number';
	let modifiedTeams = generateModifiedTeams(data);
	let selected: typeof modifiedTeams = [];
	$: {
		// update rankings when things change
		modifiedTeams = modifiedTeams
			.map((t) => ({
				...t,
				ranking:
					t.score.status.new === 'COMPETED'
						? t.score.rawScore.new
							? t.score.rawScore.new +
							  ((t.score.tiebreak.new || 0) - 1000000 * (t.score.tier.new || 1)) *
									(data.event.highScoring ? 1 : -1)
							: 'PARTICIPATION'
						: t.score.status.new
			}))
			.sort((a, b) =>
				typeof a.ranking === 'number' && typeof b.ranking === 'number'
					? (b.ranking - a.ranking) * (data.event.highScoring ? 1 : -1)
					: typeof a.ranking === 'string' && typeof b.ranking === 'string'
					  ? statusOrder[a.ranking] - statusOrder[b.ranking]
					  : typeof a.ranking === 'number'
					    ? -1
					    : 1
			)
			.map((t, i, s) => {
				// check ties
				if (
					typeof t.ranking === 'number' &&
					(t.ranking === s[i - 1]?.ranking || t.ranking === s[i + 1]?.ranking)
				) {
					if (t.score.notes.new && t.score.notes.new !== 'TIE') {
						t.score.notes.new = 'TIE; ' + t.score.notes.new.replace('TIE; ', '').replace('TIE', '');
					} else {
						t.score.notes.new = 'TIE';
					}
				} else {
					t.score.notes.new = t.score.notes.new?.replace('TIE; ', '').replace('TIE', '') || null;
				}
				return t;
			})
			.map((t, i, s) => ({
				...t,
				ranking:
					typeof t.ranking === 'string'
						? statusLookup[t.ranking]
						: (t.score.notes.new?.includes('TIE')
								? s.findIndex((x) => x.ranking === t.ranking)
								: i) + 1 // do index searching for ties
			}));
	}
	$: {
		// update sorting when things change
		modifiedTeams = modifiedTeams.sort((a, b) => {
			switch (sortBy) {
				case 'number':
					return a.number - b.number;
				case 'school':
					return a.school.localeCompare(b.school);
				case 'score':
					return (
						((b.score?.rawScore.new ?? (data.event.highScoring ? 0 : Infinity)) -
							(a.score?.rawScore.new ?? (data.event.highScoring ? 0 : Infinity))) *
							(data.event.highScoring ? 1 : -1) ||
						(a.score?.tier.new ?? Infinity) - (b.score?.tier.new ?? Infinity) ||
						(b.score?.tiebreak.new ?? 0) - (a.score?.tiebreak.new ?? 0)
					);
				case 'tier':
					return (a.score?.tier.new ?? Infinity) - (b.score?.tier.new ?? Infinity);
				case 'status':
					return (
						statusOrder[a.score?.status.new ?? 'NA'] - statusOrder[b.score?.status.new ?? 'NA']
					);
				case 'ranking':
					return typeof a.ranking === 'number' && typeof b.ranking === 'number'
						? a.ranking - b.ranking
						: typeof a.ranking === 'string' && typeof b.ranking === 'string'
						  ? statusOrder[a.ranking] - statusOrder[b.ranking]
						  : typeof a.ranking === 'number'
						    ? -1
						    : 1;
				default:
					return 0;
			}
		});
	}
	$: {
		// update dirty marker when things change
		modifiedTeams = modifiedTeams.map((t) => {
			(['rawScore', 'tier', 'tiebreak', 'status', 'notes'] as const).forEach(
				(a) => (t.score[a].dirty = t.score[a].new !== t.score[a].old)
			);
			return t;
		});
	}
	$: clean = modifiedTeams.every((t) =>
		(['rawScore', 'tier', 'tiebreak', 'status', 'notes'] as const).every((a) => !t.score[a].dirty)
	);
	$: teamLookup = modifiedTeams.reduce((acc, t) => {
		acc.set(t.number, t);
		return acc;
	}, new Map<number, (typeof modifiedTeams)[0]>());

	function updateData(
		teamNumber: number,
		field: 'rawScore' | 'tier' | 'tiebreak' | 'status' | 'notes'
	) {
		return (e: Event) => {
			if (locked) return;
			const team = teamLookup.get(teamNumber);
			if (!team) return;
			switch (field) {
				case 'rawScore':
					const raw = parseFloat((e.target as HTMLInputElement).value);
					team.score.rawScore.new = isNaN(raw) ? null : raw;
					if (!isNaN(raw) && team.score.status.new === 'NA') {
						team.score.status.new = 'COMPETED';
					}
					if (isNaN(raw) && team.score.status.new === 'COMPETED') {
						team.score.status.new = 'NA';
					}
					break;
				case 'tier':
					const tier = parseInt((e.target as HTMLInputElement).value);
					team.score.tier.new = isNaN(tier) ? null : tier;
					break;
				case 'tiebreak':
					const tiebreak = parseFloat((e.target as HTMLInputElement).value);
					team.score.tiebreak.new = isNaN(tiebreak) ? null : tiebreak;
					break;
				case 'status':
					team.score.status.new = (e.target as HTMLSelectElement).value as any;
					break;
				case 'notes':
					team.score.notes.new = (e.target as HTMLTextAreaElement).value || null;
					break;
				default:
					break;
			}
			modifiedTeams = modifiedTeams;
		};
	}

	let showHelp = false;

	let showImportScores = false;
	let importScoresData = '';
	let parsedImportScores: {
		Number: string;
		'Team #': string;
		'Raw Score': string;
		Score: string;
		Tier: string;
		Tiebreak: string;
		Status: string;
	}[] = [];
	let parsedError = '';
	$: {
		parsedImportScores = papaparse.parse(importScoresData, { header: true }).data as any;
		parsedError = '';
		const missingFields: Set<string> = new Set();
		const invalidStatuses: Set<string> = new Set();
		// TODO: validate stuff
		parsedImportScores.forEach((t) => {
			if (!t.Number && !t['Team #']) {
				missingFields.add('Number');
			}
			if (!t.Status && !t['Raw Score'] && !t.Score) {
				missingFields.add('Status');
			} else if (t.Status && scoreAliases.every((s) => s.name !== t.Status)) {
				invalidStatuses.add(t.Status);
			}
			if (!t['Raw Score'] && !t.Score && (t.Status === 'CO' || t.Status === 'C')) {
				missingFields.add('Score');
			}
		});
		if (missingFields.size > 0) {
			parsedError += `Missing fields: ${[...missingFields].join(', ')}; `;
		}
		if (invalidStatuses.size > 0) {
			parsedError += `Invalid statuses: ${[...invalidStatuses].join(', ')}`;
		}
	}
	function importScores() {
		if (locked) return;
		if (parsedError) return;
		parsedImportScores.forEach((parsedScore) => {
			const team = teamLookup.get(
				parseInt(/\d+/.exec(parsedScore.Number || parsedScore['Team #'])?.[0] ?? '')
			);
			if (!team) return;

			const raw = parseFloat(parsedScore['Raw Score'] || parsedScore.Score);
			const tier = parseInt(parsedScore.Tier);
			const tiebreak = parseFloat(parsedScore.Tiebreak);
			team.score.rawScore.new = isNaN(raw) ? null : raw;
			team.score.tier.new = isNaN(tier) ? null : tier;
			team.score.tiebreak.new = isNaN(tiebreak) ? null : tiebreak;
			team.score.status.new = (scoreAliases.find((s) => s.name === parsedScore.Status)?.value ??
				(isNaN(raw) ? team.score.status.old : ScoreStatus.COMPETED)) as any;
		});
		modifiedTeams = modifiedTeams;
	}

	let showConfirmDiscard = false;
	function discardChanges() {
		modifiedTeams = modifiedTeams.map((t) => ({
			...t,
			score: {
				...t.score,
				rawScore: { old: t.score.rawScore.old, new: t.score.rawScore.old, dirty: false },
				tier: { old: t.score.tier.old, new: t.score.tier.old, dirty: false },
				tiebreak: { old: t.score.tiebreak.old, new: t.score.tiebreak.old, dirty: false },
				status: { old: t.score.status.old, new: t.score.status.old, dirty: false },
				notes: { old: t.score.notes.old, new: t.score.notes.old, dirty: false }
			}
		}));
	}

	let showEditEvent = false;
	let editHighScoring = 'true';
	let editEventMedals = '';
	function openEditEvent() {
		showEditEvent = true;
		editHighScoring = data.event.highScoring ? 'true' : 'false';
		editEventMedals = data.event.medals?.toString() || '';
	}
	function editEvent() {
		fetch(`/t/${$page.params['id']}/events/${$page.params['event']}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				highScoring: editHighScoring,
				medals: parseInt(editEventMedals) || undefined
			})
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Event edited!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to edit event!', 'error');
			}
		});
	}

	function saveScores() {
		if (locked) return;
		fetch(`/t/${$page.params['id']}/events/${$page.params['event']}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(
				modifiedTeams
					.filter((t) =>
						(['rawScore', 'tier', 'tiebreak', 'status', 'notes'] as const).some(
							(a) => t.score[a].dirty
						)
					)
					.map((t) => ({
						id: t.score.id?.toString(),
						teamId: t.id.toString(),
						rawScore: t.score.rawScore.dirty ? t.score.rawScore.new : undefined,
						tier: t.score.tier.dirty ? t.score.tier.new : undefined,
						tiebreak: t.score.tiebreak.dirty ? t.score.tiebreak.new : undefined,
						status:
							t.score.status.dirty && t.score.status.new !== 'NA' ? t.score.status.new : undefined,
						notes: t.score.notes.dirty ? t.score.notes.new : undefined
					}))
			)
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Scores saved!', 'success');
				invalidateAll().then(() => {
					modifiedTeams = generateModifiedTeams(data);
				});
			} else {
				addToastMessage('Failed to save scores!', 'error');
			}
		});
		modifiedTeams = modifiedTeams.map((t) => ({
			...t,
			score: {
				...t.score,
				rawScore: { old: t.score.rawScore.new, new: t.score.rawScore.new, dirty: false },
				tier: { old: t.score.tier.new, new: t.score.tier.new, dirty: false },
				tiebreak: { old: t.score.tiebreak.new, new: t.score.tiebreak.new, dirty: false },
				status: { old: t.score.status.new, new: t.score.status.new, dirty: false },
				notes: { old: t.score.notes.new, new: t.score.notes.new, dirty: false }
			}
		}));
	}

	let showLockDirty = false;
	let showConfirmUnlockAudited = false;
	let lockOverride = false;
	function unlockAudited() {
		lockOverride = true;
		toggleLock();
		lockOverride = false;
	}
	function toggleLock() {
		if (!locked && modifiedTeams.some((t) => t.score.status.old === 'NA')) {
			addToastMessage('Cannot lock an event with missing scores!', 'error');
			return;
		}
		if (!lockOverride && !clean) {
			showLockDirty = true;
			return;
		}
		if (!lockOverride && data.event.audited && data.event.locked) {
			if (data.role.role === 'ES') {
				addToastMessage('Cannot unlock an audited event!', 'error');
				return;
			} else {
				showConfirmUnlockAudited = true;
				return;
			}
		}
		locked = !data.event.locked;
		fetch(`/t/${$page.params['id']}/events/${$page.params['event']}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				locked: !data.event.locked
			})
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage(locked ? 'Event marked as done grading!' : 'Event unlocked!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to lock event!', 'error');
			}
		});
	}

	const auditList: boolean[] = [];

	let showAuditConfirm = false;
	function openAuditConfirm() {
		if (locked && data.role.role !== 'ES' && !data.event.audited) {
			showAuditConfirm = true;
		} else {
			addToastMessage('Cannot audit event!', 'error');
		}
	}
	function confirmAudit() {
		if (!locked || data.role.role === 'ES' || data.event.audited) {
			addToastMessage('Cannot audit event!', 'error');
			return;
		}
		fetch(`/t/${$page.params['id']}/events/${$page.params['event']}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				audited: true
			})
		}).then((res) => {
			if (res.status === 200) {
				addToastMessage('Event audited!');
				invalidateAll();
			} else {
				addToastMessage('Failed to audit event!', 'error');
			}
		});
	}

	function handleKeypress(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			(
				(e.target as HTMLInputElement).parentElement?.parentElement?.nextElementSibling?.children[
					((e.target as HTMLInputElement).parentElement as HTMLTableCellElement)?.cellIndex ?? 0
				]?.firstElementChild as HTMLInputElement
			)?.focus();
		}
	}
</script>

<Head
	title="{data.event.name} | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<svelte:window
	on:beforeunload={(e) => {
		if (!clean) {
			const msg = 'You have unsaved changes. Are you sure you want to leave?';
			(e || window.event).returnValue = msg;
			return msg;
		}
	}}
/>

<div class="w-full flex justify-between flex-wrap mb-2">
	<Heading tag="h2" class="w-fit">{data.event.name}</Heading>
	<span class="space-x-4 flex items-center flex-wrap">
		<Select
			class="w-36"
			items={[
				{ value: 'number', name: 'By Number' },
				{ value: 'school', name: 'By School' },
				{ value: 'score', name: 'By Score' },
				{ value: 'tier', name: 'By Tier' },
				{ value: 'status', name: 'By Status' },
				{ value: 'ranking', name: 'By Ranking' }
			]}
			bind:value={sortBy}
		/>
		{#if !data.event.audited}
			<Button
				color="green"
				disabled={locked}
				on:click={() => {
					showImportScores = true;
				}}>Import</Button
			>
			<ButtonGroup>
				<Button disabled={clean || locked} on:click={saveScores} color="green">Save</Button>
				<Button
					disabled={clean || locked}
					on:click={() => {
						showConfirmDiscard = true;
					}}
					color="red">Discard</Button
				>
			</ButtonGroup>
		{:else}
			<div>
				Event audited by {data.event.audited.name} at {data.event.auditedAt?.toLocaleString()}
			</div>
		{/if}
		{#if data.role.role !== 'ES' || !data.event.audited}
			<ButtonGroup>
				<Button color="yellow" on:click={toggleLock}>{locked ? 'Unlock' : 'Lock'}</Button>
				{#if data.role.role !== 'ES' && !data.event.audited}
					<Button color="purple" disabled={!locked} on:click={openAuditConfirm}>Audit</Button>
				{/if}
				<Button color="alternative" on:click={openEditEvent}>Settings</Button>
			</ButtonGroup>
		{/if}
		<Button
			color="blue"
			pill
			on:click={() => {
				showHelp = true;
			}}>?</Button
		>
	</span>
</div>
<SelectableTable items={modifiedTeams} bind:selected cols={10}>
	<svelte:fragment slot="headers">
		<TableHeadCell class="px-2">#</TableHeadCell>
		<TableHeadCell class="px-2">School</TableHeadCell>
		<TableHeadCell class="pl-2 pr-4">Suffix</TableHeadCell>
		<TableHeadCell class="px-0">Raw Score</TableHeadCell>
		<TableHeadCell class="px-0">Tier</TableHeadCell>
		<TableHeadCell class="px-0">Tiebreak</TableHeadCell>
		<TableHeadCell class="px-0">Status</TableHeadCell>
		<TableHeadCell class="px-4">Ranking</TableHeadCell>
		<TableHeadCell class="px-0">Notes</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={team}>
		<TableBodyCell class="px-2">{team.number}</TableBodyCell>
		<TableBodyCell class="px-2"
			>{team.abbreviation ??
				team.school.slice(0, 30) + (team.school.length > 30 ? '…' : '')}</TableBodyCell
		>
		<TableBodyCell class="pl-2 pr-4">
			{team.suffix ? team.suffix.slice(0, 20) + (team.suffix.length > 20 ? '…' : '') : ''}
		</TableBodyCell>
		<TableBodyCell class="p-0">
			<Input
				disabled={locked}
				class={`rounded-none !bg-transparent p-2 w-24 !border-orange-500 ${
					team.score.rawScore.dirty ? '!border-2' : '!border-0'
				} disabled:cursor-text disabled:opacity-100`}
				type="text"
				inputmode="numeric"
				value={team.score.rawScore.new ?? ''}
				on:change={updateData(team.number, 'rawScore')}
				on:keypress={handleKeypress}
			/>
		</TableBodyCell>
		<TableBodyCell class="p-0">
			<Input
				disabled={locked}
				class={`rounded-none !bg-transparent p-2 w-12 !border-orange-500 ${
					team.score.tier.dirty ? '!border-2' : '!border-0'
				} disabled:cursor-text disabled:opacity-100`}
				type="text"
				inputmode="numeric"
				value={team.score.tier.new ?? ''}
				on:change={updateData(team.number, 'tier')}
				on:keypress={handleKeypress}
			/>
		</TableBodyCell>
		<TableBodyCell class="p-0">
			<Input
				disabled={locked}
				class={`rounded-none !bg-transparent p-2 w-16 !border-orange-500 ${
					team.score.tiebreak.dirty ? '!border-2' : '!border-0'
				} disabled:cursor-text disabled:opacity-100`}
				type="text"
				inputmode="numeric"
				value={team.score.tiebreak.new ?? ''}
				on:change={updateData(team.number, 'tiebreak')}
				on:keypress={handleKeypress}
			/>
		</TableBodyCell>
		<TableBodyCell class="p-0">
			<Select
				disabled={locked}
				items={scoreStatuses}
				class={`rounded-none !bg-transparent w-20 p-2 !border-orange-500 ${
					team.score.status.dirty ? '!border-2' : '!border-0'
				}`}
				value={team.score.status.new ?? 'NA'}
				on:change={updateData(team.number, 'status')}
			/>
		</TableBodyCell>
		<TableBodyCell class="px-4">{team.ranking}</TableBodyCell>
		<TableBodyCell class="p-0">
			<Textarea
				disabled={locked}
				class={`rounded-none !bg-transparent p-2 w-36 !border-orange-500 ${
					team.score.notes.dirty ? '!border-2' : '!border-0'
				}`}
				rows="1"
				value={team.score.notes.new ?? ''}
				on:change={updateData(team.number, 'notes')}
			/>
		</TableBodyCell>
	</svelte:fragment>
</SelectableTable>

<Modal title="Scoring Help" bind:open={showHelp} autoclose outsideclose>
	<P class="dark:text-gray-300">Welcome to scoring! Enter scores for your event here.</P>
	<Heading tag="h2" class="text-xl">Toolbar</Heading>
	<P class="dark:text-gray-300">
		<dl class="space-y-3 mt-6">
			<div>
				<dt>Sorting:</dt>
				<dd>Sort events by various columns.</dd>
			</div>
			<div>
				<dt>Import:</dt>
				<dd>Paste in scores from an external source, such as a Google Sheet.</dd>
			</div>
			<div>
				<dt>Save/Discard:</dt>
				<dd>
					Changes you have made will be highlighted in orange. You will need to click "Save" to
					commit your changes, or use "Discard" to revert back to the original scores.
				</dd>
			</div>
			<div>
				<dt>Lock/Unlock:</dt>
				<dd>
					Locking an event will prevent scores from being edited and indicates that the event is
					done grading.
				</dd>
			</div>
			<div>
				<dt>Settings:</dt>
				<dd>Change the event's scoring method (high, low) or the number of medals offered.</dd>
			</div>
		</dl>
	</P>
	<Heading tag="h2" class="text-xl">About Columns</Heading>
	<P class="dark:text-gray-300">
		<dl class="space-y-3 mt-6">
			<div>
				<dt>Raw Score:</dt>
				<dd>The team's score for the event.</dd>
			</div>
			<div>
				<dt>Tier:</dt>
				<dd>
					Only used in some build and hybrid events. <strong>Leave blank if not used.</strong> Lower
					number tier (1) is ranked better than a higher number tier (2, 3, 4).
				</dd>
			</div>
			<div>
				<dt>Tiebreak:</dt>
				<dd>A value between 0 and 1. Give the tiebreaker to the better ranked team.</dd>
			</div>
			<div>
				<dt>Status:</dt>
				<dd>
					If a team competed as normal, select <strong>"CO" (Competed)</strong>. If a team
					participated but cannot be assigned a raw score, select
					<strong>"PO" (Participation)</strong>. If a team did not show up, select
					<strong>"NS" (No Show)</strong>. If a team is disqualified, select
					<strong>"DQ" (Disqualification)</strong>.
				</dd>
			</div>
		</dl>
	</P>
</Modal>

<Modal title="Import Teams" bind:open={showImportScores} autoclose outsideclose>
	<P>
		To import teams, paste in a CSV or TSV of team data. Include the following headings:
		<List tag="ul" class="space-y-1 mt-2">
			<Li
				><code>Number</code>
				<i>(Required)</i>: Team Number
			</Li>
			<Li
				><code class="dark:text-green-300 text-green-700">Raw Score</code>
				<i>(Required)</i>: The team's score.
			</Li>
			<Li
				><code class="dark:text-blue-300 text-blue-700">Tier</code>
				<i>(Optional)</i>: Only used in some build/hybrid events. Lower number tier is better than
				higher number.
			</Li>
			<Li
				><code class="dark:text-pink-300 text-pink-700">Tiebreak</code>
				<i>(Optional unless there's a tie)</i>: A number between 0-1. Give the tiebreaker to the
				better ranked team.
			</Li>
			<Li
				><code class="dark:text-violet-300 text-violet-700">Status</code>
				<i>(Optional, default CO)</i>: CO, PO, NS, or DQ for Competed, Participation Only, No Show,
				or Disqualified, respectively.
			</Li>
		</List>
	</P>
	<Label>
		Teams
		<Textarea disabled={locked} class="mt-2" required bind:value={importScoresData} />
	</Label>

	<Heading tag="h3" class="text-md">Preview</Heading>

	{#if parsedError}
		<Alert class="mt-2" color="red">{parsedError}</Alert>
	{:else if parsedImportScores.length !== 0}
		<ol>
			{#each parsedImportScores as score}
				{@const t = teamLookup.get(
					parseInt(/\d+/.exec(score.Number || score['Team #'])?.[0] ?? '')
				)}
				<li>
					<span class="tabular-nums">#{score.Number || score['Team #']}:</span>
					<span
						>{t
							? `${t.abbreviation || t.school}${t.suffix ? ' ' + t.suffix : ''}`
							: 'Team Not Found'}</span
					>
					<span class="dark:text-green-300 text-green-700">{score['Raw Score'] || score.Score}</span
					><span class="dark:text-blue-300 text-blue-700"
						>{score.Tier ? ` [Tier ${score.Tier}]` : ''}</span
					><span class="dark:text-pink-300 text-pink-700"
						>{score.Tiebreak ? ` (*${score.Tiebreak})` : ''}</span
					>
					<span class="dark:text-violet-300 text-violet-700"
						>{score.Status || score.Score
							? 'CO'
							: scoreAliases.find((s) => s.value === t?.score.status.old)?.name}</span
					>
				</li>
			{/each}
		</ol>
	{:else}
		<P>Waiting for score input...</P>
	{/if}

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button color="green" disabled={parsedError.length !== 0} on:click={importScores}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<ConfirmModal
	title="Discard Changes"
	actionMessage="discard your changes"
	bind:open={showConfirmDiscard}
	onConfirm={discardChanges}
>
	Are you sure you want to discard your changes? This action cannot be undone.
</ConfirmModal>

<ConfirmModal
	title="Unlock Audited Event"
	actionMessage="unlock this event"
	bind:open={showConfirmUnlockAudited}
	onConfirm={unlockAudited}
>
	Unlocking this event will allow scores to be edited, but the event will need to be audited again.
	Are you sure you want to unlock this event?
</ConfirmModal>

<ConfirmModal
	title="Audit Event"
	actionMessage="audit this event"
	bind:open={showAuditConfirm}
	onConfirm={confirmAudit}
	confirmText={data.user.name}
	buttonText="Audit Results"
	color="green"
	disabled={auditList.some((a) => !a)}
>
	Marking this event as audited means that you certify that the scores inputted are correct. Ensure
	the following have been checked:

	<ul class="my-4 space-y-2">
		<li><Checkbox bind:checked={auditList[0]}>Double check all scores</Checkbox></li>
		<li><Checkbox bind:checked={auditList[1]}>Break all ties (except PO/NS/DQ)</Checkbox></li>
		<li>
			<Checkbox bind:checked={auditList[2]}
				>Spot check: Scores match each team, no unreasonable scores expected</Checkbox
			>
		</li>
		<li>
			<Checkbox bind:checked={auditList[3]}>Resolve appeals and adjust scores as necessary</Checkbox
			>
		</li>
		<li>
			<Checkbox bind:checked={auditList[4]}
				>Verify that teams have been notified of penalties (Tiers, PO)</Checkbox
			>
		</li>
		<li>
			<Checkbox bind:checked={auditList[5]}
				>Verify teams that competed (all other teams are NS)</Checkbox
			>
		</li>
		<li>
			<Checkbox bind:checked={auditList[6]}>Resolve DQs through tournament director</Checkbox>
		</li>
		<li>
			<Checkbox bind:checked={auditList[7]}
				>Verify order of all teams: competed, PO, NS, DQ</Checkbox
			>
		</li>
	</ul>

	After checking the above, type your name below to certify these results.
</ConfirmModal>

<Modal title="Edit Event" bind:open={showEditEvent} autoclose outsideclose>
	<Label>
		High Scoring
		<Select
			disabled={locked || data.event.audited}
			underline
			class="mt-2"
			items={highScoring}
			bind:value={editHighScoring}
		/>
	</Label>
	<Label>
		Medals (Optional)
		<Input class="mt-2" type="text" required bind:value={editEventMedals} />
	</Label>

	<svelte:fragment slot="footer">
		<Button color="green" on:click={editEvent}>Save</Button>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>

<Modal title="Save Changes" bind:open={showLockDirty} autoclose outsideclose>
	<P
		>Locking this event will mark grading as done and prevent further edits. Please save or discard
		your existing changes before locking this event.</P
	>

	<svelte:fragment slot="footer">
		<Button color="green">Got it!</Button>
	</svelte:fragment>
</Modal>

<style lang="postcss">
	dt,
	dd {
		@apply inline;
	}
	dt {
		@apply font-semibold;
	}
</style>
