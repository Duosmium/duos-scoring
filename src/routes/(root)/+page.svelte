<script>
	import { NavBrand, NavLi } from 'flowbite-svelte';
	import { ChevronRightOutline } from 'flowbite-svelte-icons';

	import Head from '$lib/components/Head.svelte';
	import Navigation from '$lib/components/Navigation.svelte';

	import Card from '$lib/components/landing/Card.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import Section from '$lib/components/landing/Section.svelte';

	export let data;
</script>

<Head title="Duosmium Scoring" />

<Navigation user={data.user} session={data.session}>
	<svelte:fragment slot="links">
		<NavLi href="#benefits">Solutions</NavLi>
		<NavLi href="#features">Features</NavLi>
		<NavLi href="#pricing">Pricing</NavLi>
	</svelte:fragment>
</Navigation>

<main class="mt-12 mb-24 isolate overflow-x-hidden">
	<Hero title="Score Smarter, Not Harder">
		<svelte:fragment slot="description">
			Managing scoring for Science Olympiad can quickly become a logistical
			nightmare. Ditch outdated systems and embrace <b>real-time</b>,
			<b>transparent</b>, and <b>efficient</b> scoring with Duosmium.
		</svelte:fragment>

		<svelte:fragment slot="cta">
			<a
				data-sveltekit-preload-data="hover"
				href="/login"
				class="rounded-md pl-3 pr-1 py-2 flex items-center max-w-fit border-2 border-indigo-600 bg-indigo-600 text-slate-100 hover:shadow-md my-2"
				>Let's Go!<ChevronRightOutline size="lg" class="ml-1"
				></ChevronRightOutline></a
			>
		</svelte:fragment>
	</Hero>

	<Section
		wrapperClass="bg-slate-200 dark:bg-slate-900 pt-8"
		contentClass="max-w-4xl mx-auto"
	>
		<svelte:fragment slot="title"
			><span class="underline decoration-sky-500 decoration-8">Next-level</span>
			scoring for Science Olympiad</svelte:fragment
		>
		<svelte:fragment slot="content">
			<p class="leading-relaxed text-lg text-center">
				Duosmium Scoring is designed to transform how you run Science Olympiad
				tournaments. Traditional systems can be slow, outdated, and prone to
				errors. Say goodbye to the stress of manual scoring and let Duosmium
				make your tournament smoother and more efficient.
			</p>
		</svelte:fragment>
	</Section>

	<Section
		wrapperClass="bg-slate-200 mb-36 dark:bg-slate-900"
		contentClass="flex flex-wrap justify-center items-stretch -mb-36"
		id="benefits"
	>
		<svelte:fragment slot="title">Why Duosmium?</svelte:fragment>
		<svelte:fragment slot="content">
			<Card title="Real-time Collaboration">
				<svg
					slot="icon"
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
					/>
				</svg>
				Duosmium's online scoring system allows tournament directors to invite event
				supervisors and scoremasters. Contributors can collaborate within each event
				to add scores.
			</Card>
			<Card title="Award Slides Generation">
				<svg
					slot="icon"
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
					/>
				</svg>
				Generate your customizable awards slideshow—in real time—as scores are coming
				in! Duosmium Scoring supports all sorts of scoring systems and is easy to
				integrate into your existing workflow.
			</Card>
			<Card title="Score Counseling">
				<svg
					slot="icon"
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
					/>
				</svg>
				Audit your events, right in Duosmium Scoring! Scoremasters can view the status
				of every event and ensure that scores are being entered correctly.
			</Card>
			<Card title="Results Publishing">
				<svg
					slot="icon"
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
					/>
				</svg>
				Duosmium Scoring integrates seamlessly with Duosmium Results, a trusted source
				for results by Science Olympiad tournaments nationwide and praised by students
				and coaches alike.
			</Card>
		</svelte:fragment>
	</Section>
	<Section wrapperClass="pb-8" id="features">
		<svelte:fragment slot="title">Features</svelte:fragment>
		<ul
			slot="content"
			class="flex flex-wrap items-center justify-center max-w-6xl mx-auto w-full features"
		>
			<li>Invite Tournament Staff</li>
			<li>Event Status Dashboard</li>
			<li>Trial Event Support</li>
			<li>Track Support</li>
			<!-- <li>Build Event Checklists</li>
			<li>Live Collaboration</li> -->
			<li>Exhibition Teams</li>
			<li>Score Counseling and Auditing</li>
			<li>PDF Scoreboard Export</li>
			<li>Raw Score Export</li>
			<li>Automatic Histogram Generation</li>
			<li>Custom Award Slide Generation</li>
			<li>Real-Time Live Award Slides</li>
			<li>and more...</li>
		</ul>
	</Section>
	<Section
		contentClass="flex flex-wrap justify-center items-stretch -mb-24"
		wrapperClass="bg-slate-200 pb-8 dark:bg-slate-900 mb-24"
		id="pricing"
	>
		<svelte:fragment slot="title">Pricing</svelte:fragment>
		<svelte:fragment slot="content">
			<Card title="Free for All Tournaments!">
				<strong class="text-6xl text-center block mt-8 mb-16" slot="icon"
					>$0</strong
				>
				Duosmium Scoring is completely free for tournaments at all levels, allowing
				for lower tournament costs and more accessible scoring for all.
			</Card>
		</svelte:fragment>
	</Section>
	<Section
		wrapperClass="pb-8 text-slate-900"
		innerClass="bg-slate-100 rounded-xl px-12"
	>
		<svelte:fragment slot="title"
			>Trusted by tournaments nationwide</svelte:fragment
		>
		<ul
			slot="content"
			class="flex flex-wrap items-center justify-center max-w-6xl mx-auto w-full"
		>
			{@const logos = [
				{
					t: 'UMASO Invitational',
					i: '/assets/home/umaso_invitational.png'
				},
				{
					t: 'Stanford Invitational',
					i: '/assets/home/stanford_invitational.png'
				},
				{
					t: 'GullSO Invitational',
					i: '/assets/home/gullso_invitational.png'
				},
				{
					t: 'Harvard Invitational',
					i: '/assets/home/harvard_invitational.png'
				},
				{
					t: 'BullSO Invitational',
					i: '/assets/home/bullso_invitational.png'
				},

				{
					t: 'Sierra Vista Invitational',
					i: '/assets/home/sierra_vista_invitational.png'
				},
				{
					t: 'Troy Invitational',
					i: '/assets/home/troy_invitational.jpg'
				},
				{
					t: 'BirdSO Invitational',
					i: '/assets/home/birdso_invitational.png'
				},

				{
					t: 'Golden Gate Invitational',
					i: '/assets/home/golden_gate_invitational.png'
				},

				{
					t: 'Southern California Science Olympiad',
					i: '/assets/home/sCA_states.png'
				}
			]}
			{#each logos as { t, i }}
				<li>
					<img src={i} alt={t} class="max-h-16 sm:max-h-24 mx-4 my-5" />
				</li>
			{/each}
		</ul>
	</Section>
</main>

<style lang="postcss">
	.features li {
		@apply rounded-md shadow-md m-2 font-medium bg-indigo-800 text-slate-100 text-lg p-5;
	}
</style>
