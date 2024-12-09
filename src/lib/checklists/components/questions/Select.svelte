<script lang="ts" generics="Options extends string">
	import { getContext } from 'svelte';
	import Base, { COLORS } from './Base.svelte';

	export let rule: string | undefined = undefined;
	export let numberItem: true | undefined = undefined;

	export let options: readonly Options[] = [];
	export let value: Options | null | undefined = undefined;

	export let blankOk = false;

	const readonly: boolean = getContext('readonly');

	$: blank = value == null;

	export let highlightFunction = (
		value: Options | null | undefined
	): keyof typeof COLORS => {
		if (value != null) {
			return 'green';
		}
		if (value === null) {
			return 'red';
		}
		return 'gray';
	};
</script>

<Base {rule} {numberItem} {blank} {blankOk} bind:value {highlightFunction}>
	<svelte:fragment slot="input">
		<span class="flex flex-row items-center justify-center space-x-2">
			{#each options as option}
				<button
					on:click={() => {
						if (readonly) return;
						if (value === option) {
							value = null;
						} else {
							value = option;
						}
					}}
					class:circled={value === option}
					disabled={readonly}>{option}</button
				>
			{/each}
		</span>
	</svelte:fragment>
	<svelte:fragment slot="text">
		<slot />
	</svelte:fragment>
</Base>

<style lang="postcss">
	button:disabled {
		cursor: default;
	}
	button {
		@apply border-2 border-transparent rounded-full min-w-8 h-8 p-1.5 grid place-content-center;
	}
	.circled {
		@apply border-gray-500;
	}
</style>
