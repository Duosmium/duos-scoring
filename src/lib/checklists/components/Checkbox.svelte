<script context="module" lang="ts">
	export enum Status {
		True = 'True',
		False = 'False',
		Blank = 'Blank',
		Fixed = 'Fixed'
	}

	export interface CheckboxValue {
		subscribe: (subscription: (value: Status) => void) => () => void;
		set: (value: Status) => void;
		addChild: (childStatus: Writable<Status>) => void;
		getFixed: () => boolean;
	}
</script>

<script lang="ts">
	import { get, writable, type Writable } from 'svelte/store';

	export let readonly = false;

	export let enableFixed = false;
	const status: Writable<Status> = writable<Status>(Status.Blank);

	export let parent: CheckboxValue | undefined = undefined;
	$: {
		if (parent) {
			parent.addChild(status);
			enableFixed = parent.getFixed();
		}
	}

	const children: Writable<Status>[] = [];
	const onChildUpdate = (_: any) => {
		const values = children.map(get);
		if (values.every((v) => v === Status.True)) {
			$status = Status.True;
		} else if (values.some((v) => v === Status.False)) {
			$status = Status.False;
		} else if (values.some((v) => v === Status.Fixed)) {
			$status = Status.Fixed;
		} else if (values.some((v) => v === Status.Blank)) {
			$status = Status.Blank;
		}
	};
	status.subscribe((value: Status) => {
		if (value === Status.True) {
			children.forEach((child) => {
				child.set(Status.True);
			});
		}
	});

	export let childValues: Status[] = [];
	$: childValues = children.map(get);

	export const value: CheckboxValue = {
		subscribe: status.subscribe,
		set: status.set,
		addChild: (childStatus: Writable<Status>) => {
			children.push(childStatus);
			childStatus.subscribe(onChildUpdate);
		},
		getFixed: () => enableFixed
	};
</script>

<span
	class="flex flex-row items-center justify-center space-x-2"
	class:readonly
>
	<button
		on:click={() => {
			if (readonly) return;
			if ($status === Status.True) {
				$status = Status.Blank;
			} else {
				$status = Status.True;
			}
		}}
		class:circled={$status === Status.True}
		disabled={readonly}>T</button
	>
	{#if enableFixed}
		<button
			on:click={() => {
				if (readonly) return;
				if ($status === Status.Fixed) {
					$status = Status.Blank;
				} else {
					$status = Status.Fixed;
				}
			}}
			class:circled={$status === Status.Fixed}
			disabled={readonly}>X</button
		>
	{/if}
	<button
		on:click={() => {
			if (readonly) return;
			if ($status === Status.False) {
				$status = Status.Blank;
			} else {
				$status = Status.False;
			}
		}}
		class:circled={$status === Status.False}
		disabled={readonly}>F</button
	>
</span>

<style lang="postcss">
	button:disabled {
		cursor: default;
	}
	button {
		@apply rounded-full w-8 h-8 p-1.5 grid place-content-center;
	}
	.circled {
		@apply border-2 border-gray-500;
	}
</style>
