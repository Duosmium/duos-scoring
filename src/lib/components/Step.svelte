<script lang="ts">
	import { TimelineItem } from 'flowbite-svelte';
	import { getContext } from 'svelte';
	import { get, type Writable } from 'svelte/store';
	import { fade } from 'svelte/transition';

	export let step: number;
	export let hide: boolean = false;
	export let fieldCount = 1;

	getContext<(() => void)[]>('renumber').push(renumber);

	const children = getContext<Writable<number>>('step');
	let thisStep: number;
	renumber();

	function renumber() {
		thisStep = get(children);
		if (!hide) {
			children.update((v) => v + fieldCount);
		}
	}
</script>

{#if thisStep <= step && !hide}
	<div transition:fade>
		<TimelineItem {...$$props}>
			<slot />
		</TimelineItem>
	</div>
{/if}

<style lang="postcss">
	div :global(li:has(.note) > div:first-child) {
		@apply bg-red-600 dark:bg-red-600 animate-bounce;
	}
</style>
