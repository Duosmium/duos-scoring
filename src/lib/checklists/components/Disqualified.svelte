<script lang="ts">
	import type { ScoreStatus } from '@prisma/client';
	import { nanoid } from 'nanoid';

	export let status: ScoreStatus;
	export let checklistItem: number;

	const id = nanoid(5);
	export let checked: boolean = status === 'DISQUALIFICATION';

	$: highlight = checked ? 'bg-red-100 dark:bg-red-800 ring-red-500' : 'ring-gray-500';
</script>

<div class={'mb-8 rounded-md p-4 ring-2 ' + highlight}>
	<span class="flex flex-col sm:flex-row items-start">
		<div class="flex flex-row sm:flex-col items-center mr-6">
			<strong class="mb-2 mr-2">
				{checklistItem}. General Rule:
			</strong>
			<span class="mb-2">
				<input {id} type="checkbox" bind:checked />
			</span>
		</div>
		<label for={id} class="flex-1 self-center">
			The team is disqualified. (Notify the team and their coach as soon as possible.)
		</label>
	</span>
</div>
