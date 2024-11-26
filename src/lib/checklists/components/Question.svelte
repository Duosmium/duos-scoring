<script lang="ts">
	import { nanoid } from 'nanoid';
	import Checkbox, { Status, type CheckboxValue } from './Checkbox.svelte';
	import { getContext, onMount, setContext } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import type { SectionStatus } from './Section.svelte';
	import type { ChecklistState } from './Checklist.svelte';

	export let rule: string | undefined = undefined;
	export let numberItem: true | undefined = undefined;
	export let numeric: boolean = false;

	export let checkbox: CheckboxValue | undefined = undefined;
	export let enableFixed: boolean | undefined = undefined;
	export let linkChildren = false;
	export let noInput = false;

	export let inputValue: number | null = null;
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;

	export let blankOk: boolean = false;

	const readonly: boolean = getContext('readonly');

	$: inputValue &&= Math.min(
		max ?? Infinity,
		Math.max(min ?? -Infinity, inputValue)
	);

	let checklistNumber: number;
	if (numberItem) {
		checklistNumber = (getContext('checklistNumbering') as () => number)();
	}

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
	$: $notBlank =
		blankOk || (numeric ? inputValue !== null : $checkbox !== Status.Blank);

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
		if (
			checkboxValue === 'Fixed' ||
			(inputValue != null &&
				(max != null ? inputValue < max : min != null && inputValue > min))
		) {
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

	const questionKey = (
		getContext('questionCounter') as () => number
	)().toString();
	const checklistState: ChecklistState = getContext('checklistState');
	let saveState: Writable<string | number | null> | undefined;
	onMount(() => {
		if (checklistState.state.has(questionKey)) {
			saveState = checklistState.state.get(questionKey);
			if (numeric) {
				inputValue = $saveState as number | null;
			} else {
				$checkbox = $saveState as Status;
			}
		} else {
			saveState = writable(null);
			checklistState.addState(questionKey, saveState);
		}
	});

	$: saveState && ($saveState = numeric ? inputValue : ($checkbox ?? null));
</script>

<div class={'p-2 ring-1 ' + highlight}>
	<div class="flex flex-col sm:flex-row items-start sm:items-baseline">
		<div class="flex flex-row items-center mr-2">
			{#if rule || numberItem}
				<span class="mb-1 mr-1">
					{#if numberItem}
						<strong class="mr-0.5">
							{checklistNumber}.
						</strong>
					{/if}
					{#if rule}
						<strong class="font-medium">
							Rule {rule}
						</strong>
					{/if}
				</span>
			{/if}
			{#if !noInput}
				<span class="mb-1 mr-1">
					{#if !numeric}
						<Checkbox
							{enableFixed}
							parent={$parent}
							bind:value={checkbox}
							{readonly}
						/>
					{:else}
						<input
							{id}
							class="mx-2"
							type="number"
							{min}
							{max}
							bind:value={inputValue}
							disabled={readonly}
						/>
					{/if}
				</span>
			{/if}
		</div>
		<div class="flex-1">
			{#if !numeric}
				<slot />
			{:else}
				<label for={id}>
					<slot />
				</label>
			{/if}
		</div>
	</div>

	{#if $$slots.children}
		<details class="mt-2" open>
			<summary class="mb-2 cursor-pointer">
				<slot name="summary">Check individual parameters:</slot>
			</summary>

			<slot name="children" />
		</details>
	{/if}
</div>

<style>
	input[type='number']:disabled {
		cursor: default;
	}
</style>
