<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import IconArrowLeft from '~icons/heroicons/arrow-left-solid';
	import IconPencil from '~icons/heroicons/pencil-solid';
	import IconTrash from '~icons/heroicons/trash-solid';
	import IconPlay from '~icons/heroicons/play-solid';
	import type { PracticeSetItem } from '$lib/types';

	interface PageData {
		practiceSet: {
			id: number;
			name: string;
			description?: string;
			icon?: string;
			tags: string[];
			items: PracticeSetItem[];
			createdAt: Date;
			updatedAt: Date;
		};
	}

	let { data }: { data: PageData } = $props();

	let showDeleteConfirm = $state(false);
	let isDeleting = $state(false);

	// Separate moves and patterns
	let moves = $derived(
		data.practiceSet.items.filter((item: PracticeSetItem) => item.itemType === 'move' && item.item)
	);
	let patterns = $derived(
		data.practiceSet.items.filter(
			(item: PracticeSetItem) => item.itemType === 'pattern' && item.item
		)
	);
</script>

<div class="container mx-auto p-4 max-w-2xl">
	<!-- Header -->
	<div class="mb-6">
		<button class="btn btn-ghost btn-sm mb-4" onclick={() => goto('/library')}>
			<IconArrowLeft class="h-5 w-5" />
			Back to Library
		</button>
		<div class="flex items-start justify-between gap-4">
			<div class="flex items-center gap-3">
				{#if data.practiceSet.icon}
					<span class="text-4xl">{data.practiceSet.icon}</span>
				{/if}
				<h1 class="text-3xl font-bold">{data.practiceSet.name}</h1>
			</div>
			<div class="flex gap-2">
				<button
					class="btn btn-primary btn-sm"
					onclick={() => goto(`/practice-sets/${data.practiceSet.id}/edit`)}
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

	<!-- Practice Button -->
	<div class="mb-6">
		<button
			class="btn btn-success btn-lg w-full"
			onclick={() => goto(`/practice-sets/${data.practiceSet.id}/practice`)}
		>
			<IconPlay class="h-6 w-6" />
			Start Practice Session
		</button>
	</div>

	<!-- Practice Set Details -->
	<div class="card bg-base-200">
		<div class="card-body">
			<div class="space-y-4">
				<!-- Description -->
				{#if data.practiceSet.description}
					<div>
						<h3 class="text-sm font-semibold text-base-content/70 mb-1">Description</h3>
						<p class="text-base whitespace-pre-wrap">{data.practiceSet.description}</p>
					</div>
				{/if}

				<!-- Tags -->
				{#if data.practiceSet.tags && data.practiceSet.tags.length > 0}
					<div>
						<h3 class="text-sm font-semibold text-base-content/70 mb-2">Tags</h3>
						<div class="flex gap-2 flex-wrap">
							{#each data.practiceSet.tags as tag}
								<div class="badge badge-lg">{tag}</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Patterns -->
				{#if patterns.length > 0}
					<div>
						<h3 class="text-sm font-semibold text-base-content/70 mb-3">
							Patterns ({patterns.length})
						</h3>
						<div class="space-y-2">
							{#each patterns as item}
								{@const pattern = item.item}
								{#if pattern && 'moves' in pattern}
									<div class="p-3 bg-base-100 rounded-lg">
										<div class="font-medium">{pattern.name}</div>
										{#if pattern.description}
											<div class="text-sm text-base-content/60 mt-1">{pattern.description}</div>
										{/if}
										<div class="text-xs text-base-content/50 mt-1">
											{pattern.moves.length} moves in sequence
										</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				<!-- Moves -->
				{#if moves.length > 0}
					<div>
						<h3 class="text-sm font-semibold text-base-content/70 mb-3">Moves ({moves.length})</h3>
						<div class="space-y-2">
							{#each moves as item}
								{@const move = item.item}
								{#if move && 'counts' in move}
									<div class="p-3 bg-base-100 rounded-lg">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<div class="font-medium">{move.name}</div>
												{#if move.description}
													<div class="text-sm text-base-content/60 mt-1">{move.description}</div>
												{/if}
											</div>
											<div class="badge badge-sm">{move.counts} counts</div>
										</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				<!-- Summary -->
				<div class="divider"></div>
				<div class="stats stats-vertical lg:stats-horizontal shadow">
					<div class="stat">
						<div class="stat-title">Total Items</div>
						<div class="stat-value text-2xl">{data.practiceSet.items.length}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Patterns</div>
						<div class="stat-value text-2xl">{patterns.length}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Moves</div>
						<div class="stat-value text-2xl">{moves.length}</div>
					</div>
				</div>

				<!-- Metadata -->
				<div class="divider"></div>
				<div class="text-xs text-base-content/60">
					<p>Created: {new Date(data.practiceSet.createdAt).toLocaleDateString()}</p>
					<p>Last updated: {new Date(data.practiceSet.updatedAt).toLocaleDateString()}</p>
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
			<h3 class="text-xl font-bold mb-4">Delete Practice Set</h3>
			<p class="mb-6">
				Are you sure you want to delete "<strong>{data.practiceSet.name}</strong>"? This action
				cannot be undone.
			</p>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					isDeleting = true;
					return async ({ update }) => {
						await update();
						// If we reach here without navigating away, reset state
						isDeleting = false;
						showDeleteConfirm = false;
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
