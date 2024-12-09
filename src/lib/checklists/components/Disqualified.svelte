<script lang="ts">
	import type { ScoreStatus } from '$drizzle/types';
	import TF from './questions/TF.svelte';
	import { Status, type CheckboxValue } from './Checkbox.svelte';

	export let status: ScoreStatus;

	let checkbox: CheckboxValue;
	export let checked: boolean = status === 'DISQUALIFICATION';

	$: checked = $checkbox === Status.True;

	const highlightFunction = (status: Status | undefined) => {
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
	<TF numberItem {highlightFunction} bind:checkbox>
		The team is disqualified. (Notify the team and their coach as soon as
		possible.)
	</TF>
</div>
