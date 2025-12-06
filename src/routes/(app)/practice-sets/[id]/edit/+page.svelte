<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import IconArrowLeft from '~icons/heroicons/arrow-left-solid';
	import IconPlus from '~icons/heroicons/plus-solid';
	import IconTrash from '~icons/heroicons/trash-solid';
	import IconXMark from '~icons/heroicons/x-mark-solid';
	import type { PracticeSetItem } from '$lib/types';

	interface PageData {
		practiceSet: {
			id: number;
			name: string;
			description?: string;
			icon?: string;
			tags: string[];
			items: PracticeSetItem[];
		};
		moves: Array<{ id: number; name: string; description?: string; counts: number }>;
		patterns: Array<{ id: number; name: string; description?: string }>;
	}

	interface ActionData {
		errors?: Record<string, string>;
		error?: string;
	}

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isSubmitting = $state(false);
	let searchQuery = $state('');
	let showItemSelector = $state(false);
	let selectedItems = $state<
		Array<{
			itemType: 'move' | 'pattern';
			itemId: number;
			name: string;
			description?: string;
		}>
	>(
		data.practiceSet.items.map((item) => ({
			itemType: item.itemType,
			itemId: item.itemId,
			name: item.item && 'name' in item.item ? item.item.name : '',
			description: item.item && 'description' in item.item ? item.item.description : undefined
		}))
	);
	let tags = $state<string[]>([...data.practiceSet.tags]);
	let tagInput = $state('');
	let selectedIcon = $state(data.practiceSet.icon || '🎵');

	// Common icons for practice sets
	const iconOptions = ['🎵', '💃', '🕺', '🎶', '⭐', '🔥', '💪', '🎯', '✨', '🌟'];

	// Filter available items (not already selected)
	let availableItems = $derived(
		[
			...data.moves.map((m) => ({ itemType: 'move' as const, itemId: m.id, ...m })),
			...data.patterns.map((p) => ({ itemType: 'pattern' as const, itemId: p.id, ...p }))
		].filter(
			(item) =>
				!selectedItems.some((si) => si.itemType === item.itemType && si.itemId === item.itemId) &&
				(searchQuery === '' ||
					item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);

	function addItem(item: (typeof availableItems)[0]) {
		selectedItems = [
			...selectedItems,
			{
				itemType: item.itemType,
				itemId: item.itemId,
				name: item.name,
				description: item.description
			}
		];
		searchQuery = '';
		showItemSelector = false;
	}

	function removeItem(index: number) {
		selectedItems = selectedItems.filter((_, i) => i !== index);
	}

	function addTag() {
		const tag = tagInput.trim();
		if (tag && !tags.includes(tag)) {
			tags = [...tags, tag];
			tagInput = '';
		}
	}

	function removeTag(index: number) {
		tags = tags.filter((_, i) => i !== index);
	}

	function handleTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag();
		}
	}
</script>

