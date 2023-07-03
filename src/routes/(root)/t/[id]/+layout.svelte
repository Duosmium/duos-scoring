<script lang="ts">
	import type { PageData } from './$types';
	import { NavLi } from 'flowbite-svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import Navigation from '$lib/components/Navigation.svelte';

	export let data: PageData;
</script>

<Navigation user={data.user} session={data.session}>
	<svelte:fragment slot="brand">
		<span
			class="self-center whitespace-nowrap text-xl font-semibold dark:text-white flex items-center"
		>
			<a href="/dashboard">
				<img class="h-12 mr-6 dark:hidden inline-block" src="/logo_dark.png" alt="Duosmium Logo" />
				<img class="h-12 mr-6 dark:inline-block hidden" src="/logo_light.png" alt="Duosmium Logo" />
			</a>
			<a href="/t/{data.tournament.id}" class="overflow-hidden text-ellipsis">
				{data.tournament.shortName}
				{data.tournament.division}
			</a>
		</span>
	</svelte:fragment>
	<svelte:fragment slot="links">
		{#if data.role.isDirector}
			<NavLi href="/t/{data.tournament.id}/members">Members</NavLi>
			<NavLi href="/t/{data.tournament.id}/events">Events/Score Counseling</NavLi>
			{#if data.tournament.enableTracks}
				<NavLi href="/t/{data.tournament.id}/tracks">Tracks</NavLi>
			{/if}
			<NavLi href="/t/{data.tournament.id}/teams">Teams</NavLi>
			<NavLi href="/t/{data.tournament.id}/results">Results</NavLi>
		{/if}
	</svelte:fragment>
</Navigation>

<main class="px-6 py-12 w-full mx-auto lg:max-w-5xl xl:max-w-7xl">
	<slot />
</main>

<Toasts />
