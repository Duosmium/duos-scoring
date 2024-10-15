<script lang="ts">
	export let title: string;
</script>

<section
	class="rounded-md shadow-md p-6 m-2 bg-slate-100 max-w-[375px] min-w-[275px] flex-1 dark:bg-slate-700"
>
	<slot name="icon" />
	<h3 class="text-xl font-bold mt-4 mb-2">{title}</h3>
	<p class="text-neutral-600 font-light dark:text-neutral-100">
		<slot />
	</p>
</section>
