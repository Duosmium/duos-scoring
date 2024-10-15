<script lang="ts">
	import Image from './Image.svelte';
	import metadata from './hero.png?as=metadata';
	import jpeg from './hero.png?w=440;880;550;768;1075&format=jpeg&as=srcset';
	import webp from './hero.png?w=440;880;550;768;1075&format=webp&as=srcset';

	export let title: string;
</script>

<section class="w-full py-8 max-w-7xl mx-auto mb-8 px-8">
	<div class="flex items-center flex-col md:flex-row">
		<div class="flex-1 md:pl-6 lg:pl-14 md:mr-4 md:min-w-[400px]">
			<h1
				class="font-bold mb-10 leading-tight max-w-lg text-center md:text-left"
			>
				{title}
			</h1>
			<div
				class="max-w-md mb-6 text-slate-700 md:mx-0 mx-auto text-center md:text-left dark:text-slate-100"
			>
				<p class="leading-relaxed font-normal text-lg">
					<slot name="description" />
				</p>
			</div>
			<span class="flex flex-wrap items-start justify-center md:justify-start">
				<slot name="cta" />
			</span>
		</div>
		<Image
			preload={true}
			alt="a 3d model of a student sitting on the ground next to some plants and a pile of books. their hair floats above them with dna, planets, fruit, and other symbols orbiting around the hair."
			imageData={{ metadata, jpeg, webp }}
			className="block md:w-1/2 md:min-w-[440px] mt-6 -mr-20 md:m-0 min-w-[373px]"
			loading="eager"
			sizes="(max-width:437px) 437px,(max-width: 767px) 100vw,(max-width: 943px) 440px,(max-width:1280px) 50vw, 608px"
		/>
	</div>
</section>

<style>
	@media (min-width: 768px) {
		h1 {
			font-size: clamp(3.5rem, 7.7vw - 1.5rem, 4.5rem);
		}
	}
	@media (max-width: 767px) {
		h1 {
			font-size: clamp(2.25rem, 4.5vw + 1.4rem, 3.5rem);
		}
	}
</style>
