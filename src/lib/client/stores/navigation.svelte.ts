/**
 * Navigation direction tracking for iOS-style page transitions.
 * Automatically determines direction by comparing route depth.
 * Can also be explicitly signaled for edge cases.
 */

let explicitBack = $state(false);

/**
 * Call this before goto() to explicitly signal a backward navigation.
 * Useful for cases where route depth doesn't decrease (e.g., sibling routes).
 */
export function setNavigatingBack() {
	explicitBack = true;
}

/**
 * Determines navigation direction by comparing old and new URL paths.
 * Falls back to explicit signal if set.
 */
export function getNavigationDirection(from?: string, to?: string): 'back' | 'forward' {
	if (explicitBack) {
		explicitBack = false;
		return 'back';
	}

	if (from && to) {
		const fromDepth = from.replace(/\/$/, '').split('/').filter(Boolean).length;
		const toDepth = to.replace(/\/$/, '').split('/').filter(Boolean).length;

		if (toDepth < fromDepth) {
			return 'back';
		}
	}

	return 'forward';
}
