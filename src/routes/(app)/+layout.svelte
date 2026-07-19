<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { getNavigationDirection } from '$lib/client/stores/navigation.svelte';

	let { data, children }: { data: any; children: any } = $props();

	onNavigate((navigation) => {
		// @ts-ignore - View Transitions API
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			const fromPath = navigation.from?.url?.pathname || '';
			const toPath = navigation.to?.url?.pathname || '';
			const direction = getNavigationDirection(fromPath, toPath);

			// Set direction class on document for CSS to pick up
			document.documentElement.classList.remove('nav-back', 'nav-forward');
			document.documentElement.classList.add(direction === 'back' ? 'nav-back' : 'nav-forward');

			// @ts-ignore - View Transitions API
			const transition = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

{@render children()}
