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
		Alert
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import type { Score, ScoreStatus } from '@prisma/client';
	import { parse } from 'papaparse';
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
		return data.tournament.teams.map((t, i) => {
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
			.map((t, i) => ({
				...t,
				ranking: typeof t.ranking === 'string' ? statusLookup[t.ranking] : i + 1
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
					team.score[field].new = parseFloat((e.target as HTMLInputElement).value) || null;
					break;
				case 'tier':
					team.score[field].new = parseInt((e.target as HTMLInputElement).value) || null;
					break;
				case 'tiebreak':
					team.score[field].new = parseFloat((e.target as HTMLInputElement).value) || null;
					break;
				case 'status':
					team.score[field].new = (e.target as HTMLSelectElement).value as any;
					break;
				case 'notes':
					team.score[field].new = (e.target as HTMLTextAreaElement).innerText;
					break;
				default:
					break;
			}
			team.score[field].dirty = team.score[field].new !== team.score[field].old;
			modifiedTeams = modifiedTeams;
		};
	}

	let showHelp = false;

	let showImportScores = false;
	let importScoresData = '';
	let parsedImportScores: {
		Number: string;
		'Raw Score': string;
		Tier: string;
		Tiebreak: string;
		Status: string;
	}[] = [];
	let parsedError = '';
	$: {
		parsedImportScores = parse(importScoresData, { header: true }).data as any;
		parsedError = '';
		const missingFields: Set<string> = new Set();
		const invalidStatuses: Set<string> = new Set();
		// TODO: validate stuff
		parsedImportScores.forEach((t) => {
			if (!t.Number) {
				missingFields.add('Number');
			}
			if (!t.Status) {
				missingFields.add('Status');
			} else if (scoreStatuses.every((s) => s.name !== t.Status)) {
				invalidStatuses.add(t.Status);
			}
			if (!t['Raw Score'] && t.Status === 'CO') {
				missingFields.add('Raw Score');
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
			const team = teamLookup.get(parseInt(parsedScore.Number));
			if (!team) return;
			team.score.rawScore.new = parseFloat(parsedScore['Raw Score']) || null;
			team.score.tier.new = parseInt(parsedScore.Tier) || null;
			team.score.tiebreak.new = parseFloat(parsedScore.Tiebreak) || null;
			team.score.status.new = (scoreStatuses.find((s) => s.name === parsedScore.Status)?.value ??
				'NA') as any;

			team.score.rawScore.dirty = team.score.rawScore.new !== team.score.rawScore.old;
			team.score.tier.dirty = team.score.tier.new !== team.score.tier.old;
			team.score.tiebreak.dirty = team.score.tiebreak.new !== team.score.tiebreak.old;
			team.score.status.dirty = team.score.status.new !== team.score.status.old;
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
	function toggleLock() {
		if (!clean) {
			showLockDirty = true;
			return;
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
				addToastMessage(locked ? 'Event marked as done grading!' : "Event unlocked!", 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to lock event!', 'error');
			}
		});
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
		<ButtonGroup>
			<Button color="yellow" on:click={toggleLock}>{locked ? 'Unlock' : 'Lock'}</Button>
			<Button color="alternative" on:click={openEditEvent}>Settings</Button>
		</ButtonGroup>
		<Button
			color="blue"
			pill
			on:click={() => {
				showHelp = true;
			}}>?</Button
		>
	</span>
</div>
<SelectableTable items={modifiedTeams} bind:selected>
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
				on:change={updateData(team.number, 'notes')}
			>
				{team.score.notes.new || ''}
			</Textarea>
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
				<dt>Save/Discard</dt>
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
				<i>(Required)</i>: CO, PO, NS, or DQ for Competed, Participation Only, No Show, or
				Disqualified, respectively.
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
				{@const t = teamLookup.get(parseInt(score.Number))}
				<li>
					<span class="tabular-nums">#{score.Number}:</span>
					<span
						>{t
							? `${t.abbreviation || t.school}${t.suffix ? ' ' + t.suffix : ''}`
							: 'Team Not Found'}</span
					>
					<span class="dark:text-green-300 text-green-700">{score['Raw Score']}</span><span
						class="dark:text-blue-300 text-blue-700"
						>{score.Tier ? ` [Tier ${score.Tier}]` : ''}</span
					><span class="dark:text-pink-300 text-pink-700"
						>{score.Tiebreak ? ` (*${score.Tiebreak})` : ''}</span
					>
					<span class="dark:text-violet-300 text-violet-700">{score.Status}</span>
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


<Modal title="Edit Event" bind:open={showEditEvent} autoclose outsideclose>
	<Label>
		High Scoring
		<Select underline class="mt-2" items={highScoring} bind:value={editHighScoring} />
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
