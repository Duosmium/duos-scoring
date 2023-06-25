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
		Label
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import type { Score } from '@prisma/client';

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
	$: scores = (typeof data.scores === 'boolean' ? [] : data.scores).reduce((acc, s) => {
		acc.set(s.team.id, s);
		return acc;
	}, new Map<bigint, Score>());
	$: teams = data.tournament.teams
		.map((t, i) => ({
			...t,
			index: i,
			checked: false,
			score: scores.get(t.id) ?? null
		}))
		.sort((a, b) => {
			switch (sortBy) {
				case 'number':
					return a.number - b.number;
				case 'school':
					return a.school.localeCompare(b.school);
				case 'score':
					return (
						((b.score?.rawScore ?? 0) - (a.score?.rawScore ?? 0)) *
						(data.event.highScoring ? 1 : -1)
					);
				case 'tier':
					return (a.score?.tier ?? 0) - (b.score?.tier ?? 0);
				case 'status':
					return statusOrder[a.score?.status ?? 'NA'] - statusOrder[b.score?.status ?? 'NA'];
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
			lastIndex = teams.findIndex((t) => t.id === id);
			teams = teams.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t));
		} else {
			const currentTrack = teams.find((t) => t.id === id);
			if (!currentTrack) return;
			const currentIndex = currentTrack.index;
			const currentStatus = currentTrack.checked;
			const minIndex = Math.min(currentIndex, lastIndex);
			const maxIndex = Math.max(currentIndex, lastIndex);
			teams = teams.map((t, i) =>
				i >= minIndex && i <= maxIndex ? { ...t, checked: !currentStatus } : t
			);
			lastIndex = currentIndex;
		}
	}

	function toggleAll() {
		selectAll = !selectAll;
		teams = teams.map((t) => ({ ...t, checked: selectAll }));
	}

	$: selected = teams.filter((t) => t.checked);

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

	let openHelp = false;

	let openImportScores = false;
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
				openImportScores = true;
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
				openHelp = true;
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
				teams = teams.map((t) => ({ ...t, checked: false }));
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
		{#if teams.length === 0}
			<TableBodyRow>
				<TableBodyCell colspan="7" class="text-center">
					<p>No teams have been added yet.</p>
				</TableBodyCell>
			</TableBodyRow>
		{:else}
			{#each teams as team}
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
							class="rounded-none !bg-transparent !border-0 p-2 w-24"
							type="text"
							inputmode="numeric"
							value={team.score?.rawScore ?? ''}
						/>
					</TableBodyCell>
					<TableBodyCell class="p-0">
						<Input
							class="rounded-none !bg-transparent !border-0 p-2 w-12"
							type="text"
							inputmode="numeric"
							value={team.score?.tier ?? ''}
						/>
					</TableBodyCell>
					<TableBodyCell class="p-0">
						<Input
							class="rounded-none !bg-transparent !border-0 p-2 w-16"
							type="text"
							inputmode="numeric"
							value={team.score?.tiebreak ?? ''}
						/>
					</TableBodyCell>
					<TableBodyCell class="p-0">
						<Select
							items={scoreStatuses}
							class="rounded-none !bg-transparent !border-0 w-20 p-2"
							value={team.score?.status ?? 'NA'}
						/>
					</TableBodyCell>
					<TableBodyCell class="px-4">[Rank]</TableBodyCell>
					<TableBodyCell class="p-0">
						<Textarea class="rounded-none !bg-transparent !border-0 p-2 w-36" rows="1">
							{team.score?.notes || ''}
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

<Modal title="Scoring Help" bind:open={openHelp} autoclose outsideclose>
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

<style lang="postcss">
	dt,
	dd {
		@apply inline;
	}
	dt {
		@apply font-semibold;
	}
</style>
