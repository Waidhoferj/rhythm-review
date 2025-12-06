<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import IconArrowLeft from '~icons/heroicons/arrow-left-solid';
	import IconPlus from '~icons/heroicons/plus-solid';
	import IconTrash from '~icons/heroicons/trash-solid';
	import IconBars3 from '~icons/heroicons/bars-3-solid';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isSubmitting = $state(false);
	let searchQuery = $state('');
	let draggedIndex = $state<number | null>(null);

	// Initialize selected moves from pattern (sorted by sequence order)
	// This captures the initial value which can then be modified by the user
	let selectedMoves = $state<typeof data.moves>(
		[...data.pattern.moves].sort((a, b) => a.sequenceOrder - b.sequenceOrder).map((pm) => pm.move)
	);

	// Filter available moves (not already selected)
	let availableMoves = $derived(
		data.moves.filter(
			(move) =>
				!selectedMoves.some((sm) => sm.id === move.id) &&
				(searchQuery === '' ||
					move.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					move.description?.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);

	function addMove(move: (typeof data.moves)[0]) {
		selectedMoves = [...selectedMoves, move];
		searchQuery = '';
	}

	function removeMove(index: number) {
		selectedMoves = selectedMoves.filter((_, i) => i !== index);
	}

	function handleDragStart(index: number) {
		draggedIndex = index;
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;

		const newMoves = [...selectedMoves];
		const draggedMove = newMoves[draggedIndex];
		newMoves.splice(draggedIndex, 1);
		newMoves.splice(index, 0, draggedMove);
		selectedMoves = newMoves;
		draggedIndex = index;
	}

	function handleDragEnd() {
		draggedIndex = null;
	}
</script>

<div class="container mx-auto p-4 max-w-2xl">
	<!-- Header -->
	<div class="mb-6">
		<button class="btn btn-ghost btn-sm mb-4" onclick={() => goto(`/patterns/${data.pattern.id}`)}>
			<IconArrowLeft class="h-5 w-5" />
			Back to Pattern
		</button>
		<h1 class="text-3xl font-bold">Edit Pattern</h1>
	</div>

	<!-- Form -->
	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result, update }) => {
				isSubmitting = false;
				if (result.type === 'redirect') {
					goto(result.location);
				} else {
					await update();
				}
			};
		}}
	>
		<div class="space-y-4">
			<!-- Name Field -->
			<div class="form-control">
				<label class="label" for="name">
					<span class="label-text">Name <span class="text-error">*</span></span>
				</label>
				<input
					type="text"
					id="name"
					name="name"
					class="input input-bordered w-full"
					class:input-error={form?.errors?.name}
					placeholder="e.g., Basic Salsa Combo"
					value={data.pattern.name}
					required
					maxlength="100"
				/>
				{#if form?.errors?.name}
					<label class="label">
						<span class="label-text-alt text-error">{form.errors.name}</span>
					</label>
				{/if}
			</div>

			<!-- Description Field -->
			<div class="form-control">
				<label class="label" for="description">
					<span class="label-text">Description</span>
				</label>
				<textarea
					id="description"
					name="description"
					class="textarea textarea-bordered w-full"
					class:textarea-error={form?.errors?.description}
					placeholder="Optional description of the pattern..."
					rows="4"
					maxlength="500"
					value={data.pattern.description || ''}
				></textarea>
				{#if form?.errors?.description}
					<label class="label">
						<span class="label-text-alt text-error">{form.errors.description}</span>
					</label>
				{/if}
			</div>

			<!-- Move Selection -->
			<div class="form-control">
				<label class="label">
					<span class="label-text">Moves <span class="text-error">*</span></span>
				</label>

				<!-- Search/Add Moves -->
				<div class="mb-3">
					<input
						type="text"
						bind:value={searchQuery}
						class="input input-bordered w-full"
						placeholder="Search moves to add..."
					/>
					{#if searchQuery && availableMoves.length > 0}
						<div class="mt-2 border border-base-300 rounded-lg max-h-48 overflow-y-auto">
							{#each availableMoves as move}
								<button
									type="button"
									class="w-full text-left p-3 hover:bg-base-200 flex items-center justify-between"
									onclick={() => addMove(move)}
								>
									<div>
										<div class="font-medium">{move.name}</div>
										{#if move.description}
											<div class="text-sm text-base-content/60">{move.description}</div>
										{/if}
									</div>
									<IconPlus class="h-5 w-5 text-primary" />
								</button>
							{/each}
						</div>
					{:else if searchQuery && availableMoves.length === 0}
						<div class="mt-2 p-3 text-center text-base-content/60">No moves found</div>
					{/if}
				</div>

				<!-- Selected Moves (Drag and Drop) -->
				{#if selectedMoves.length > 0}
					<div class="space-y-2">
						<div class="text-sm font-medium mb-2">
							Selected Moves ({selectedMoves.length}) - Drag to reorder
						</div>
						{#each selectedMoves as move, index (move.id)}
							<div
								draggable="true"
								ondragstart={() => handleDragStart(index)}
								ondragover={(e) => handleDragOver(e, index)}
								ondragend={handleDragEnd}
								class="flex items-center gap-3 p-3 bg-base-200 rounded-lg cursor-move"
								class:opacity-50={draggedIndex === index}
							>
								<IconBars3 class="h-5 w-5 text-base-content/40" />
								<div class="flex-1">
									<div class="font-medium">
										{index + 1}. {move.name}
									</div>
									<div class="text-sm text-base-content/60">{move.counts} counts</div>
								</div>
								<button
									type="button"
									class="btn btn-ghost btn-sm btn-circle"
									onclick={() => removeMove(index)}
								>
									<IconTrash class="h-4 w-4" />
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<div class="p-6 text-center border-2 border-dashed border-base-300 rounded-lg">
						<p class="text-base-content/60">No moves selected. Search and add moves above.</p>
					</div>
				{/if}

				{#if form?.errors?.moveIds}
					<label class="label">
						<span class="label-text-alt text-error">{form.errors.moveIds}</span>
					</label>
				{/if}

				<!-- Hidden input for move IDs -->
				<input
					type="hidden"
					name="moveIds"
					value={JSON.stringify(selectedMoves.map((m) => m.id))}
				/>
			</div>

			<!-- General Error -->
			{#if form?.error}
				<div class="alert alert-error">
					<span>{form.error}</span>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex gap-2 pt-4">
				<button
					type="submit"
					class="btn btn-primary flex-1"
					disabled={isSubmitting || selectedMoves.length === 0}
				>
					{#if isSubmitting}
						<span class="loading loading-spinner"></span>
						Updating...
					{:else}
						Update Pattern
					{/if}
				</button>
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => goto(`/patterns/${data.pattern.id}`)}
				>
					Cancel
				</button>
			</div>
		</div>
	</form>
</div>
