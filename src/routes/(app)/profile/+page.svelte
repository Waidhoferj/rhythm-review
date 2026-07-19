<script lang="ts">
	import { goto } from '$app/navigation';
	import { stackClientApp } from '$lib/client/stack';
	import IconArrowLeft from '~icons/heroicons/arrow-left-solid';

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
	<div class="mb-6">
		<button class="btn btn-ghost btn-sm mb-4" onclick={() => goto('/library')}>
			<IconArrowLeft class="h-5 w-5" />
			Back to Library
		</button>
		<h1 class="text-3xl font-bold">Profile</h1>
	</div>

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
