<script lang="ts">
	import { Button, Input, Label, Modal } from 'flowbite-svelte';

	export let title: string;
	export let actionMessage: string;
	export let open: boolean;
	export let onConfirm: () => void;

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
		Type "confirm" to {actionMessage}.
		<Input
			class="mt-2"
			type="text"
			required
			placeholder="confirm"
			bind:value={confirmDiscardText}
		/>
	</Label>
	<svelte:fragment slot="footer">
		<Button
			color="red"
			disabled={confirmDiscardText !== 'confirm'}
			on:click={() => {
				if (confirmDiscardText === 'confirm') {
					onConfirm();
					confirmDiscardText = '';
				}
			}}>Confirm</Button
		>
		<Button color="alternative">Cancel</Button>
	</svelte:fragment>
</Modal>
