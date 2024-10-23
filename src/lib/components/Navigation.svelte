<script lang="ts">
	import type { Session } from '@supabase/supabase-js';
	import {
		Avatar,
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
	import { sineIn } from 'svelte/easing';

	let navHidden = true;

	const handleClick = (e: MouseEvent) => {
		if ((e.target as HTMLElement).nodeName === 'A') {
			navHidden = true;
		}
	};

	export let user: App.Locals['user'] | null;
	export let session: Session | null;
</script>

<Navbar
	let:hidden
	let:toggle
	class="py-4 mb-4 fixed top-3 z-30 px-0 sm:px-0"
	fluid={true}
>
	<div
		class="mx-auto flex flex-wrap justify-between items-center lg:max-w-5xl xl:max-w-7xl w-full px-6"
	>
		<div class="flex justify-between items-center w-full lg:w-fit">
			<NavBrand href="/">
				<span
					class="self-center text-xl font-semibold dark:text-white flex items-center"
				>
					<span class="min-w-fit">
						<img
							class="h-12 mr-2 dark:hidden inline-block"
							src="/assets/logo_dark.png"
							alt="Duosmium Logo"
						/>
						<img
							class="h-12 mr-2 dark:inline-block hidden"
							src="/assets/logo_light.png"
							alt="Duosmium Logo"
						/>
					</span>
					<slot name="brand">
						<span class="text-ellipsis overflow-hidden">Duosmium Scoring</span>
					</slot>
				</span>
			</NavBrand>
			<NavHamburger
				onClick={() => {
					toggle();
					navHidden = hidden;
				}}
				class="md:block lg:hidden"
			/>
		</div>
		<NavUl
			slideParams={{ delay: 0, duration: 100, easing: sineIn }}
			on:click={handleClick}
			hidden={navHidden}
			divClass="w-full lg:block lg:w-auto"
			ulClass="flex flex-col p-4 mt-4 lg:flex-row lg:space-x-8 lg:mt-0 lg:text-md lg:font-medium items-baseline"
			nonActiveClass="md:py-2 md:px-3 lg:p-0 text-gray-700 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 dark:text-gray-400 lg:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent"
		>
			<slot name="links" />
			{#if user && session}
				<NavLi class="lg:block hidden"
					><Avatar id="user-drop" class="cursor-pointer"
						>{user.name
							.split(' ')
							.map((w) => w[0])
							.join('')
							.toUpperCase()}</Avatar
					>
					<Dropdown triggeredBy="#user-drop">
						<DropdownHeader>
							<span class="block text-sm"> {user.name} </span>
							<span class="block truncate text-sm font-medium">
								{user.email}
							</span>
						</DropdownHeader>
						<DropdownItem href="/dashboard">Dashboard</DropdownItem>
						<DropdownItem href="/settings">Settings</DropdownItem>
						<DropdownDivider />
						<DropdownItem href="/logout">Sign Out</DropdownItem>
					</Dropdown></NavLi
				>
				<div
					class="w-full my-2 lg:hidden border border-gray-600 dark:border-gray-400"
				/>
				<div class="lg:hidden">
					<NavLi href="/dashboard">Dashboard</NavLi>
				</div>
				<div class="lg:hidden">
					<NavLi href="/settings">Settings</NavLi>
				</div>
				<div
					class="w-full my-2 lg:hidden border border-gray-600 dark:border-gray-400"
				/>
				<div class="lg:hidden">
					<NavLi href="/logout">Sign Out</NavLi>
				</div>
			{:else}
				<div
					class="w-full my-2 lg:hidden border border-gray-600 dark:border-gray-400"
				/>
				<NavLi
					href="/login"
					nonActiveClass="bg-indigo-700 text-slate-100 md:py-2 md:px-3 block"
					>Sign In</NavLi
				>
			{/if}
		</NavUl>
	</div>
</Navbar>

<div class="h-24 lg:h-[116px]"></div>
