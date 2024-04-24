<script lang="ts">
	export let title: string;
</script>

<details open>
	<summary class="mt-8 mb-6 cursor-pointer"><h3 class="m-0 inline">{title}</h3></summary>

	<slot />
</details>
