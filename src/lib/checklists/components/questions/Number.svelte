<script lang="ts">
	import { nanoid } from 'nanoid';
	import { getContext } from 'svelte';
	import Base from './Base.svelte';

	export let rule: string | undefined = undefined;
	export let numberItem: true | undefined = undefined;

	export let value: number | null | undefined = undefined;
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;

	export let blankOk = false;

	const id = nanoid(5);
	const readonly: boolean = getContext('readonly');

	$: value &&= Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value));
	$: blank = value == null || isNaN(value);

	export let highlightFunction = (value: number | null | undefined) => {
		if (
			value === null ||
			(value != null && min != null && value < min) ||
			(value != null && max != null && value > max)
		) {
			return 'red';
		}
		if (
			value != null &&
			(max != null ? value < max : min != null && value > min)
		) {
			return 'yellow';
		}
		if (value == null || isNaN(value)) {
			return 'gray';
		}
		return 'green';
	};
</script>

<Base {rule} {numberItem} {blank} {blankOk} bind:value {highlightFunction}>
	<svelte:fragment slot="input">
		<input
			{id}
			class="mx-2"
			type="number"
			{min}
			{max}
			bind:value
			disabled={readonly}
			slot="input"
		/>
	</svelte:fragment>
	<svelte:fragment slot="text">
		<label for={id}>
			<slot />
		</label>
	</svelte:fragment>
</Base>

<style>
	input[type='number']:disabled {
		cursor: default;
	}
</style>
