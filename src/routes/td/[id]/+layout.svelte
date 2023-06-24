<script lang="ts">
	import type { PageData } from './$types';
	import Head from '$lib/components/Head.svelte';
	import {
		Avatar,
		DarkMode,
		Dropdown,
		DropdownHeader,
		DropdownItem,
		DropdownDivider,
		Navbar,
		NavBrand,
		NavLi,
		NavUl,
		NavHamburger
	} from 'flowbite-svelte';

	export let data: PageData;
</script>

<Head
	title="{data.tournament.year} {data.tournament.shortName} {data.tournament
		.division} | Duosmium Scoring"
/>

<Navbar
	let:hidden
	let:toggle
	class="py-4 mb-4 sticky top-3 z-30"
	navDivClass="mx-auto flex flex-wrap justify-between items-center lg:max-w-5xl xl:max-w-7xl"
	fluid={true}
>
	<NavBrand href="/td/{data.tournament.id}/">
		<span
			class="self-center whitespace-nowrap text-xl font-semibold dark:text-white pl-4 flex items-center"
		>
			<img class="h-12 mr-6 dark:hidden inline-block" src="/logo_dark.png" alt="Duosmium Logo" />
			<img class="h-12 mr-6 dark:inline-block hidden" src="/logo_light.png" alt="Duosmium Logo" />
			{data.tournament.year}
			{data.tournament.shortName}
			{data.tournament.division}
		</span>
	</NavBrand>
	<NavHamburger on:click={toggle} btnClass="ml-3 lg:hidden" />
	<NavUl
		{hidden}
		divClass="w-full lg:block lg:w-auto pr-8"
		ulClass="flex flex-col p-4 mt-4 lg:flex-row lg:space-x-8 lg:mt-0 lg:text-md lg:font-medium items-baseline"
	>
		<NavLi href="/td/{data.tournament.id}/events">Events/Score Counseling</NavLi>
		{#if data.tournament.enableTracks}
			<NavLi href="/td/{data.tournament.id}/tracks">Tracks</NavLi>
		{/if}
		<NavLi href="/td/{data.tournament.id}/teams">Teams</NavLi>
		<NavLi href="/td/{data.tournament.id}/results">Results</NavLi>
		<!-- TODO: make this pretty on mobile -->
		<NavLi
			><Avatar id="user-drop" class="cursor-pointer"
				>{data.user.name
					.split(' ')
					.map((w) => w[0])
					.join('')
					.toUpperCase()}</Avatar
			>
			<Dropdown triggeredBy="#user-drop">
				<DropdownHeader>
					<span class="block text-sm"> {data.user.name} </span>
					<span class="block truncate text-sm font-medium"> {data.session?.user.email} </span>
				</DropdownHeader>
				<DropdownItem>Dashboard</DropdownItem>
				<DropdownItem>Settings</DropdownItem>
				<DropdownDivider />
				<DropdownItem>Sign out</DropdownItem>
			</Dropdown></NavLi
		>
	</NavUl>
</Navbar>

<main class="px-6 py-12 w-full mx-auto lg:max-w-5xl xl:max-w-7xl">
	<slot />
</main>
