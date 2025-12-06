import { StackClientApp } from '@stackframe/js';
import { PUBLIC_STACK_PROJECT_ID, PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY } from '$env/static/public';

export const stackClientApp = new StackClientApp({
	projectId: PUBLIC_STACK_PROJECT_ID,
	publishableClientKey: PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
	tokenStore: 'cookie',
	urls: {
		handler: '/auth'
	}
});
