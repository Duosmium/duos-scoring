<script lang="ts">
	import type { ScoreStatus } from '@prisma/client';

	export let status: ScoreStatus;
	export let checklistItem: number;
</script>

<div>
	<strong>{checklistItem}.</strong>
	<label>
		<input type="checkbox" checked={status === 'DISQUALIFICATION'} />
		<span
			>General Rule: The team is disqualified. (Notify the team and their coach as soon as
			possible.)</span
		>
	</label>
</div>
