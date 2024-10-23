<script lang="ts">
	import type { LayoutData } from './$types';
	import { NavLi, NavBrand } from 'flowbite-svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import Navigation from '$lib/components/Navigation.svelte';

	export let data: LayoutData;
</script>

<Navigation user={data.user} session={data.session}>
	<svelte:fragment slot="links">
		<NavLi href="/dashboard">My Tournaments</NavLi>
		<!-- TODO: create tournaments -->
		<!-- <NavLi href="/new">New Tournament</NavLi> -->
	</svelte:fragment>
</Navigation>

<main class="px-6 py-12 w-full mx-auto lg:max-w-5xl xl:max-w-7xl">
	<slot />
</main>

<Toasts />
