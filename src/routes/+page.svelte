<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { stackClientApp } from '$lib/client/stack';

	onMount(async () => {
		const user = await stackClientApp.getUser();
		if (user) {
			goto('/library');
		} else {
			goto('/auth/signin');
		}
	});
</script>

<svelte:head>
	<title>Rhythm Review</title>
	<meta name="description" content="Dance Practice Tool" />
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<h1 class="text-2xl font-bold">Loading...</h1>
	</div>
</div>
