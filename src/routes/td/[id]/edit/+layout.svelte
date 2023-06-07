<script lang="ts">
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<nav>
	<a href="/td/{data.tournament.id}/edit/general">Edit General Info</a>
	<a href="/td/{data.tournament.id}/edit/events">Edit Events</a>
	<a href="/td/{data.tournament.id}/edit/tracks">Edit Tracks</a>
	<a href="/td/{data.tournament.id}/edit/teams">Edit Teams</a>
</nav>

<slot />
