<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import * as pdfjsLib from 'pdfjs-dist';
	import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
	import { onMount } from 'svelte';
	export let src: string;

	let container: HTMLDivElement;

	let pdfObj: pdfjsLib.PDFDocumentProxy;
	let currentPage = 1;

	let fullscreen = false;

	onMount(() => {
		pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

		const loadingPdf = pdfjsLib.getDocument(src);
		loadingPdf.promise.then((pdf) => {
			container.querySelector('p')?.remove();
			pdfObj = pdf;
			renderPage();
		});
	});

	let rendering = false;
	const renderPage = () => {
		if (rendering) return;
		rendering = true;

		currentPage = Math.max(1, Math.min(currentPage, pdfObj.numPages));
		pdfObj.getPage(currentPage).then((page) => {
			const docSize = page.getViewport({ scale: 1 });
			const xScale = window.screen.width / docSize.width;
			const yScale = window.screen.height / docSize.height;
			const scale = Math.min(xScale, yScale);

			const viewport = page.getViewport({ scale });

			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d') as CanvasRenderingContext2D;
			canvas.height = viewport.height;
			canvas.width = viewport.width;

			const renderContext = {
				canvasContext: context,
				viewport: viewport
			};
			canvas.hidden = true;
			container.append(canvas);
			page.render(renderContext).promise.then(() => {
				for (const child of container.children) {
					if (child != canvas) {
						container.removeChild(child);
					}
				}
				canvas.hidden = false;
				rendering = false;
			});
		});
	};

	const enterFullScreen = () => {
		if (!document.fullscreenElement) {
			container.requestFullscreen();
		}
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'ArrowLeft') {
			currentPage--;
			renderPage();
		} else if (e.key === 'ArrowRight' || e.key === ' ') {
			currentPage++;
			renderPage();
		}
	};
</script>

<svelte:window on:keydown={handleKeydown} />

<Button color="blue" on:click={enterFullScreen}>Present</Button>

<div
	class="container"
	bind:this={container}
	class:hidden={!fullscreen}
	on:fullscreenchange={() => {
		if (document.fullscreenElement === null) {
			fullscreen = false;
		} else {
			fullscreen = true;
		}
	}}
>
	<p>Loading... Please wait...</p>
</div>

<style>
	div.container {
		position: relative;
		display: grid;
		place-content: center;
	}
	div.container.hidden {
		display: none;
	}
	div.container :global(canvas) {
		max-width: 100%;
	}
	div.container p {
		font-size: 2rem;
		text-align: center;
		height: 50vh;
		width: 100%;
	}
	p {
		font-size: 1rem;
		border-radius: 4px;
		background-color: transparent;
		width: 4em;
		color: inherit;
		text-align: center;
	}
</style>
