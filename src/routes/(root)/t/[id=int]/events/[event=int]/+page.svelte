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
	import { beforeNavigate } from '$app/navigation';
	import type { ScoreStatus, Score } from '$drizzle/types';
	import papaparse from 'papaparse';
	import { addToastMessage } from '$lib/components/Toasts.svelte';
	import SelectableTable from '$lib/components/SelectableTable.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import checklists from '$lib/checklists';
	import { sendData } from '../../helpers';

	export let data: PageData;

	const ChecklistComponent =
		checklists[data.tournament.year]?.[data.event.name];

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
	] as const;
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
		const scores = (typeof data.scores === 'boolean' ? [] : data.scores).reduce(
			(acc, s) => {
				acc.set(s.team.id, s);
				return acc;
			},
			new Map<bigint, Score>()
		);
		return data.teams.map((t) => {
			let origScore = scores.get(t.id);
			let score = origScore
				? {
						...origScore,
						rawScore: {
							old: origScore.rawScore,
							new: origScore.rawScore,
							dirty: false
						},
						tier: { old: origScore.tier, new: origScore.tier, dirty: false },
						tiebreak: {
							old: origScore.tiebreak,
							new: origScore.tiebreak,
							dirty: false
						},
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
						},
						checklist: undefined,
						checklistUuid: undefined
					};
			return {
				...t,
				score,
				ranking: -1 as number | (typeof statusLookup)[keyof typeof statusLookup]
			};
		});
	}

	let sortBy = 'number';
	let modifiedTeams = generateModifiedTeams(data);
	let selected: typeof modifiedTeams = [];

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
					if (!isNaN(raw) && team.score.status.new !== 'DISQUALIFICATION') {
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
					if (
						team.score.status.new === 'NOSHOW' ||
						team.score.status.new === 'PARTICIPATION' ||
						team.score.status.new === 'NA'
					) {
						team.score.rawScore.new = null;
						team.score.tier.new = null;
						team.score.tiebreak.new = null;
					}
					break;
				case 'notes':
					team.score.notes.new =
						(e.target as HTMLTextAreaElement).value || null;
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
	let rawParsedImport: {
		Number: string;
		'Team #': string;
		'Raw Score': string;
		Score: string;
		Tier: string;
		Tiebreak: string;
		Tiebreaker: string;
		Status: string;
	}[] = [];
	let parsedImportScores: {
		number: number;
		rawScore: number | null;
		tier: number | null;
		tiebreak: number | null;
		status: ScoreStatus | 'NA';
	}[] = [];
	let parsedError = '';
	$: {
		rawParsedImport = papaparse.parse(importScoresData, { header: true })
			.data as any;
		parsedError = '';
		const missingFields: Set<string> = new Set();
		const invalidStatuses: Set<string> = new Set();
		const invalidTeams: Set<string> = new Set();
		const seenTeams: Set<number> = new Set();
		const duplicateTeams: Set<string> = new Set();
		// TODO: validate stuff
		parsedImportScores = [];
		rawParsedImport.forEach((t) => {
			const parsedNumber = parseInt(
				/\d+/.exec(t.Number || t['Team #'])?.[0] ?? ''
			);
			const team = teamLookup.get(parsedNumber);

			if (!isNaN(parsedNumber) && seenTeams.has(parsedNumber)) {
				duplicateTeams.add(t.Number || t['Team #']);
			} else if (!isNaN(parsedNumber)) {
				seenTeams.add(parsedNumber);
			}
			if (!t.Number && !t['Team #']) {
				missingFields.add('Number');
			} else if (!team) {
				invalidTeams.add(t.Number || t['Team #']);
			}
			if (!t.Status && !t['Raw Score'] && !t.Score) {
				missingFields.add('Status');
			} else if (t.Status && scoreAliases.every((s) => s.name !== t.Status)) {
				invalidStatuses.add(t.Status);
			}
			if (
				!t['Raw Score'] &&
				!t.Score &&
				(t.Status === 'CO' || t.Status === 'C')
			) {
				missingFields.add('Score');
			}

			if (team) {
				const rawScore = ((r) => (isNaN(r) ? null : r))(
					parseFloat(t['Raw Score'] || t.Score)
				);
				const tier = ((t) => (isNaN(t) ? null : t))(parseInt(t.Tier));
				const tiebreak = ((t) => (isNaN(t) ? null : t))(
					parseFloat(t.Tiebreak || t.Tiebreaker)
				);
				const status = scoreAliases.find((s) => s.name === t.Status)?.value;
				parsedImportScores.push({
					number: parsedNumber,
					rawScore,
					tier,
					tiebreak,
					status:
						(rawScore != null || tier != null || tiebreak != null) &&
						status !== 'DISQUALIFICATION'
							? 'COMPETED'
							: (status ?? team.score.status.old)
				});
			}
		});
		if (missingFields.size > 0) {
			parsedError += `Missing fields: ${[...missingFields].join(', ')}; `;
		}
		if (invalidStatuses.size > 0) {
			parsedError += `Invalid statuses: ${[...invalidStatuses].join(', ')}`;
		}
		if (invalidTeams.size > 0) {
			parsedError += `Invalid teams: ${[...invalidTeams].join(', ')}`;
		}
		if (duplicateTeams.size > 0) {
			parsedError += `Duplicate teams: ${[...duplicateTeams].join(', ')}`;
		}
	}
	function importScores() {
		if (locked) return;
		if (parsedError) return;
		parsedImportScores.forEach((parsedScore) => {
			const team = teamLookup.get(parsedScore.number);
			if (!team) return;

			team.score.rawScore.new = parsedScore.rawScore;
			team.score.tier.new = parsedScore.tier;
			team.score.tiebreak.new = parsedScore.tiebreak;
			team.score.status.new = parsedScore.status;
		});
		modifiedTeams = modifiedTeams;
	}

	let showConfirmDiscard = false;
	function discardChanges() {
		modifiedTeams = modifiedTeams.map((t) => ({
			...t,
			score: {
				...t.score,
				rawScore: {
					old: t.score.rawScore.old,
					new: t.score.rawScore.old,
					dirty: false
				},
				tier: { old: t.score.tier.old, new: t.score.tier.old, dirty: false },
				tiebreak: {
					old: t.score.tiebreak.old,
					new: t.score.tiebreak.old,
					dirty: false
				},
				status: {
					old: t.score.status.old,
					new: t.score.status.old,
					dirty: false
				},
				notes: { old: t.score.notes.old, new: t.score.notes.old, dirty: false }
			}
		}));
	}

	let showEditEvent = false;
	let editHighScoring = 'true';
	let editEventMedals = '';
	let editEnableChecklist = false;
	function openEditEvent() {
		showEditEvent = true;
		editHighScoring = data.event.highScoring ? 'true' : 'false';
		editEventMedals = data.event.medals?.toString() || '';
		editEnableChecklist = data.event.enableChecklist;
	}
	function editEvent() {
		sendData({
			method: 'PATCH',
			body: {
				highScoring: editHighScoring,
				enableChecklist:
					ChecklistComponent == undefined ? undefined : editEnableChecklist,
				medals: parseInt(editEventMedals) || undefined
			},
			msgs: {
				info: 'Updating event...',
				success: 'Event edited!',
				error: 'Failed to edit event!'
			}
		});
	}

	async function saveScores(teams: bigint[] = []) {
		if (locked) return;
		const body = modifiedTeams
			.filter(
				(t) =>
					teams.includes(t.id) ||
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
				status: t.score.status.dirty ? t.score.status.new : undefined,
				notes: t.score.notes.dirty ? t.score.notes.new : undefined,
				checklist: t.score.checklist
			}));

		modifiedTeams = modifiedTeams.map((t) => ({
			...t,
			score: {
				...t.score,
				rawScore: {
					old: t.score.rawScore.new,
					new: t.score.rawScore.new,
					dirty: false
				},
				tier: { old: t.score.tier.new, new: t.score.tier.new, dirty: false },
				tiebreak: {
					old: t.score.tiebreak.new,
					new: t.score.tiebreak.new,
					dirty: false
				},
				status: {
					old: t.score.status.new,
					new: t.score.status.new,
					dirty: false
				},
				notes: { old: t.score.notes.new, new: t.score.notes.new, dirty: false }
			}
		}));

		await sendData({
			method: 'PUT',
			body,
			msgs: {
				info: 'Saving scores...',
				success: 'Scores saved!',
				error: 'Failed to save scores!'
			}
		});
		modifiedTeams = generateModifiedTeams(data);
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
		sendData({
			method: 'PATCH',
			body: {
				locked
			},
			msgs: {
				info: `${locked ? 'Locking' : 'Unlocking'} event...`,
				success: `Event ${locked ? 'marked as done grading' : 'unlocked'}!`,
				error: `Failed to ${locked ? 'lock' : 'unlock'} event!`
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
		sendData({
			method: 'PATCH',
			body: {
				audited: true
			},
			msgs: {
				info: 'Auditing event...',
				success: 'Event audited!',
				error: 'Failed to audit event!'
			}
		});
	}

	let checklistTeam: (typeof modifiedTeams)[0];
	let checklistData: DbJson.ChecklistData | undefined;
	let showChecklist = false;
	let checklistUuid: string | undefined;
	$: {
		if (checklistTeam && checklistData) {
			checklistTeam.score.checklist = checklistData;
			checklistTeam.score.rawScore.new = checklistData.score;
			checklistTeam.score.tier.new = checklistData.tier;
			checklistTeam.score.status.new = checklistData.status;
			modifiedTeams = modifiedTeams;
		}
	}
	function openChecklist(team: (typeof modifiedTeams)[0]) {
		if (!ChecklistComponent) return;
		checklistTeam = team;
		checklistData = team.score.checklist ?? undefined;
		checklistUuid = team.score.checklistUuid;
		showChecklist = true;
	}

	function handleKeypress(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			(
				(e.target as HTMLInputElement).parentElement?.parentElement
					?.nextElementSibling?.children[
					((e.target as HTMLInputElement).parentElement as HTMLTableCellElement)
						?.cellIndex ?? 0
				]?.firstElementChild as HTMLInputElement
			)?.focus();
		}
	}

	// Reactive updates intentionally at the end to run last
	$: {
		// break checklist ties
		if (ChecklistComponent && data.event.enableChecklist) {
			modifiedTeams = modifiedTeams.map((t, _, s) => {
				if (t.score.checklist && t.score.checklist.tiebreak.length > 0) {
					const tiedTeams = s.filter(
						(x) =>
							x.score.rawScore.new === t.score.rawScore.new &&
							x.score.tier.new === t.score.tier.new &&
							x.score.status.new === 'COMPETED'
					);
					if (tiedTeams.length <= 1) {
						t.score.tiebreak.new = null;
						return t;
					}

					const sortedTiedTeams = tiedTeams.sort(
						(a, b) =>
							a.score.checklist?.tiebreak
								?.map((x, i) => x - (b.score.checklist?.tiebreak?.[i] ?? 0))
								?.find((x) => x !== 0) ?? 0
					);
					const tiebreak =
						sortedTiedTeams.findIndex((x) => x.id === t.id) / 10 || null;
					t.score.tiebreak.new = tiebreak;
				}

				return t;
			});
		}
	}
	$: {
		const compare = (
			a: (typeof modifiedTeams)[0] | undefined,
			b: (typeof modifiedTeams)[0] | undefined
		) =>
			a && b
				? statusOrder[a.score.status.new] - statusOrder[b.score.status.new] ||
					(a.score.tier.new ?? 1) - (b.score.tier.new ?? 1) ||
					(data.event.highScoring
						? (b.score.rawScore.new ?? 0) - (a.score.rawScore.new ?? 0)
						: (a.score.rawScore.new ?? Infinity) -
							(b.score.rawScore.new ?? Infinity)) ||
					(b.score.tiebreak.new ?? 0) - (a.score.tiebreak.new ?? 0)
				: a
					? -1
					: b
						? 1
						: 0;

		// update rankings when things change
		modifiedTeams = modifiedTeams.sort(compare).map((t, i, s) => {
			// check ties
			if (compare(t, s[i - 1]) === 0 || compare(t, s[i + 1]) === 0) {
				if (t.score.notes.new && t.score.notes.new !== 'TIE') {
					t.score.notes.new =
						'TIE; ' + t.score.notes.new.replace('TIE; ', '').replace('TIE', '');
				} else {
					t.score.notes.new = 'TIE';
				}
			} else {
				t.score.notes.new =
					t.score.notes.new?.replace('TIE; ', '').replace('TIE', '') || null;
			}

			t.ranking =
				t.score.status.new !== 'COMPETED'
					? statusLookup[t.score.status.new]
					: compare(t, s[i - 1]) === 0
						? s[i - 1].ranking
						: i + 1;

			return t;
		});
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
						((b.score?.rawScore.new ??
							(data.event.highScoring ? 0 : Infinity)) -
							(a.score?.rawScore.new ??
								(data.event.highScoring ? 0 : Infinity))) *
							(data.event.highScoring ? 1 : -1) ||
						(a.score?.tier.new ?? Infinity) - (b.score?.tier.new ?? Infinity) ||
						(b.score?.tiebreak.new ?? 0) - (a.score?.tiebreak.new ?? 0)
					);
				case 'tier':
					return (
						(a.score?.tier.new ?? Infinity) - (b.score?.tier.new ?? Infinity)
					);
				case 'status':
					return (
						statusOrder[a.score?.status.new ?? 'NA'] -
						statusOrder[b.score?.status.new ?? 'NA']
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
		(['rawScore', 'tier', 'tiebreak', 'status', 'notes'] as const).every(
			(a) => !t.score[a].dirty
		)
	);
	$: teamLookup = modifiedTeams.reduce((acc, t) => {
		acc.set(t.number, t);
		return acc;
	}, new Map<number, (typeof modifiedTeams)[0]>());
</script>

<Head
	title="{data.event.name} | {data.tournament.year} {data.tournament
		.shortName} {data.tournament.division} | Duosmium Scoring"
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
				<Button
					disabled={clean || locked}
					on:click={() => {
						saveScores();
					}}
					color="green">Save</Button
				>
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
				<Button color="yellow" on:click={toggleLock}
					>{locked ? 'Unlock' : 'Lock'}</Button
				>
				{#if data.role.role !== 'ES' && !data.event.audited}
					<Button color="purple" disabled={!locked} on:click={openAuditConfirm}
						>Audit</Button
					>
				{/if}
				{#if !data.event.audited}
					<Button color="alternative" on:click={openEditEvent}>Settings</Button>
				{/if}
			</ButtonGroup>
		{/if}
		<Button
			color="blue"
			pill
			on:click={() => {
				showHelp = true;
			}}>Help</Button
		>
	</span>
</div>
<SelectableTable items={modifiedTeams} bind:selected cols={10}>
	<svelte:fragment slot="headers">
		<TableHeadCell class="px-2">#</TableHeadCell>
		<TableHeadCell class="px-2">School</TableHeadCell>
		<TableHeadCell class="pl-2 pr-4">Suffix</TableHeadCell>
		{#if ChecklistComponent && data.event.enableChecklist}
			<TableHeadCell class="pl-0 pr-4">Checklist</TableHeadCell>
			<TableHeadCell class="pl-0 pr-4">Incomplete</TableHeadCell>
		{/if}
		<TableHeadCell class="px-0">Raw Score</TableHeadCell>
		<TableHeadCell class="px-0">Tier</TableHeadCell>
		<TableHeadCell class="px-0">Tiebreak</TableHeadCell>
		<TableHeadCell class="px-0">Status</TableHeadCell>
		<TableHeadCell class="px-4">Ranking</TableHeadCell>
		<TableHeadCell class="px-0">Notes</TableHeadCell>
	</svelte:fragment>
	<svelte:fragment slot="item" let:item={team}>
		{@const disableScores =
			team.score.status.new === 'NOSHOW' ||
			team.score.status.new === 'PARTICIPATION'}
		{@const checklistsEnabled =
			ChecklistComponent != undefined && data.event.enableChecklist}
		<TableBodyCell class="px-2">{team.number}</TableBodyCell>
		<TableBodyCell class="px-2"
			>{team.abbreviation ??
				team.school.slice(0, 30) +
					(team.school.length > 30 ? '…' : '')}</TableBodyCell
		>
		<TableBodyCell class="pl-2 pr-4">
			{team.suffix
				? team.suffix.slice(0, 20) + (team.suffix.length > 20 ? '…' : '')
				: ''}
		</TableBodyCell>
		{#if ChecklistComponent && data.event.enableChecklist}
			<TableBodyCell class="pl-0 pr-4">
				<Button
					disabled={locked}
					color="alternative"
					class="border-none p-1 text-primary-600 hover:underline dark:text-primary-500"
					on:click={() => {
						openChecklist(team);
					}}
				>
					Checklist
				</Button>
			</TableBodyCell>
			<TableBodyCell class="pl-0 pr-4"></TableBodyCell>
		{/if}
		<TableBodyCell class="p-0">
			<Input
				disabled={locked || disableScores || checklistsEnabled}
				class={`rounded-none !bg-transparent p-2 w-24 ${
					team.score.rawScore.dirty
						? 'border-2 !border-orange-500'
						: locked || disableScores || checklistsEnabled
							? 'border-0'
							: 'border-x-0 border-t-0 border-b-1 dark:border-b-slate-500 border-b-slate-400'
				} ${locked ? 'disabled:cursor-text' : 'disabled:cursor-not-allowed'} disabled:opacity-100`}
				type="text"
				inputmode="numeric"
				value={team.score.rawScore.new ?? ''}
				on:change={updateData(team.number, 'rawScore')}
				on:keypress={handleKeypress}
			/>
		</TableBodyCell>
		<TableBodyCell class="p-0">
			<Input
				disabled={locked || disableScores || checklistsEnabled}
				class={`rounded-none !bg-transparent p-2 w-12 ${
					team.score.tier.dirty
						? 'border-2 !border-orange-500'
						: locked || disableScores || checklistsEnabled
							? 'border-0'
							: 'border-x-0 border-t-0 border-b-1 dark:border-b-slate-500 border-b-slate-400'
				} ${locked ? 'disabled:cursor-text' : 'disabled:cursor-not-allowed'} disabled:opacity-100`}
				type="text"
				inputmode="numeric"
				value={team.score.tier.new ?? ''}
				on:change={updateData(team.number, 'tier')}
				on:keypress={handleKeypress}
			/>
		</TableBodyCell>
		<TableBodyCell class="p-0">
			<Input
				disabled={locked || disableScores}
				class={`rounded-none !bg-transparent p-2 w-16 ${
					team.score.tiebreak.dirty
						? 'border-2 !border-orange-500'
						: locked || disableScores
							? 'border-0'
							: 'border-x-0 border-t-0 border-b-1 dark:border-b-slate-500 border-b-slate-400'
				} ${locked ? 'disabled:cursor-text' : 'disabled:cursor-not-allowed'} disabled:opacity-100`}
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
				class={`rounded-none !bg-transparent p-2 w-36 ${
					team.score.notes.dirty
						? 'border-2 !border-orange-500'
						: locked
							? 'border-0'
							: 'border-x-0 border-t-0 border-b-1 dark:border-b-slate-500 border-b-slate-400'
				} ${locked ? 'disabled:cursor-text' : 'disabled:cursor-not-allowed'} disabled:opacity-100`}
				rows="1"
				value={team.score.notes.new ?? ''}
				on:change={updateData(team.number, 'notes')}
			/>
		</TableBodyCell>
	</svelte:fragment>
</SelectableTable>

<Modal title="Scoring Help" bind:open={showHelp} autoclose outsideclose>
	<P class="dark:text-gray-300"
		>Welcome to scoring! Enter scores for your event here.</P
	>
	<Heading tag="h2" class="text-xl">Toolbar</Heading>
	<P class="dark:text-gray-300">
		<dl class="space-y-3 mt-6">
			<div>
				<dt>Sorting:</dt>
				<dd>Sort events by various columns.</dd>
			</div>
			<div>
				<dt>Import:</dt>
				<dd>
					Paste in scores from an external source, such as a Google Sheet.
				</dd>
			</div>
			<div>
				<dt>Save/Discard:</dt>
				<dd>
					Changes you have made will be highlighted in orange. You will need to
					click "Save" to commit your changes, or use "Discard" to revert back
					to the original scores.
				</dd>
			</div>
			<div>
				<dt>Lock/Unlock:</dt>
				<dd>
					Locking an event will prevent scores from being edited and indicates
					that the event is done grading.
				</dd>
			</div>
			<div>
				<dt>Settings:</dt>
				<dd>
					Change the event's scoring method (high, low) or the number of medals
					offered.
				</dd>
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
					Only used in some build and hybrid events. <strong
						>Leave blank if not used.</strong
					> Lower number tier (1) is ranked better than a higher number tier (2,
					3, 4).
				</dd>
			</div>
			<div>
				<dt>Tiebreak:</dt>
				<dd>
					A value between 0 and 1. Give the tiebreaker to the better ranked
					team.
				</dd>
			</div>
			<div>
				<dt>Status:</dt>
				<dd>
					If a team competed as normal, select <strong>"CO" (Competed)</strong>.
					If a team participated but cannot be assigned a raw score, select
					<strong>"PO" (Participation)</strong>. If a team did not show up,
					select
					<strong>"NS" (No Show)</strong>. If a team is disqualified, select
					<strong>"DQ" (Disqualification)</strong>. If any score is entered into
					the "Raw Score", "Tier", or "Tiebreak" columns, status cannot be set
					to "PO" or "NS". Remove scores before modifying the status.
				</dd>
			</div>
		</dl>
	</P>
</Modal>

<Modal
	title="Import Scores"
	bind:open={showImportScores}
	autoclose
	outsideclose
>
	<P>
		To import scores, paste in a CSV or TSV of the data. You can use <a
			href="https://docs.google.com/spreadsheets/d/12fKJX4-gEuy_tp1AaDC6MkLhHcHmcAVmy5BrZFr9yb4/copy"
			>this spreadsheet</a
		>
		as a template for data import if necessary. Include the following headings when
		you copy and paste:
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
				<i>(Optional)</i>: Only used in some build/hybrid events. Lower number
				tier is better than higher number.
			</Li>
			<Li
				><code class="dark:text-pink-300 text-pink-700">Tiebreak</code>
				<i>(Optional unless there's a tie)</i>: A number between 0-1. Give the
				tiebreaker to the better ranked team.
			</Li>
			<Li
				><code class="dark:text-violet-300 text-violet-700">Status</code>
				<i>(Optional, default CO)</i>: CO, PO, NS, or DQ for Competed,
				Participation Only, No Show, or Disqualified, respectively.
			</Li>
		</List>
	</P>
	<Label>
		Teams
		<Textarea
			disabled={locked}
			class="mt-2"
			required
			bind:value={importScoresData}
		/>
	</Label>

	<Heading tag="h3" class="text-md">Preview</Heading>

	{#if parsedError}
		<Alert class="mt-2" color="red">{parsedError}</Alert>
	{:else if parsedImportScores.length !== 0}
		<ol>
			{#each parsedImportScores as score}
				{@const t = teamLookup.get(score.number)}
				<li>
					<span class="tabular-nums">#{score.number}:</span>
					<span
						>{t
							? `${t.abbreviation || t.school}${t.suffix ? ' ' + t.suffix : ''}`
							: 'Team Not Found'}</span
					>
					<span class="dark:text-green-300 text-green-700"
						>{score.rawScore ?? ''}</span
					><span class="dark:text-blue-300 text-blue-700"
						>{score.tier ? ` [Tier ${score.tier}]` : ''}</span
					><span class="dark:text-pink-300 text-pink-700"
						>{score.tiebreak ? ` (*${score.tiebreak})` : ''}</span
					>
					<span class="dark:text-violet-300 text-violet-700"
						>{statusLookup[score.status]}</span
					>
				</li>
			{/each}
		</ol>
	{:else}
		<P>Waiting for score input...</P>
	{/if}

	<svelte:fragment slot="footer">
		<!-- TODO: validation -->
		<Button
			color="green"
			disabled={parsedError.length !== 0}
			on:click={importScores}>Save</Button
		>
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
	Unlocking this event will allow scores to be edited, but the event will need
	to be audited again. Are you sure you want to unlock this event?
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
	Marking this event as audited means that you certify that the scores inputted
	are correct. Ensure the following have been checked:

	<ul class="my-4 space-y-2">
		<li>
			<Checkbox bind:checked={auditList[0]}>Double check all scores</Checkbox>
		</li>
		<li>
			<Checkbox bind:checked={auditList[1]}
				>Break all ties (except PO/NS/DQ)</Checkbox
			>
		</li>
		<li>
			<Checkbox bind:checked={auditList[2]}
				>Spot check: Scores match each team, no unreasonable scores expected</Checkbox
			>
		</li>
		<li>
			<Checkbox bind:checked={auditList[3]}
				>Resolve appeals and adjust scores as necessary</Checkbox
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
			<Checkbox bind:checked={auditList[6]}
				>Resolve DQs through tournament director</Checkbox
			>
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
	{#if ChecklistComponent}
		<Checkbox
			disabled={locked || data.event.audited}
			class="mt-2"
			bind:checked={editEnableChecklist}>Enable Digital Checklists</Checkbox
		>
	{/if}
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
		>Locking this event will mark grading as done and prevent further edits.
		Please save or discard your existing changes before locking this event.</P
	>

	<svelte:fragment slot="footer">
		<Button color="green">Got it!</Button>
	</svelte:fragment>
</Modal>

<Modal
	title="Checklists"
	size="xl"
	bind:open={showChecklist}
	on:close={() => {
		saveScores([checklistTeam.id]);
	}}
	outsideclose
>
	<svelte:component
		this={ChecklistComponent}
		teamNumber={checklistTeam.number}
		teamName={checklistTeam.school +
			(checklistTeam.suffix ? ' ' + checklistTeam.suffix : '')}
		bind:checklistData
		checklistUrl={checklistUuid
			? `https://scoring.duosmium.org/checklists/${checklistUuid}`
			: undefined}
	/>
	{#if checklistUuid == undefined}
		<p
			class="text-center text-lg text-slate-800 dark:text-slate-200 !-mt-20 !mb-28"
		>
			Save this checklist to generate a student access code.
		</p>
	{/if}
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
