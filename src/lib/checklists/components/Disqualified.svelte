<script lang="ts">
	import type { ScoreStatus } from '@prisma/client';
	import Question from './Question.svelte';
	import { Status, type CheckboxValue } from './Checkbox.svelte';

	export let status: ScoreStatus;
	export let checklistItem: number;

	let checkbox: CheckboxValue;
	export let checked: boolean = status === 'DISQUALIFICATION';

	$: checked = $checkbox && $checkbox === Status.True;

	const highlightFunction = (_: number | null, status: Status | undefined) => {
		if (status === 'True') {
			return 'red';
		}
		if (status === 'False') {
			return 'green';
		}
		return 'gray';
	};
</script>

<div class="my-8">
	<Question {checklistItem} input={false} {highlightFunction} bind:checkbox>
		The team is disqualified. (Notify the team and their coach as soon as possible.)
	</Question>
</div>
