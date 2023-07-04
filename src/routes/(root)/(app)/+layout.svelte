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
			<span class="self-center text-xl font-semibold dark:text-white flex items-center">
				<span class="min-w-fit">
					<img
						class="h-12 mr-2 dark:hidden inline-block"
						src="/logo_dark.png"
						alt="Duosmium Logo"
					/>
					<img
						class="h-12 mr-2 dark:inline-block hidden"
						src="/logo_light.png"
						alt="Duosmium Logo"
					/>
				</span>
				<span class="text-ellipsis overflow-hidden">Duosmium Scoring</span>
			</span>
		</NavBrand>
	</svelte:fragment>
	<svelte:fragment slot="links">
		<NavLi href="/dashboard">My Tournaments</NavLi>
		<NavLi href="/new">New Tournament</NavLi>
	</svelte:fragment>
</Navigation>

<main class="px-6 py-12 w-full mx-auto lg:max-w-5xl xl:max-w-7xl">
	<slot />
</main>

<Toasts />
