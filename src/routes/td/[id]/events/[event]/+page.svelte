<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';

	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Checkbox,
		Button,
		Heading,
		Modal,
		Input,
		Toast,
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
	import { slide } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import type { Score, ScoreStatus, Team } from '@prisma/client';
	import { parse } from 'papaparse';

	export let data: PageData;

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
		NA: 4
	};

	let sortBy = 'number';
	let scores = (typeof data.scores === 'boolean' ? [] : data.scores).reduce((acc, s) => {
		acc.set(s.team.id, s);
		return acc;
	}, new Map<bigint, Score>());
	let teamLookup = data.tournament.teams.reduce((acc, t) => {
		acc.set(t.number, t);
		return acc;
	}, new Map<number, Team>());
	let modifiedTeams = data.tournament.teams.map((t, i) => {
		let origScore = scores.get(t.id);
		let score = origScore
			? {
					...origScore,
					rawScore: { old: origScore.rawScore, new: origScore.rawScore, dirty: false },
					tier: { old: origScore.tier, new: origScore.tier, dirty: false },
					tiebreak: { old: origScore.tiebreak, new: origScore.tiebreak, dirty: false },
					status: {
						old: origScore.status ?? ('NA' as ScoreStatus & 'NA'),
						new: origScore.status ?? ('NA' as ScoreStatus & 'NA'),
						dirty: false
					},
					notes: { old: origScore.notes, new: origScore.notes, dirty: false }
			  }
			: {
					rawScore: { old: null, new: null, dirty: false },
					tier: { old: null, new: null, dirty: false },
					tiebreak: { old: null, new: null, dirty: false },
					status: { old: 'NA' as 'NA', new: 'NA' as 'NA', dirty: false },
					notes: { old: null, new: null, dirty: false }
			  };
		return { ...t, index: i, checked: false, score };
	});
	$: modifiedTeams.sort((a, b) => {
		switch (sortBy) {
			case 'number':
				return a.number - b.number;
			case 'school':
				return a.school.localeCompare(b.school);
			case 'score':
				return (
					((b.score?.rawScore.new ?? 0) - (a.score?.rawScore.new ?? 0)) *
					(data.event.highScoring ? 1 : -1)
				);
			case 'tier':
				return (a.score?.tier.new ?? 0) - (b.score?.tier.new ?? 0);
			case 'status':
				return statusOrder[a.score?.status.new ?? 'NA'] - statusOrder[b.score?.status.new ?? 'NA'];
			case 'ranking':
				// TODO: implement ranking
				return 0;
			default:
				return 0;
		}
	});

	let selectAll = false;
	let lastIndex = -1;
	function toggleCheck(id: bigint) {
		selectAll = false;
		if (!shiftDown) {
			lastIndex = modifiedTeams.findIndex((t) => t.id === id);
			modifiedTeams = modifiedTeams.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t));
		} else {
			const currentTrack = modifiedTeams.find((t) => t.id === id);
			if (!currentTrack) return;
			const currentIndex = currentTrack.index;
			const currentStatus = currentTrack.checked;
			const minIndex = Math.min(currentIndex, lastIndex);
			const maxIndex = Math.max(currentIndex, lastIndex);
			modifiedTeams = modifiedTeams.map((t, i) =>
				i >= minIndex && i <= maxIndex ? { ...t, checked: !currentStatus } : t
			);
			lastIndex = currentIndex;
		}
	}

	function toggleAll() {
		selectAll = !selectAll;
		modifiedTeams = modifiedTeams.map((t) => ({ ...t, checked: selectAll }));
	}

	$: selected = modifiedTeams.filter((t) => t.checked);

	let shiftDown = false;
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Shift') {
			shiftDown = true;
		}
	}
	function handleKeyup(event: KeyboardEvent) {
		if (event.key === 'Shift') {
			shiftDown = false;
		}
	}

	let messages: { text: string; type: 'success' | 'error' }[] = [];
	function addToastMessage(message: string, type: 'success' | 'error' = 'success') {
		messages = [...messages, { text: message, type }];
		setTimeout(() => {
			messages = messages.slice(1);
		}, 3000);
	}

	function updateData(
		team: (typeof modifiedTeams)[0],
		field: 'rawScore' | 'tier' | 'tiebreak' | 'status' | 'notes'
	) {
		return (e: Event) => {
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
		if (parsedError) return;
		fetch(`/td/${$page.params['id']}/events/${$page.params['event']}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(parsedImportScores.map((t) => ({})))
		}).then((res) => {
			if (res.status === 200) {
				importScoresData = '';
				addToastMessage('Scores imported!', 'success');
				invalidateAll();
			} else {
				addToastMessage('Failed to add scores!', 'error');
			}
		});
	}
</script>

<Head
	title="{data.event.name} | {data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyup} />

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
			on:click={() => {
				showImportScores = true;
			}}>Import</Button
		>
		<ButtonGroup>
			<Button color="alternative">Save</Button>
			<Button color="alternative">Lock</Button>
			<Button color="alternative">Discard</Button>
			<Button color="alternative">Settings</Button>
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
{#if selected.length > 0}
	<div
		class="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-300 dark:bg-slate-700 z-40 rounded-lg p-4 flex items-center space-x-4"
	>
		<span>{selected.length} selected</span>
		<Button
			size="sm"
			color="alternative"
			btnClass="bg-transparent border-none underline p-2"
			on:click={() => {
				modifiedTeams = modifiedTeams.map((t) => ({ ...t, checked: false }));
			}}>Clear</Button
		>
	</div>
{/if}
<Table divClass="relative overflow-x-auto" hoverable={true}>
	<!-- top-[92px] lg:top-[116px] -->
	<TableHead>
		<TableHeadCell class="!p-4">
			<Checkbox on:click={toggleAll} checked={selectAll} />
		</TableHeadCell>
		<TableHeadCell class="px-2">#</TableHeadCell>
		<TableHeadCell class="px-2">School</TableHeadCell>
		<TableHeadCell class="pl-2 pr-4">Suffix</TableHeadCell>
		<TableHeadCell class="px-0">Raw Score</TableHeadCell>
		<TableHeadCell class="px-0">Tier</TableHeadCell>
		<TableHeadCell class="px-0">Tiebreak</TableHeadCell>
		<TableHeadCell class="px-0">Status</TableHeadCell>
		<TableHeadCell class="px-4">Ranking</TableHeadCell>
		<TableHeadCell class="px-0">Notes</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#if modifiedTeams.length === 0}
			<TableBodyRow>
				<TableBodyCell colspan="7" class="text-center">
					<p>No teams have been added yet.</p>
				</TableBodyCell>
			</TableBodyRow>
		{:else}
			{#each modifiedTeams as team}
				<TableBodyRow>
					<TableBodyCell class="!p-4">
						<Checkbox
							on:click={() => {
								toggleCheck(team.id);
							}}
							checked={team.checked}
						/>
					</TableBodyCell>
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
							class={`rounded-none !bg-transparent p-2 w-24 !border-orange-500 ${
								team.score.rawScore.dirty ? '!border-2' : '!border-0'
							}`}
							type="text"
							inputmode="numeric"
							value={team.score.rawScore.new ?? ''}
							on:change={updateData(team, 'rawScore')}
						/>
					</TableBodyCell>
					<TableBodyCell class="p-0">
						<Input
							class={`rounded-none !bg-transparent p-2 w-12 !border-orange-500 ${
								team.score.tier.dirty ? '!border-2' : '!border-0'
							}`}
							type="text"
							inputmode="numeric"
							value={team.score.tier.new ?? ''}
							on:change={updateData(team, 'tier')}
						/>
					</TableBodyCell>
					<TableBodyCell class="p-0">
						<Input
							class={`rounded-none !bg-transparent p-2 w-16 !border-orange-500 ${
								team.score.tiebreak.dirty ? '!border-2' : '!border-0'
							}`}
							type="text"
							inputmode="numeric"
							value={team.score.tiebreak.new ?? ''}
							on:change={updateData(team, 'tiebreak')}
						/>
					</TableBodyCell>
					<TableBodyCell class="p-0">
						<Select
							items={scoreStatuses}
							class={`rounded-none !bg-transparent w-20 p-2 !border-orange-500 ${
								team.score.status.dirty ? '!border-2' : '!border-0'
							}`}
							value={team.score.status.new ?? 'NA'}
							on:change={updateData(team, 'status')}
						/>
					</TableBodyCell>
					<TableBodyCell class="px-4">[Rank]</TableBodyCell>
					<TableBodyCell class="p-0">
						<Textarea
							class={`rounded-none !bg-transparent p-2 w-36 !border-orange-500 ${
								team.score.notes.dirty ? '!border-2' : '!border-0'
							}`}
							rows="1"
							on:change={updateData(team, 'notes')}
						>
							{team.score.notes.new || ''}
						</Textarea>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		{/if}
	</TableBody>
</Table>

<div class="fixed bottom-8 right-8 flex flex-col space-y-4">
	{#each messages as message}
		<Toast color={message.type === 'success' ? 'green' : 'red'} transition={slide}>
			<svelte:fragment slot="icon">
				{#if message.type === 'success'}
					<svg
						aria-hidden="true"
						class="w-5 h-5"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
						><path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/></svg
					>
					<span class="sr-only">Check icon</span>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="w-5 h-5"
					>
						<path
							d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
						/>
					</svg>
					<span class="sr-only">X icon</span>
				{/if}
			</svelte:fragment>
			{message.text}
		</Toast>
	{/each}
</div>

<Modal title="Scoring Help" bind:open={showHelp} autoclose outsideclose>
	<P class="dark:text-gray-300">
		Welcome to scoring! Enter scores for your event here.

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
		<Textarea class="mt-2" required bind:value={importScoresData} />
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

<style lang="postcss">
	dt,
	dd {
		@apply inline;
	}
	dt {
		@apply font-semibold;
	}
</style>
