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

	$: highlight = ((input, value) => {
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
	})(input, value);
</script>

<div class={'mb-8 rounded-md p-4 ring-2 ' + highlight}>
	<span class="flex flex-col sm:flex-row items-start">
		<div class="flex flex-row sm:flex-col items-center mr-6">
			<strong class="mb-2 mr-2">
				{#if checklistItem}
					{checklistItem}.
				{/if}
				{#if rule}
					Rule {rule}
				{/if}
			</strong>
			<span class="mb-2">
				{#if !input}
					<Checkbox {parent} bind:value={checkbox} />
				{:else}
					<input {id} type="text" inputmode="numeric" bind:value />
				{/if}
			</span>
		</div>
		<span class="flex-1 self-center">
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
		<details class="mt-4 -mb-6">
			<summary class="mb-6">
				{#if $$slots.summary}
					<slot name="summary" />
				{:else}
					I don't know, check individual parameters:
				{/if}
			</summary>

			<slot name="children" />
		</details>
	{/if}
</div>
