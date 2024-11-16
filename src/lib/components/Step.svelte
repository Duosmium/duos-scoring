<script lang="ts">
	import { TimelineItem } from 'flowbite-svelte';
	import { fade } from 'svelte/transition';

	export let thisStep: number;
	export let step: number;
</script>

{#if thisStep <= step}
	<div transition:fade>
		<TimelineItem {...$$props}>
			<slot />
		</TimelineItem>
	</div>
{/if}
