<script lang="ts" context="module">
	let messages = writable<
		{ text: string; type: 'success' | 'error' | 'info' }[]
	>([]);
	export function addToastMessage(
		message: string,
		type: 'success' | 'error' | 'info' = 'success'
	) {
		messages.update((m) => [...m, { text: message, type }]);
		setTimeout(() => {
			messages.update((m) => m.slice(1));
		}, 5000);
	}
	export function clearToasts() {
		messages.set([]);
	}
</script>

<script lang="ts">
	import { Toast } from 'flowbite-svelte';
	import { writable } from 'svelte/store';
	import { slide } from 'svelte/transition';
</script>

<div class="fixed bottom-8 right-8 flex flex-col space-y-4">
	{#each $messages as message}
		<Toast
			class="rounded-md"
			color={message.type === 'success'
				? 'green'
				: message.type === 'info'
					? 'blue'
					: 'red'}
			transition={slide}
		>
			<svelte:fragment slot="icon">
				{#if message.type === 'success'}
					<svg
						aria-hidden="true"
						class="w-5 h-5"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
						><path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/></svg
					>
					<span class="sr-only">Check icon</span>
				{:else if message.type === 'error'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="w-5 h-5"
					>
						<path
							d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
						/>
					</svg>
					<span class="sr-only">X icon</span>
				{:else}
					<svg
						class="animate-spin h-5 w-5"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				{/if}
			</svelte:fragment>
			{message.text}
		</Toast>
	{/each}
</div>
