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
			<h1 class="text-3xl font-bold">{data.pattern.name}</h1>
			<div class="flex gap-2">
				<button
					class="btn btn-primary btn-sm"
					onclick={() => goto(`/patterns/${data.pattern.id}/edit`)}
				>
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

	<!-- Pattern Details -->
	<div class="card bg-base-200">
		<div class="card-body">
			<div class="space-y-4">
				<!-- Description -->
				{#if data.pattern.description}
					<div>
						<h3 class="text-sm font-semibold text-base-content/70 mb-1">Description</h3>
						<p class="text-base whitespace-pre-wrap">{data.pattern.description}</p>
					</div>
				{/if}

				<!-- Move Sequence -->
				<div>
					<h3 class="text-sm font-semibold text-base-content/70 mb-3">
						Move Sequence ({data.pattern.moves.length} moves)
					</h3>
					{#if data.pattern.moves.length > 0}
						<div class="space-y-2">
							{#each data.pattern.moves as patternMove, index}
								<div class="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
									<div class="badge badge-primary">{index + 1}</div>
									<div class="flex-1">
										<div class="font-medium">{patternMove.move.name}</div>
										<div class="text-sm text-base-content/60">
											{patternMove.move.counts} counts
											{#if patternMove.move.description}
												· {patternMove.move.description}
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-base-content/60">No moves in this pattern</p>
					{/if}
				</div>

				<!-- Metadata -->
				<div class="divider"></div>
				<div class="text-xs text-base-content/60">
					<p>Created: {new Date(data.pattern.createdAt).toLocaleDateString()}</p>
					<p>Last updated: {new Date(data.pattern.updatedAt).toLocaleDateString()}</p>
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
			<h3 class="text-xl font-bold mb-4">Delete Pattern</h3>
			<p class="mb-6">
				Are you sure you want to delete "<strong>{data.pattern.name}</strong>"? This action cannot
				be undone.
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
