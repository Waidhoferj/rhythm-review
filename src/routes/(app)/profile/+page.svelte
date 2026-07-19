<script lang="ts">
	import { goto } from '$app/navigation';
	import { stackClientApp } from '$lib/client/stack';

	interface Props {
		data: {
			user: {
				id: string;
				primaryEmail: string | null;
				displayName: string | null;
				profileImageUrl: string | null;
			};
		};
	}

	let { data }: Props = $props();

	let isLoggingOut = $state(false);

	async function handleLogout() {
		isLoggingOut = true;
		try {
			await stackClientApp.signOut();
			goto('/auth/signin');
		} catch (error) {
			console.error('Logout failed:', error);
			isLoggingOut = false;
		}
	}
</script>

<div class="container mx-auto p-4 max-w-2xl">
	<h1 class="text-3xl font-bold mb-6">Profile</h1>

	<!-- User Info -->
	<div class="card bg-base-200 mb-6">
		<div class="card-body">
			<div class="flex items-center gap-4">
				{#if data.user.profileImageUrl}
					<div class="avatar">
						<div class="w-16 rounded-full">
							<img src={data.user.profileImageUrl} alt="Profile" />
						</div>
					</div>
				{:else}
					<div class="avatar placeholder">
						<div class="bg-primary text-primary-content rounded-full w-16">
							<span class="text-2xl">
								{(data.user.displayName || data.user.primaryEmail || '?').charAt(0).toUpperCase()}
							</span>
						</div>
					</div>
				{/if}
				<div>
					{#if data.user.displayName}
						<h2 class="text-xl font-semibold">{data.user.displayName}</h2>
					{/if}
					{#if data.user.primaryEmail}
						<p class="text-base-content/70">{data.user.primaryEmail}</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="space-y-4">
		<button class="btn btn-error btn-block" onclick={handleLogout} disabled={isLoggingOut}>
			{#if isLoggingOut}
				<span class="loading loading-spinner"></span>
				Logging out...
			{:else}
				Log Out
			{/if}
		</button>
	</div>
</div>
