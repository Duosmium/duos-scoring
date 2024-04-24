<script lang="ts">
	import { nanoid } from 'nanoid';
	import Checkbox, { type Status, type CheckboxValue } from './Checkbox.svelte';

	export let rule: string | undefined = undefined;
	export let checklistItem: number | undefined = undefined;
	export let input: boolean = false;
	export let parent: CheckboxValue | undefined = undefined;
	export let value: string | Status = '';

	export let checkbox: CheckboxValue | undefined = undefined;
	$: value = input ? value : $checkbox ?? 'Blank';

	const id = nanoid(5);

	export let highlightFunction = (input: boolean, value: string): string => {
		if ((input && value) || (!input && value === 'True')) {
			return 'bg-green-100 dark:bg-green-800 ring-green-500';
		}
		if (!input && value === 'False') {
			return 'bg-red-100 dark:bg-red-800 ring-red-500';
		}
		if (!input && value === 'Fixed') {
			return 'bg-yellow-100 dark:bg-yellow-800 ring-yellow-500';
		}
		return 'ring-gray-500';
	};

	$: highlight = highlightFunction(input, value);
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
					<Checkbox {parent} bind:value={checkbox} />
				{:else}
					<input {id} class="mx-2" type="number" bind:value />
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
