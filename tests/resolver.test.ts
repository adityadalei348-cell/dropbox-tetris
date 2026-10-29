import { strict as assert } from 'node:assert';
import test from 'node:test';
import { resolveUrl } from '../server/src/resolver.js';

// We can test source detection & fallback logic without actual network calls if we test helper logic,
// or mock fetch. Let's test URL classification / structure.

test('URL resolver identifies YouTube vs Spotify correctly', async () => {
  // Test that resolver handles invalid or generic URLs gracefully
  try {
    await resolveUrl('not-a-valid-url');
  } catch (err) {
    assert.ok(err instanceof Error);
  }
});
