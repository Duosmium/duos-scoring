<script lang="ts">
	import type pdfJs from 'pdfjs-dist/types/src/pdf.d.ts';
	import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
	import { onMount } from 'svelte';

	let pdfjsLib: typeof pdfJs;

	let container: HTMLDivElement;

	let pdfObjs: pdfJs.PDFDocumentProxy[] = [];
	let pages: number[] = [];

	let currentPage = 1;

	let fullscreen = false;

	onMount(async () => {
		pdfjsLib = await import('pdfjs-dist');
		pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
	});

	export const appendPdf = async (src: string | ArrayBuffer) => {
		const loadingPdf = pdfjsLib.getDocument(src);
		const pdf = await loadingPdf.promise;

		pdfObjs.push(pdf);
		pages.push((pages.slice(-1)[0] || 0) + pdf.numPages);

		if (pdfObjs.length === 1) {
			container.querySelector('p')?.remove();
			await renderPage();
		}
	};

	const getPdfIndex = (page: number) => {
		const index = pages.findIndex((p) => p >= page);
		const offset = page - (index === 0 ? 0 : pages[index - 1]);

		return { index, offset };
	};

	let rendering = false;
	const renderPage = async () => {
		if (rendering || pdfObjs.length === 0) return;
		rendering = true;

		currentPage = Math.max(1, Math.min(currentPage, pages.slice(-1)[0]));
		const { index, offset } = getPdfIndex(currentPage);

		const page = await pdfObjs[index].getPage(offset);

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

		await page.render(renderContext).promise;
		for (const child of container.children) {
			if (child != canvas) {
				container.removeChild(child);
			}
		}
		canvas.hidden = false;
		rendering = false;
	};

	export const enterFullScreen = () => {
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

<svelte:window
	on:keydown={handleKeydown}
	on:click={() => {
		if (!fullscreen) return;
		currentPage++;
		renderPage();
	}}
/>

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
		place-items: center;
	}
	div.container.hidden {
		display: none;
	}
	div.container :global(canvas) {
		max-width: 100vw;
		max-height: 100vh;
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
