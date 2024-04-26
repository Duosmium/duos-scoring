<script lang="ts">
	import { nanoid } from 'nanoid';
	import Checkbox, { Status, type CheckboxValue } from './Checkbox.svelte';
	import { getContext, setContext } from 'svelte';
	import { writable, type Writable } from 'svelte/store';

	export let rule: string | undefined = undefined;
	export let checklistItem: number | undefined = undefined;
	export let input: boolean = false;
	export let value: number | Status | null = null;
	export let enableFixed: boolean | undefined = undefined;
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;
	export let linkChildren: boolean = false;

	export let checkbox: CheckboxValue | undefined = undefined;
	let textValue: number;
	$: value = input ? textValue : $checkbox ?? Status.Blank;

	const id = nanoid(5);

	let parent: Writable<CheckboxValue | undefined> | undefined;
	parent = getContext('parent');

	let self: Writable<CheckboxValue | undefined> = writable(checkbox);
	if (linkChildren) {
		setContext('parent', self);
	}

	$: $self = checkbox;

	export let highlightFunction = (
		input: boolean,
		value: number | Status | null
	): keyof typeof COLORS => {
		if (
			(!input && value === 'False') ||
			(input && value != null && min != null && (value as number) < min) ||
			(input && value != null && max != null && (value as number) > max)
		) {
			return 'red';
		}
		if (!input && value === 'Fixed') {
			return 'yellow';
		}
		if ((input && value != null) || (!input && value === 'True')) {
			return 'green';
		}
		return 'gray';
	};

	const COLORS = {
		green: 'bg-green-100 dark:bg-green-800 ring-green-500',
		red: 'bg-red-100 dark:bg-red-800 ring-red-500',
		yellow: 'bg-yellow-100 dark:bg-yellow-800 ring-yellow-500',
		gray: 'ring-gray-500'
	};

	$: highlight = COLORS[highlightFunction(input, value)];
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
					<input {id} class="mx-2" type="number" {min} {max} bind:value={textValue} />
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
				{#if $$slots.summary}
					<slot name="summary" />
				{:else}
					Check individual parameters:
				{/if}
			</summary>

			<slot name="children" />
		</details>
	{/if}
</div>
