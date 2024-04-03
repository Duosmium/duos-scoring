<script lang="ts">
	import { nanoid } from 'nanoid';
	import Checkbox, { type CheckboxValue } from './Checkbox.svelte';

	export let rule: string | undefined = undefined;
	export let checklistItem: number | undefined = undefined;
	export let input: boolean = false;
	export let value: any = undefined;
	export let parent: CheckboxValue | undefined = undefined;

	const id = nanoid(5);
</script>

<tr>
	<td
		>{#if checklistItem}<strong>{checklistItem}.</strong>{/if}</td
	>
	<td
		>{#if !input}<Checkbox {parent} bind:value />{:else}<input
				{id}
				type="text"
				inputmode="numeric"
				bind:value
			/>{/if}</td
	>
	<td>{rule ?? ''}</td>
	<td
		>{#if !input}<slot />{:else}<label for={id}><slot /></label>{/if}</td
	>
</tr>
