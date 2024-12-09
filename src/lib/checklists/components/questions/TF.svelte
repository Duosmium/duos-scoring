<script lang="ts">
	import Checkbox, { Status, type CheckboxValue } from '../Checkbox.svelte';
	import { getContext, onMount, setContext } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import Base from './Base.svelte';

	export let rule: string | undefined = undefined;
	export let numberItem: true | undefined = undefined;

	export let checkbox: CheckboxValue | undefined = undefined;
	export let enableFixed = false;
	export let linkChildren = false;
	export let childValues: Status[] = [];
	export let noInput = false;

	export let blankOk = false;
	$: blank = $checkbox === Status.Blank;

	$: value = $checkbox;

	const readonly: boolean = getContext('readonly');

	let parent: Writable<CheckboxValue> | undefined;
	parent = getContext('checkboxParent');
	let self: Writable<CheckboxValue | undefined> = writable(checkbox);
	$: $self = checkbox;
	if (linkChildren) {
		setContext('checkboxParent', self);
	}

	export let highlightFunction = (value: Status | undefined) => {
		if (value === 'False') {
			return 'red';
		}
		if (value === 'Fixed') {
			return 'yellow';
		}
		if (value === 'True') {
			return 'green';
		}
		return 'gray';
	};

	onMount(() => {
		$checkbox = value;
	});
</script>

<Base {rule} {numberItem} {blank} {blankOk} bind:value {highlightFunction}>
	<svelte:fragment slot="input">
		{#if !noInput}
			<Checkbox
				bind:childValues
				{enableFixed}
				parent={$parent}
				bind:value={checkbox}
				{readonly}
			/>
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="text">
		<slot />
	</svelte:fragment>

	<svelte:fragment slot="children">
		{#if $$slots.children}
			<details class="mt-2" open>
				<summary class="mb-2 cursor-pointer">
					<slot name="summary">Check individual parameters:</slot>
				</summary>

				<slot name="children" />
			</details>
		{/if}
	</svelte:fragment>
</Base>
