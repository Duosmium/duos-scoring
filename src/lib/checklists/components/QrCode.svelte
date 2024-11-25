<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	export let url: string;

	let qrCode: string;

	onMount(async () => {
		qrCode = await QRCode.toDataURL(url, {
			scale: 6
		});
	});
</script>

<img class={$$props.class} alt={url} src={qrCode} />
