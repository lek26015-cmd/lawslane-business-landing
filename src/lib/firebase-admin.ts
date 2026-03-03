/**
 * Edge-compatible stub for firebase-admin.
 * In the landing page project, we use the client SDK instead of the admin SDK
 * because 'firebase-admin' is not compatible with Edge runtime.
 */

export async function initAdmin() {
    console.warn("initAdmin() called in Edge environment. Returning null.");
    return null;
}

export const admin = null;
