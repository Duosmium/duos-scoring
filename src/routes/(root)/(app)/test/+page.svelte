<script>
	import { browser } from '$app/environment';
	import AirTrajectory from '$lib/checklists/2025/AirTrajectory.svelte';
</script>

<AirTrajectory
	teamName="Anytown High School B"
	teamNumber={33}
	checklistData={browser
		? JSON.parse(localStorage.getItem('checklist') || '{}')
		: {}}
/>
