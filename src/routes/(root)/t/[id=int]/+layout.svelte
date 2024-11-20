<script lang="ts">
	import type { PageData } from './$types';
	import { NavLi } from 'flowbite-svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import Navigation from '$lib/components/Navigation.svelte';

	export let data: PageData;
</script>

<Navigation user={data.user} session={data.session}>
	<svelte:fragment slot="brand">
		<a href="/t/{data.tournament.id}" class="overflow-hidden text-ellipsis">
			{data.tournament.shortName}
			{data.tournament.division}
		</a>
	</svelte:fragment>
	<svelte:fragment slot="links">
		{#if data.role.role !== 'ES'}
			{#if data.role.role === 'TD'}
				<NavLi href="/t/{data.tournament.id}/members">Members</NavLi>
			{/if}
			<NavLi href="/t/{data.tournament.id}/events"
				>Events/Score Counseling</NavLi
			>
			{#if data.tournament.enableTracks}
				<NavLi href="/t/{data.tournament.id}/tracks">Tracks</NavLi>
			{/if}
			<NavLi href="/t/{data.tournament.id}/teams">Teams</NavLi>
			<NavLi href="/t/{data.tournament.id}/results">Results</NavLi>
		{/if}
	</svelte:fragment>
</Navigation>

<main class="px-6 py-12 w-full mx-auto xl:max-w-7xl">
	<slot />
</main>

<Toasts />
