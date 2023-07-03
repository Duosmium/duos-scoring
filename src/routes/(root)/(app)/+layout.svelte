<script lang="ts">
	import type { LayoutData } from './$types';
	import { NavLi, NavBrand } from 'flowbite-svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import Navigation from '$lib/components/Navigation.svelte';

	export let data: LayoutData;
</script>

<Navigation user={data.user} session={data.session}>
	<svelte:fragment slot="brand">
		<NavBrand href="/dashboard">
			<span
				class="self-center whitespace-nowrap text-xl font-semibold dark:text-white pl-4 flex items-center"
			>
				<img class="h-12 mr-6 dark:hidden inline-block" src="/logo_dark.png" alt="Duosmium Logo" />
				<img class="h-12 mr-6 dark:inline-block hidden" src="/logo_light.png" alt="Duosmium Logo" />
				Duosmium Scoring
			</span>
		</NavBrand>
	</svelte:fragment>
	<svelte:fragment slot="links">
		<NavLi href="/dashboard">My Tournaments</NavLi>
	</svelte:fragment>
</Navigation>

<main class="px-6 py-12 w-full mx-auto lg:max-w-5xl xl:max-w-7xl">
	<slot />
</main>

<Toasts />
