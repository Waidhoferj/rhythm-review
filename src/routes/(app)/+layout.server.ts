import { requireAuth } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

/**
 * Protected layout for all authenticated routes
 * Redirects to login if user is not authenticated
 */
export const load: LayoutServerLoad = async (event) => {
    // Require authentication - will redirect if not authenticated
    const user = await requireAuth(event);

    // Return user data to all child routes
    return {
        user: {
            id: user.id,
            primaryEmail: user.primaryEmail,
            displayName: user.displayName,
            profileImageUrl: user.profileImageUrl
        }
    };
};
