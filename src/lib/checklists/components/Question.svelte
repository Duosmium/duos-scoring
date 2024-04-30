<script lang="ts">
	import { nanoid } from 'nanoid';
	import Checkbox, { Status, type CheckboxValue } from './Checkbox.svelte';
	import { getContext, setContext } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import type { SectionStatus } from './Section.svelte';

	export let rule: string | undefined = undefined;
	export let checklistItem: number | undefined = undefined;
	export let input: boolean = false;

	export let checkbox: CheckboxValue | undefined = undefined;
	export let enableFixed: boolean | undefined = undefined;
	export let linkChildren: boolean = false;

	export let inputValue: number | null = null;
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;

	const id = nanoid(5);

	let parent: Writable<CheckboxValue | undefined> | undefined;
	parent = getContext('checkboxParent');
	let self: Writable<CheckboxValue | undefined> = writable(checkbox);
	$: $self = checkbox;
	if (linkChildren) {
		setContext('checkboxParent', self);
	}

	const notBlank: Writable<boolean> = writable(false);
	const l = (v: number | null) =>
		v != null ? Math.max(min ?? -Infinity, Math.min(max ?? Infinity, v)) : v;
	$: $notBlank = input
		? l(inputValue) !== inputValue
			? false
			: inputValue !== null
		: $checkbox !== Status.Blank;

	const sectionStatus: SectionStatus = getContext('sectionParent');
	if (sectionStatus && !parent) {
		sectionStatus.addChild(notBlank);
	}

	export let highlightFunction = (
		inputValue: number | null,
		checkboxValue: Status | undefined
	): keyof typeof COLORS => {
		if (
			checkboxValue === 'False' ||
			(inputValue != null && min != null && inputValue < min) ||
			(inputValue != null && max != null && inputValue > max)
		) {
			return 'red';
		}
		if (checkboxValue === 'Fixed') {
			return 'yellow';
		}
		if (inputValue != null || checkboxValue === 'True') {
			return 'green';
		}
		return 'gray';
	};

	const COLORS = {
		green: 'bg-green-100 dark:bg-green-900 ring-green-500',
		red: 'bg-red-100 dark:bg-red-900 ring-red-500',
		yellow: 'bg-yellow-100 dark:bg-yellow-900 ring-yellow-500',
		gray: 'bg-slate-100 dark:bg-slate-800 ring-gray-500'
	};

	$: highlight = COLORS[highlightFunction(inputValue, $checkbox)];
</script>

<div class={'p-2 ring-1 ' + highlight}>
	<span class="flex flex-col sm:flex-row items-start sm:items-baseline">
		<div class="flex flex-row items-center mr-2">
			<span class="mb-1 mr-1">
				{#if checklistItem}
					<strong class="mr-0.5">
						{checklistItem}.
					</strong>
				{/if}
				{#if rule}
					<strong class="font-medium">
						Rule {rule}
					</strong>
				{/if}
			</span>
			<span class="mb-1 mr-1">
				{#if !input}
					<Checkbox {enableFixed} parent={$parent} bind:value={checkbox} />
				{:else}
					<input {id} class="mx-2" type="number" {min} {max} bind:value={inputValue} />
				{/if}
			</span>
		</div>
		<span class="flex-1">
			{#if !input}
				<slot />
			{:else}
				<label for={id}>
					<slot />
				</label>
			{/if}
		</span>
	</span>

	{#if $$slots.children}
		<details class="mt-2" open>
			<summary class="mb-2 cursor-pointer">
				<slot name="summary">Check individual parameters:</slot>
			</summary>

			<slot name="children" />
		</details>
	{/if}
</div>
