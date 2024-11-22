<script lang="ts">
	import { browser } from '$app/environment';
	import type { ScoreStatus } from '$drizzle/types';
	import AirTrajectory from '$lib/checklists/2025/AirTrajectory.svelte';

	let score: number;
	let tier: number;
	let status: ScoreStatus;
</script>

<AirTrajectory
	bind:score
	bind:tier
	bind:status
	teamName="Anytown High School B"
	teamNumber={33}
	checklistData={browser
		? JSON.parse(localStorage.getItem('checklist') || '{}')
		: {}}
	readonly
/>
