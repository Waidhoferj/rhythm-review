<script lang="ts">
	import { onMount } from 'svelte';
	import { stackClientApp } from '$lib/client/stack';

	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			// Get OAuth parameters from URL
			const params = new URLSearchParams(window.location.search);
			const code = params.get('code');
			const state = params.get('state');

			if (code && state) {
				// Handle OAuth callback
				const user = await stackClientApp.callOAuthCallback();

				if (user) {
					// Redirect to assets page on success
					window.location.href = '/library';
				} else {
					error = 'Authentication failed. No user returned.';
					loading = false;
				}
			} else {
				error = 'Invalid OAuth callback. Missing code or state parameters.';
				loading = false;
			}
		} catch (err) {
			console.error('Failed to handle OAuth redirect:', err);
			error = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
			loading = false;
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200 px-4 py-12">
	<div class="w-full max-w-md space-y-8 text-center">
		{#if loading}
			<div>
				<svg class="mx-auto h-12 w-12 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<h2 class="mt-6 text-2xl font-bold">Completing sign in...</h2>
				<p class="mt-2 text-sm opacity-70">Please wait while we authenticate you.</p>
			</div>
		{:else if error}
			<div role="alert" class="alert alert-error">
				<div class="flex flex-col items-center">
					<svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<h3 class="mt-4 text-lg font-medium">Authentication Error</h3>
					<p class="mt-2 text-sm">{error}</p>
					<a href="/auth/signin" class="btn mt-4 btn-error"> Try Again </a>
				</div>
			</div>
		{/if}
	</div>
</div>
