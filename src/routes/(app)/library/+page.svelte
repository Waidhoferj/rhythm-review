<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import IconPlus from '~icons/heroicons/plus-solid';
	import IconXMark from '~icons/heroicons/x-mark-solid';
	import IconBolt from '~icons/heroicons/bolt-solid';
	import IconUserCircle from '~icons/heroicons/user-circle-solid';
	import NumberedList from '~icons/heroicons/numbered-list-solid';
	import SquareStack from '~icons/heroicons/square-3-stack-3d-solid';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let showCreatePopup = $state(false);

	// Initialize search query from data
	$effect(() => {
		searchQuery = data.searchQuery;
	});

	// Handle search input with debouncing
	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleSearch(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;

		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const url = new URL($page.url);
			if (searchQuery) {
				url.searchParams.set('q', searchQuery);
			} else {
				url.searchParams.delete('q');
			}
			goto(url.toString(), { keepFocus: true, noScroll: true });
		}, 300);
	}

	function navigateToMove(id: number) {
		goto(`/moves/${id}`);
	}

	function navigateToPattern(id: number) {
		goto(`/patterns/${id}`);
	}

	function navigateToPracticeSet(id: number) {
		goto(`/practice-sets/${id}`);
	}

	function createMove() {
		showCreatePopup = false;
		goto('/moves/new');
	}

	function createPattern() {
		showCreatePopup = false;
		goto('/patterns/new');
	}

	function createPracticeSet() {
		showCreatePopup = false;
		goto('/practice-sets/new');
	}
</script>

<div class="container mx-auto p-4 pb-24 max-w-6xl">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<h1 class="text-3xl font-bold">Dance Library</h1>
			<button
				class="btn btn-ghost btn-circle"
				onclick={() => goto('/profile')}
				aria-label="Profile & Settings"
			>
				<IconUserCircle class="h-7 w-7" />
			</button>
		</div>
		<p class="text-sm text-base-content/70 mt-1">
			Welcome, {data.user.displayName || data.user.primaryEmail}!
		</p>
	</div>

	<!-- Search Bar -->
	<div class="mb-6">
		<input
			type="text"
			placeholder="Search moves, patterns, and practice sets..."
			class="input input-bordered w-full"
			value={searchQuery}
			oninput={handleSearch}
		/>
	</div>

	<!-- Practice Sets Section -->
	{#if data.practiceSets.length > 0}
		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">Practice Sets</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each data.practiceSets as practiceSet}
					<button
						class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer text-left"
						onclick={() => navigateToPracticeSet(practiceSet.id)}
					>
						<div class="card-body">
							<div class="flex items-start gap-3">
								{#if practiceSet.icon}
									<div class="text-3xl">{practiceSet.icon}</div>
								{/if}
								<div class="flex-1">
									<h3 class="card-title text-lg">{practiceSet.name}</h3>
									{#if practiceSet.description}
										<p class="text-sm text-base-content/70 mt-1">
											{practiceSet.description}
										</p>
									{/if}
									{#if practiceSet.tags.length > 0}
										<div class="flex flex-wrap gap-1 mt-2">
											{#each practiceSet.tags as tag}
												<span class="badge badge-sm badge-primary">{tag}</span>
											{/each}
										</div>
									{/if}
									<p class="text-xs text-base-content/60 mt-2">
										{practiceSet.items.length} item{practiceSet.items.length !== 1 ? 's' : ''}
									</p>
								</div>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Patterns Section -->
	{#if data.patterns.length > 0}
		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">Patterns</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each data.patterns as pattern}
					<button
						class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer text-left"
						onclick={() => navigateToPattern(pattern.id)}
					>
						<div class="card-body">
							<h3 class="card-title text-lg">{pattern.name}</h3>
							{#if pattern.description}
								<p class="text-sm text-base-content/70">{pattern.description}</p>
							{/if}
							<p class="text-xs text-base-content/60 mt-2">
								{pattern.moves.length} move{pattern.moves.length !== 1 ? 's' : ''}
							</p>
						</div>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Moves Section -->
	{#if data.moves.length > 0}
		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">Moves</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each data.moves as move}
					<button
						class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer text-left"
						onclick={() => navigateToMove(move.id)}
					>
						<div class="card-body">
							<h3 class="card-title text-lg">{move.name}</h3>
							{#if move.description}
								<p class="text-sm text-base-content/70">{move.description}</p>
							{/if}
							<p class="text-xs text-base-content/60 mt-2">{move.counts} counts</p>
						</div>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Empty State -->
	{#if data.moves.length === 0 && data.patterns.length === 0 && data.practiceSets.length === 0}
		<div class="text-center py-12">
			{#if data.searchQuery}
				<p class="text-lg text-base-content/70">No results found for "{data.searchQuery}"</p>
				<p class="text-sm text-base-content/60 mt-2">Try a different search term</p>
			{:else}
				<p class="text-lg text-base-content/70">Your library is empty</p>
				<p class="text-sm text-base-content/60 mt-2">
					Click the + button to create your first move, pattern, or practice set
				</p>
			{/if}
		</div>
	{/if}

	<!-- Backdrop (visible when popup is open) -->
	<div
		class="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300
			{showCreatePopup ? 'opacity-100' : 'opacity-0 pointer-events-none'}"
		onclick={() => (showCreatePopup = false)}
		onkeydown={(e) => e.key === 'Escape' && (showCreatePopup = false)}
		role="button"
		tabindex="-1"
		aria-label="Close popup"
	></div>

	<!-- FAB button (visible when popup is closed) -->
	<div
		class="fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out
			{showCreatePopup ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}"
	>
		<button
			class="btn btn-circle btn-primary btn-lg shadow-lg"
			onclick={() => (showCreatePopup = true)}
			aria-label="Create new item"
		>
			<IconPlus class="h-8 w-8" />
		</button>
	</div>

	<!-- Bottom sheet popup (slides up from bottom on mobile, pops near FAB on desktop) -->
	<div
		class="fixed z-50 bottom-0 right-0 left-0 md:left-auto md:bottom-6 md:right-6
			transition-transform duration-300 ease-out
			{showCreatePopup ? 'translate-y-0' : 'translate-y-full md:translate-y-[calc(100%+2rem)]'}"
	>
		<div class="w-full md:w-72 bg-base-100 rounded-t-2xl md:rounded-2xl shadow-2xl">
			<div class="p-4 pb-6 md:p-4">
				<!-- Close button at top-right to match original FAB position -->
				<div class="flex justify-end mb-3">
					<button
						class="btn btn-circle btn-primary btn-lg shadow-lg"
						onclick={() => (showCreatePopup = false)}
						aria-label="Close menu"
					>
						<IconXMark class="h-8 w-8" />
					</button>
				</div>

				<h3 class="text-lg font-bold mb-3 px-1">Create New</h3>
				<div class="space-y-2">
					<button class="btn btn-block btn-lg justify-start" onclick={createMove}>
						<IconBolt class="h-6 w-6" />
						<span class="ml-2">Move</span>
					</button>
					<button class="btn btn-block btn-lg justify-start" onclick={createPattern}>
						<NumberedList class="h-6 w-6" />
						<span class="ml-2">Pattern</span>
					</button>
					<button class="btn btn-block btn-lg justify-start" onclick={createPracticeSet}>
						<SquareStack class="h-6 w-6" />
						<span class="ml-2">Practice Set</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
