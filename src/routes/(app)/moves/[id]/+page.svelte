<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import IconArrowLeft from '~icons/heroicons/arrow-left-solid';
	import IconPencil from '~icons/heroicons/pencil-solid';
	import IconTrash from '~icons/heroicons/trash-solid';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showDeleteConfirm = $state(false);
	let isDeleting = $state(false);
</script>

<div class="container mx-auto p-4 max-w-2xl">
	<!-- Header -->
	<div class="mb-6">
		<button class="btn btn-ghost btn-sm mb-4" onclick={() => goto('/library')}>
			<IconArrowLeft class="h-5 w-5" />
			Back to Library
		</button>
		<div class="flex items-start justify-between gap-4">
			<h1 class="text-3xl font-bold">{data.move.name}</h1>
			<div class="flex gap-2">
				<button class="btn btn-primary btn-sm" onclick={() => goto(`/moves/${data.move.id}/edit`)}>
					<IconPencil class="h-4 w-4" />
					Edit
				</button>
				<button class="btn btn-error btn-sm" onclick={() => (showDeleteConfirm = true)}>
					<IconTrash class="h-4 w-4" />
					Delete
				</button>
			</div>
		</div>
	</div>

	<!-- Move Details -->
	<div class="card bg-base-200">
		<div class="card-body">
			<div class="space-y-4">
				<!-- Counts -->
				<div>
					<h3 class="text-sm font-semibold text-base-content/70 mb-1">Counts</h3>
					<p class="text-lg">{data.move.counts}</p>
				</div>

				<!-- Description -->
				{#if data.move.description}
					<div>
						<h3 class="text-sm font-semibold text-base-content/70 mb-1">Description</h3>
						<p class="text-base whitespace-pre-wrap">{data.move.description}</p>
					</div>
				{/if}

				<!-- Metadata -->
				<div class="divider"></div>
				<div class="text-xs text-base-content/60">
					<p>Created: {new Date(data.move.createdAt).toLocaleDateString()}</p>
					<p>Last updated: {new Date(data.move.updatedAt).toLocaleDateString()}</p>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
		onclick={() => !isDeleting && (showDeleteConfirm = false)}
		onkeydown={(e) => e.key === 'Escape' && !isDeleting && (showDeleteConfirm = false)}
		role="button"
		tabindex="-1"
		aria-label="Close modal"
	>
		<div
			class="bg-base-100 rounded-lg shadow-xl p-6 max-w-md w-full"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
		>
			<h3 class="text-xl font-bold mb-4">Delete Move</h3>
			<p class="mb-6">
				Are you sure you want to delete "<strong>{data.move.name}</strong>"? This action cannot be
				undone.
			</p>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					isDeleting = true;
					return async ({ result, update }) => {
						isDeleting = false;
						if (result.type === 'redirect') {
							goto(result.location);
						} else {
							await update();
							showDeleteConfirm = false;
						}
					};
				}}
			>
				<div class="flex gap-2">
					<button type="submit" class="btn btn-error flex-1" disabled={isDeleting}>
						{#if isDeleting}
							<span class="loading loading-spinner"></span>
							Deleting...
						{:else}
							Delete
						{/if}
					</button>
					<button
						type="button"
						class="btn btn-ghost flex-1"
						onclick={() => (showDeleteConfirm = false)}
						disabled={isDeleting}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
