<script lang="ts">
	import { Button, Input, Label, Modal } from 'flowbite-svelte';
	import type { ComponentProps } from 'svelte';

	export let title: string;
	export let actionMessage: string;
	export let open: boolean;
	export let disabled: boolean = false;
	export let onConfirm: () => void;

	export let confirmText = 'confirm';
	export let color: ComponentProps<Button>['color'] = 'red';
	export let buttonText = 'Confirm';

	let confirmDiscardText = '';
</script>

<Modal
	{title}
	bind:open
	autoclose
	outsideclose
	on:open={() => {
		confirmDiscardText = '';
	}}
	on:close={() => {
		confirmDiscardText = '';
	}}
>
	<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
		<slot />
	</p>
	<Label>
		Type "{confirmText}" to {actionMessage}.
		<Input
			class="mt-2"
			type="text"
			required
			placeholder={confirmText}
			bind:value={confirmDiscardText}
		/>
	</Label>
	<svelte:fragment slot="footer">
		<Button
			{color}
			disabled={confirmDiscardText.toLowerCase() !==
				confirmText.toLowerCase() || disabled}
			on:click={() => {
				if (
					confirmDiscardText.toLowerCase() === confirmText.toLowerCase() &&
					!disabled
				) {
					onConfirm();
					confirmDiscardText = '';
				}
			}}>{buttonText}</Button
		>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
