/**
 * MSW Server Setup
 * Use this in Node.js environment (tests, SSR)
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

