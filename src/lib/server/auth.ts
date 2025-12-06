import { StackServerApp } from '@stackframe/js';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { STACK_SECRET_SERVER_KEY } from '$env/static/private';
import { PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY, PUBLIC_STACK_PROJECT_ID } from '$env/static/public';

// Initialize Stack Auth server app
const stackServerApp = new StackServerApp({
    projectId: PUBLIC_STACK_PROJECT_ID,
    publishableClientKey: PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
    secretServerKey: STACK_SECRET_SERVER_KEY,
    tokenStore: 'cookie'
});

/**
 * Get the current authenticated user from the request
 * @param event - SvelteKit RequestEvent containing cookies
 * @returns User object if authenticated, null otherwise
 */
export async function getCurrentUser(event: RequestEvent) {
    try {
        const user = await stackServerApp.getUser({ tokenStore: event.request });
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Require authentication for a route
 * Throws redirect if user is not authenticated
 * @param event - SvelteKit RequestEvent
 * @returns User object
 */
export async function requireAuth(event: RequestEvent) {
    const user = await getCurrentUser(event);

    if (!user) {
        throw redirect(302, '/auth/signin');
    }

    return user;
}
