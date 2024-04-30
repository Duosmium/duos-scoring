<script context="module" lang="ts">
	export interface ChecklistState {
		state: Map<string, Writable<Status | number | null>>;
		addState: (key: string, item: Writable<Status | number | null>) => void;
	}
</script>

<script lang="ts">
	import { setContext } from 'svelte';
	import type { Status } from './Checkbox.svelte';
	import { get, writable, type Writable } from 'svelte/store';
	import { browser } from '$app/environment';

	export let event: string;
	export let year: number;

	{
		let state: ChecklistState['state'] = new Map();

		const saveState = () => {
			localStorage.setItem(
				'checklist',
				JSON.stringify(Object.fromEntries([...state.entries()].map(([k, v]) => [k, get(v)])))
			);
		};

		if (browser) {
			// TODO: changeme
			Object.entries(
				JSON.parse(localStorage.getItem('checklist') || '{}') as Record<
					string,
					Status | number | null
				>
			).forEach(([key, value]) => {
				let store = writable(value);
				state.set(key, store);
				store.subscribe(saveState);
			});

			setContext('checklistState', {
				state,
				addState: (key, item) => {
					state.set(key, item);
					item.subscribe(saveState);
				}
			} as ChecklistState);
		}
	}
</script>

<div class="checklist max-w-screen-lg mx-auto">
	<h1>{event}</h1>
	<h2>Team Checklist - {year}</h2>

	<div>
		<label>
			<span>Team Number:</span>
			<input type="text" inputmode="numeric" />
		</label>

		<label>
			<span>School and Team Name:</span>
			<input type="text" />
		</label>

		<label>
			<span>Student Names:</span>
			<input type="text" />
		</label>

		<slot />
	</div>
</div>

<style lang="postcss">
	label {
		display: block;
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
	* :global(input[disabled]) {
		background-color: #eee;
		cursor: not-allowed;
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
