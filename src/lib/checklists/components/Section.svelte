<script context="module" lang="ts">
	export interface SectionStatus {
		addChild: (childStatus: Writable<boolean>) => void;
	}
</script>

<script lang="ts">
	import { get, type Writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { CheckCircleOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';

	export let title: string;

	const children: Writable<boolean>[] = [];
	const sectionStatus = {
		addChild: (childStatus: Writable<boolean>) => {
			children.push(childStatus);
			childStatus.subscribe(() => {
				computeChildState();
			});
		}
	};
	setContext('sectionParent', sectionStatus);

	let done = false;
	const computeChildState = () => {
		done = children.every((s) => {
			return get(s);
		});
	};
</script>

<details class="section">
	<summary class="mt-8 mb-6 cursor-pointer flex flex-row items-center">
		<h3 class="m-0 mr-3 inline">{title}</h3>
		{#if done}
			<CheckCircleOutline class="w-8 h-8 text-green-500 dark:text-green-400" />
		{:else}
			<ExclamationCircleOutline class="w-8 h-8 text-red-600 dark:text-red-500" />
		{/if}
	</summary>

	<slot />
</details>

<style>
	summary {
		list-style: none;
	}
	summary::before {
		content: '▶';
		margin-right: 0.75rem;
		width: 0.75rem;
	}
	details[open] summary::before {
		content: '▼';
	}
</style>
