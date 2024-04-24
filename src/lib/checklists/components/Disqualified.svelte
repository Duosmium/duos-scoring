<script lang="ts">
	import type { ScoreStatus } from '@prisma/client';
	import Question from './Question.svelte';
	import { Status, type CheckboxValue } from './Checkbox.svelte';

	export let status: ScoreStatus;
	export let checklistItem: number;

	let checkbox: CheckboxValue;
	export let checked: boolean = status === 'DISQUALIFICATION';

	$: checked = $checkbox && $checkbox === Status.True;

	const highlightFunction = (input: boolean, value: string) => {
		if (value === 'True') {
			return 'bg-red-100 dark:bg-red-800 ring-red-500';
		}
		if (value === 'False') {
			return 'bg-green-100 dark:bg-green-800 ring-green-500';
		}
		return 'ring-gray-500';
	};
</script>

<div class="my-8">
	<Question {checklistItem} input={false} {highlightFunction} bind:checkbox>
		The team is disqualified. (Notify the team and their coach as soon as possible.)
	</Question>
</div>
