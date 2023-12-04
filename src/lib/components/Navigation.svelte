<script lang="ts">
	import {
		Avatar,
		Dropdown,
		DropdownHeader,
		DropdownItem,
		DropdownDivider,
		Navbar,
		NavLi,
		NavUl,
		NavHamburger
	} from 'flowbite-svelte';

	export let user: any;
	export let session: any;
</script>

<Navbar let:NavContainer let:hidden let:toggle class="py-4 mb-4 sticky top-3 z-30" fluid={true}>
	<NavContainer
		class="mx-auto flex flex-wrap justify-between items-center lg:max-w-5xl xl:max-w-7xl px-6"
	>
		<div class="flex justify-between items-center w-full lg:w-fit">
			<slot name="brand" />
			<NavHamburger on:click={toggle} class="md:block lg:hidden" />
		</div>
		<NavUl
			{hidden}
			divClass="w-full lg:block lg:w-auto"
			ulClass="flex flex-col p-4 mt-4 lg:flex-row lg:space-x-8 lg:mt-0 lg:text-md lg:font-medium items-baseline"
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
							<span class="block truncate text-sm font-medium"> {session.user.email} </span>
						</DropdownHeader>
						<DropdownItem href="/dashboard">Dashboard</DropdownItem>
						<DropdownItem href="/settings">Settings</DropdownItem>
						<DropdownDivider />
						<DropdownItem href="/logout">Sign Out</DropdownItem>
					</Dropdown></NavLi
				>
				<div class="w-full my-2 lg:hidden border border-gray-600 dark:border-gray-400" />
				<div class="lg:hidden">
					<NavLi href="/dashboard">Dashboard</NavLi>
				</div>
				<div class="lg:hidden">
					<NavLi href="/settings">Settings</NavLi>
				</div>
				<div class="w-full my-2 lg:hidden border border-gray-600 dark:border-gray-400" />
				<div class="lg:hidden">
					<NavLi href="/logout">Sign Out</NavLi>
				</div>
			{:else}
				<NavLi href="/login">Sign In</NavLi>
			{/if}
		</NavUl>
	</NavContainer>
</Navbar>
