<script>
	// The ordering of these imports is critical to your app working properly
	import '@skeletonlabs/skeleton/themes/theme-rocket.css';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	// Most of your app wide CSS should be put in this file
	import '../app.postcss';
</script>

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="flex flex-col gap-5">
		<h1 class="h1">Let's get cracking tones!</h1>
		<slot />
	</div>
</div>
