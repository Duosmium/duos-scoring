<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import Head from '$lib/components/Head.svelte';
	import { enhance } from '$app/forms';
	import { Button, Input, Label } from 'flowbite-svelte';

	export let data: PageData;
	export let form: ActionData;
</script>

<Head title="Dashboard | Duosmium Scoring" />

<h1>Account Settings</h1>

<form use:enhance method="post" class="space-y-4">
	<Label>
		Name: <Input type="text" name="name" value={form?.name ?? data.user.name} required />
	</Label>
	<Label>
		Email: <Input type="email" name="email" value={form?.email ?? data.user.email} required />
	</Label>
	{#if form?.success}
		<div class="success">
			Changes successfully saved!{form?.emailChanged
				? ' Check your email to confirm your new email.'
				: ''}
		</div>
	{/if}
	{#if form?.error}
		<div class="error">{form.error}</div>
	{/if}
	<Button type="submit">Save</Button>
</form>