<div class="container mx-auto p-4 max-w-2xl">
	<!-- Header -->
	<div class="mb-6">
		<button
			class="btn btn-ghost btn-sm mb-4"
			onclick={() => goto(`/practice-sets/${data.practiceSet.id}`)}
		>
			<IconArrowLeft class="h-5 w-5" />
			Back to Practice Set
		</button>
		<h1 class="text-3xl font-bold">Edit Practice Set</h1>
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
					placeholder="e.g., Beginner Salsa Basics"
					value={data.practiceSet.name}
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
					placeholder="Optional description of the practice set..."
					rows="4"
					maxlength="500"
					value={data.practiceSet.description || ''}
				></textarea>
				{#if form?.errors?.description}
					<label class="label">
						<span class="label-text-alt text-error">{form.errors.description}</span>
					</label>
				{/if}
			</div>

			<!-- Icon Selector -->
			<div class="form-control">
				<label class="label">
					<span class="label-text">Icon</span>
				</label>
				<div class="flex gap-2 flex-wrap">
					{#each iconOptions as icon}
						<button
							type="button"
							class="btn btn-square"
							class:btn-primary={selectedIcon === icon}
							class:btn-outline={selectedIcon !== icon}
							onclick={() => (selectedIcon = icon)}
						>
							<span class="text-2xl">{icon}</span>
						</button>
					{/each}
				</div>
				<input type="hidden" name="icon" value={selectedIcon} />
			</div>

			<!-- Tags Input -->
			<div class="form-control">
				<label class="label">
					<span class="label-text">Tags</span>
				</label>
				<div class="flex gap-2 mb-2">
					<input
						type="text"
						bind:value={tagInput}
						onkeydown={handleTagKeydown}
						class="input input-bordered flex-1"
						placeholder="Add a tag and press Enter..."
					/>
					<button type="button" class="btn btn-primary" onclick={addTag}>
						<IconPlus class="h-5 w-5" />
					</button>
				</div>
				{#if tags.length > 0}
					<div class="flex gap-2 flex-wrap">
						{#each tags as tag, index}
							<div class="badge badge-lg gap-2">
								{tag}
								<button type="button" onclick={() => removeTag(index)}>
									<IconXMark class="h-4 w-4" />
								</button>
							</div>
						{/each}
					</div>
				{/if}
				{#if form?.errors?.tags}
					<label class="label">
						<span class="label-text-alt text-error">{form.errors.tags}</span>
					</label>
				{/if}
				<input type="hidden" name="tags" value={JSON.stringify(tags)} />
			</div>

			<!-- Items Selection -->
			<div class="form-control">
				<label class="label">
					<span class="label-text">Moves & Patterns <span class="text-error">*</span></span>
				</label>

				<!-- Add Items Button -->
				<button
					type="button"
					class="btn btn-outline w-full mb-3"
					onclick={() => (showItemSelector = !showItemSelector)}
				>
					<IconPlus class="h-5 w-5" />
					Add Moves or Patterns
				</button>

				<!-- Item Selector -->
				{#if showItemSelector}
					<div class="mb-3 border border-base-300 rounded-lg p-4">
						<input
							type="text"
							bind:value={searchQuery}
							class="input input-bordered w-full mb-2"
							placeholder="Search moves and patterns..."
						/>
						{#if searchQuery && availableItems.length > 0}
							<div class="max-h-64 overflow-y-auto space-y-2">
								{#each availableItems as item}
									<button
										type="button"
										class="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center justify-between"
										onclick={() => addItem(item)}
									>
										<div class="flex-1">
											<div class="flex items-center gap-2">
												<span class="badge badge-sm"
													>{item.itemType === 'move' ? 'Move' : 'Pattern'}</span
												>
												<span class="font-medium">{item.name}</span>
											</div>
											{#if item.description}
												<div class="text-sm text-base-content/60 mt-1">{item.description}</div>
											{/if}
										</div>
										<IconPlus class="h-5 w-5 text-primary" />
									</button>
								{/each}
							</div>
						{:else if searchQuery && availableItems.length === 0}
							<div class="p-3 text-center text-base-content/60">No items found</div>
						{:else}
							<div class="p-3 text-center text-base-content/60">
								Start typing to search for moves and patterns
							</div>
						{/if}
					</div>
				{/if}

				<!-- Selected Items -->
				{#if selectedItems.length > 0}
					<div class="space-y-2">
						<div class="text-sm font-medium mb-2">Selected Items ({selectedItems.length})</div>
						{#each selectedItems as item, index}
							<div class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
								<span class="badge">{item.itemType === 'move' ? 'Move' : 'Pattern'}</span>
								<div class="flex-1">
									<div class="font-medium">{item.name}</div>
									{#if item.description}
										<div class="text-sm text-base-content/60">{item.description}</div>
									{/if}
								</div>
								<button
									type="button"
									class="btn btn-ghost btn-sm btn-circle"
									onclick={() => removeItem(index)}
								>
									<IconTrash class="h-4 w-4" />
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<div class="p-6 text-center border-2 border-dashed border-base-300 rounded-lg">
						<p class="text-base-content/60">
							No items selected. Click "Add Moves or Patterns" above.
						</p>
					</div>
				{/if}

				{#if form?.errors?.items}
					<label class="label">
						<span class="label-text-alt text-error">{form.errors.items}</span>
					</label>
				{/if}

				<!-- Hidden input for items -->
				<input
					type="hidden"
					name="items"
					value={JSON.stringify(
						selectedItems.map((item) => ({ itemType: item.itemType, itemId: item.itemId }))
					)}
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
					disabled={isSubmitting || selectedItems.length === 0}
				>
					{#if isSubmitting}
						<span class="loading loading-spinner"></span>
						Saving...
					{:else}
						Save Changes
					{/if}
				</button>
				<button
					type="button"
					class="btn btn-ghost"
					onclick={() => goto(`/practice-sets/${data.practiceSet.id}`)}
				>
					Cancel
				</button>
			</div>
		</div>
	</form>
</div>
