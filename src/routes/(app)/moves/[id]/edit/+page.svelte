<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import IconArrowLeft from '~icons/heroicons/arrow-left-solid';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isSubmitting = $state(false);
</script>

<div class="container mx-auto p-4 max-w-2xl">
	<!-- Header -->
	<div class="mb-6">
		<button class="btn btn-ghost btn-sm mb-4" onclick={() => goto(`/moves/${data.move.id}`)}>
			<IconArrowLeft class="h-5 w-5" />
			Back to Move
		</button>
		<h1 class="text-3xl font-bold">Edit Move</h1>
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
					placeholder="e.g., Box Step"
					value={data.move.name}
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
					placeholder="Optional description of the move..."
					rows="4"
					maxlength="500"
					value={data.move.description || ''}
				></textarea>
				{#if form?.errors?.description}
					<label class="label">
						<span class="label-text-alt text-error">{form.errors.description}</span>
					</label>
				{/if}
			</div>

			<!-- Counts Field -->
			<div class="form-control">
				<label class="label" for="counts">
					<span class="label-text">Counts <span class="text-error">*</span></span>
				</label>
				<input
					type="number"
					id="counts"
					name="counts"
					class="input input-bordered w-full"
					class:input-error={form?.errors?.counts}
					placeholder="e.g., 8"
					value={data.move.counts}
					required
					min="1"
					max="999"
				/>
				{#if form?.errors?.counts}
					<label class="label">
						<span class="label-text-alt text-error">{form.errors.counts}</span>
					</label>
				{/if}
				<label class="label">
					<span class="label-text-alt">Number of counts for this move</span>
				</label>
			</div>

			<!-- General Error -->
			{#if form?.error}
				<div class="alert alert-error">
					<span>{form.error}</span>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex gap-2 pt-4">
				<button type="submit" class="btn btn-primary flex-1" disabled={isSubmitting}>
					{#if isSubmitting}
						<span class="loading loading-spinner"></span>
						Saving...
					{:else}
						Save Changes
					{/if}
				</button>
				<button type="button" class="btn btn-ghost" onclick={() => goto(`/moves/${data.move.id}`)}>
					Cancel
				</button>
			</div>
		</div>
	</form>
</div>
