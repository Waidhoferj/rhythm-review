<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Rhythm Review</title>
	<meta name="description" content="Practice your favorite dance patterns" />
</svelte:head>

{@render children()}
