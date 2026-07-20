<script lang="ts">
	import { goto } from '$app/navigation';
	import IconStop from '~icons/heroicons/stop-solid';
	import IconCheck from '~icons/heroicons/check-solid';
	import IconXMark from '~icons/heroicons/x-mark-solid';
	import { createPracticeSession } from '$lib/client/stores/practice-session.svelte';
	import { isMove, isPattern } from '$lib/client/utils/practice-queue';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const session = createPracticeSession(data.practiceSet.items);

	// Animation state
	let animState = $state<'idle' | 'exit-up' | 'exit-down' | 'enter'>('idle');
	let animColor = $state<'text-success' | 'text-error' | ''>('');

	function handleSuccess() {
		animState = 'exit-up';
		animColor = 'text-success';
		setTimeout(() => {
			session.markSuccess();
			animState = 'enter';
			animColor = '';
			setTimeout(() => {
				animState = 'idle';
			}, 180);
		}, 210);
	}

	function handleFailure() {
		animState = 'exit-down';
		animColor = 'text-error';
		setTimeout(() => {
			session.markFailure();
			animState = 'enter';
			animColor = '';
			setTimeout(() => {
				animState = 'idle';
			}, 180);
		}, 210);
	}

	function handleStop() {
		session.stop();
	}

	function handleBackToSet() {
		goto(`/practice-sets/${data.practiceSet.id}`);
	}
</script>

{#if session.isActive && session.currentItem}
	<!-- Active Practice View -->
	<div class="fixed inset-0 bg-base-200 flex flex-col">
		<!-- Header -->
		<div class="p-4">
			<div class="container mx-auto max-w-2xl">
				<h2 class="text-lg font-semibold text-center text-base-content/70">
					{data.practiceSet.name}
				</h2>
				{#if session.totalAttempts > 0}
					<p class="text-sm text-center text-base-content/50 mt-1">
						{session.totalAttempts} attempts · {session.successRate}% success
					</p>
				{/if}
			</div>
		</div>

		<!-- Main practice area - centered text, no card -->
		<div class="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
			<div
				class="flex flex-col items-center transition-all duration-200 ease-out
					{animState === 'exit-up' ? '-translate-y-16 opacity-0' : ''}
					{animState === 'exit-down' ? 'translate-y-16 opacity-0' : ''}
					{animState === 'enter' ? 'opacity-0' : ''}
					{animState === 'idle' ? 'translate-y-0 opacity-100' : ''}
					{animColor}"
			>
				<h1 class="text-5xl font-bold text-center">{session.currentItem.item.name}</h1>

				{#if session.currentItem.item.description}
					<p class="text-xl text-center text-base-content/70 mt-6">
						{session.currentItem.item.description}
					</p>
				{/if}

				{#if isMove(session.currentItem.item)}
					<div class="badge badge-lg mt-6">{session.currentItem.item.counts} counts</div>
				{:else if isPattern(session.currentItem.item)}
					<div class="badge badge-lg mt-6">
						{session.currentItem.item.moves.length} moves
					</div>
				{/if}
			</div>
		</div>

		<!-- Divider -->
		<div class="divider mx-4 my-0"></div>

		<!-- Bottom controls: Stop | Failure | Success - full width on mobile -->
		<div class="p-4 pb-8">
			<div class="container mx-auto max-w-2xl">
				<div class="grid grid-cols-3 gap-3">
					<button
						class="btn btn-lg h-20 rounded-2xl border border-base-300 bg-transparent text-base-content/60"
						onclick={handleStop}
						aria-label="Stop session"
					>
						<IconStop class="h-9 w-9" />
					</button>
					<button
						class="btn btn-error btn-lg h-20 rounded-2xl"
						onclick={handleFailure}
						aria-label="Failed"
					>
						<IconXMark class="h-10 w-10" />
					</button>
					<button
						class="btn btn-success btn-lg h-20 rounded-2xl"
						onclick={handleSuccess}
						aria-label="Success"
					>
						<IconCheck class="h-10 w-10" />
					</button>
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- Session Complete / Stopped -->
	<div class="container mx-auto p-4 max-w-2xl">
		<div class="text-center py-12">
			<h1 class="text-3xl font-bold mb-4">Practice Complete!</h1>
			<p class="text-lg text-base-content/70 mb-8">
				Great work practicing <strong>{data.practiceSet.name}</strong>
			</p>

			<!-- Summary Stats -->
			{#if session.totalAttempts > 0}
				<div class="stats stats-vertical lg:stats-horizontal shadow mb-8">
					<div class="stat">
						<div class="stat-title">Total Attempts</div>
						<div class="stat-value text-2xl">{session.totalAttempts}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Success Rate</div>
						<div
							class="stat-value text-2xl {session.successRate >= 70
								? 'text-success'
								: session.successRate >= 50
									? 'text-warning'
									: 'text-error'}"
						>
							{session.successRate}%
						</div>
					</div>
					<div class="stat">
						<div class="stat-title">Successes</div>
						<div class="stat-value text-2xl text-success">{session.totalSuccesses}</div>
					</div>
				</div>

				<!-- Per-item breakdown -->
				{#if session.queue.some((item) => item.successes + item.failures > 0)}
					<div class="card bg-base-200 text-left mb-8">
						<div class="card-body">
							<h3 class="card-title text-lg">Item Breakdown</h3>
							<div class="space-y-2">
								{#each session.queue
									.filter((item) => item.successes + item.failures > 0)
									.sort((a, b) => {
										const rateA = a.successes / (a.successes + a.failures);
										const rateB = b.successes / (b.successes + b.failures);
										return rateA - rateB;
									}) as item}
									{@const attempts = item.successes + item.failures}
									{@const rate = Math.round((item.successes / attempts) * 100)}
									<div class="flex items-center justify-between p-3 bg-base-100 rounded-lg">
										<div>
											<div class="font-medium">{item.item.name}</div>
											<div class="text-sm text-base-content/60">
												{item.successes}/{attempts} successful
											</div>
										</div>
										<div
											class="font-bold {rate >= 70
												? 'text-success'
												: rate >= 50
													? 'text-warning'
													: 'text-error'}"
										>
											{rate}%
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			{/if}

			<!-- Action buttons -->
			<div class="flex gap-4 justify-center">
				<button class="btn btn-primary" onclick={() => location.reload()}> Practice Again </button>
				<button class="btn btn-ghost" onclick={handleBackToSet}> Back to Practice Set </button>
			</div>
		</div>
	</div>
{/if}
