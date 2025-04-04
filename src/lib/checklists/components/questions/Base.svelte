<script context="module">
	export const COLORS = {
		green: 'bg-green-100 dark:bg-green-900 ring-green-500',
		red: 'bg-red-100 dark:bg-red-900 ring-red-500',
		yellow: 'bg-yellow-100 dark:bg-yellow-900 ring-yellow-500',
		gray: 'bg-slate-100 dark:bg-slate-800 ring-gray-500'
	};
</script>

<script lang="ts" generics="Value extends string | number | null | undefined">
	import { getContext, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import type { SectionStatus } from '../Section.svelte';
	import type { ChecklistState } from '../Checklist.svelte';

	export let rule: string | undefined;
	export let numberItem: true | undefined;

	export let blank: boolean;
	export let blankOk: boolean;

	export let value: Value;

	let checklistNumber: number;
	if (numberItem) {
		checklistNumber = (getContext('checklistNumbering') as () => number)();
	}

	const notBlank: Writable<boolean> = writable(false);
	const sectionStatus: SectionStatus = getContext('sectionParent');
	if (sectionStatus) {
		sectionStatus.addChild(notBlank);
	}
	$: $notBlank = blankOk || !blank;

	export let highlightFunction: (value: Value) => keyof typeof COLORS;
	$: highlight = COLORS[highlightFunction(value)];

	const questionKey = (
		getContext('questionCounter') as () => number
	)().toString();
	const checklistState: ChecklistState = getContext('checklistState');
	let saveState: Writable<Value>;
	onMount(() => {
		if (checklistState.state.has(questionKey)) {
			saveState = checklistState.state.get(questionKey) as Writable<Value>;
			value = $saveState;
		} else {
			saveState = writable(value);
			checklistState.addState(questionKey, saveState);
		}
	});
	$: saveState && ($saveState = value);
</script>

<div class={'p-2 ring-1 ' + highlight}>
	<div class="flex flex-col sm:flex-row items-start sm:items-baseline">
		<div class="flex flex-row items-center">
			{#if numberItem}
				<strong class="mr-1 mb-1">
					{checklistNumber}.
				</strong>
			{/if}

			{#if $$slots.input}
				<span class="mb-1">
					<slot name="input"></slot>
				</span>
			{/if}
		</div>
		<div class="flex-1">
			{#if rule}
				<strong
					class="mb-1 mr-1 font-medium text-black dark:text-white min-w-fit"
				>
					{rule}
				</strong>
			{/if}

			<slot name="text"></slot>
		</div>
	</div>

	<slot name="children"></slot>
</div>
