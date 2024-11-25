<script context="module" lang="ts">
	export interface ChecklistState {
		state: Map<string, Writable<string | number | null>>;
		addState: (key: string, item: Writable<string | number | null>) => void;
	}
</script>

<script lang="ts">
	import { browser } from '$app/environment';

	import type { ScoreStatus } from '$drizzle/types';

	import { setContext } from 'svelte';
	import { get, writable, type Writable } from 'svelte/store';
	import Section from './Section.svelte';
	import QrCode from './QrCode.svelte';

	export let event: string;
	export let year: number;

	export let teamNumber: number;
	export let teamName: string;
	export let checklistData: DbJson.ChecklistData;
	export let checklistUrl: string | undefined = undefined;

	export let score: number;
	export let tier: number;
	export let status: ScoreStatus;

	export let readonly: boolean = false;
	setContext('readonly', readonly);

	let studentNamesValue = '';
	let studentNamesState: Writable<string> | undefined;
	$: if (studentNamesState) $studentNamesState = studentNamesValue;

	let state: ChecklistState['state'] = new Map();

	const onChange = () => {
		state = state;
		if (!browser) return;
		localStorage.setItem(
			'checklist',
			JSON.stringify(
				Object.fromEntries([...state.entries()].map(([k, v]) => [k, get(v)]))
			)
		);
	};

	// TODO: changeme
	if (checklistData) {
		Object.entries(checklistData).forEach(([key, value]) => {
			let store = writable(value);
			state.set(key, store);
			store.subscribe(onChange);
		});
	}

	setContext('checklistState', {
		state,
		addState: (key, item) => {
			state.set(key, item);
			item.subscribe(onChange);
		}
	} as ChecklistState);

	if (state.has('studentNames')) {
		studentNamesState = state.get('studentNames') as Writable<string>;
	} else {
		studentNamesState = writable('');
		state.set('studentNames', studentNamesState);
		studentNamesState.subscribe(onChange);
	}
	studentNamesState.subscribe((value) => {
		studentNamesValue = value;
	});
	state = state;

	$: checklistData = Object.fromEntries(
		[...state.entries()].map(([k, v]) => [k, get(v)])
	);

	let counter = 0;
	setContext('questionCounter', () => {
		return counter++;
	});

	let checklistNumbering = 1;
	setContext('checklistNumbering', () => {
		return checklistNumbering++;
	});
</script>

<div
	class="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-300 dark:bg-slate-700 z-40 rounded-lg p-4 flex items-center space-x-4"
>
	Score: {score} | Tier: {tier} | Status: {status}
</div>

<div class="max-w-screen-lg mx-auto">
	<h1>{event}</h1>
	<h2>Team Checklist - {year}</h2>

	<div>
		<p class="mb-2">
			<span class="font-semibold">Team Number:</span>
			{teamNumber}
		</p>
		<p class="mb-2">
			<span class="font-semibold">School and Team Name:</span>
			{teamName}
		</p>
		<label>
			<span class="font-semibold">Student Names:</span>
			<input type="text" bind:value={studentNamesValue} disabled={readonly} />
		</label>

		<slot />

		{#if checklistUrl}
			<Section title="Student Access" noIcon>
				<p>Scan the QR code below to access this checklist.</p>
				<QrCode class="block mx-auto mt-4 mb-24" url={checklistUrl} />
			</Section>
		{/if}
	</div>
</div>

<style lang="postcss">
	input[type='text']:disabled {
		cursor: default;
	}
	label {
		display: block;
	}
	:where(*) {
		@apply text-gray-800 dark:text-gray-200;
	}
	* :global(input[type='text']),
	* :global(input[type='number']) {
		font-size: 16px;
		font-size: max(16px, 1em);
		font-family: inherit;
		padding: 0.25em 0.5em;
		background-color: transparent;
		line-height: 1;
		height: 2.25rem;
		max-width: 100%;
		@apply border-0 border-b-2 border-slate-900;
	}
	:global(.dark) * :global(input[type='text']),
	:global(.dark) * :global(input[type='number']) {
		@apply border-slate-200;
	}

	* :global(input[inputmode='numeric']),
	* :global(input[type='number']) {
		width: 80px;
	}
	* :global(input[type='number']::-webkit-inner-spin-button),
	* :global(input[type='number']::-webkit-outer-spin-button) {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		margin: 0;
	}
	* :global(input[type='number']) {
		appearance: none;
		-moz-appearance: textfield;
	}
</style>
