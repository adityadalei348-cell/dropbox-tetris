import { strict as assert } from 'node:assert';
import test from 'node:test';
import { LANES, getShapeForMetadata } from '../client/src/gameEngine.js';

test('Lanes configuration has correct formats and support', () => {
  assert.equal(LANES.length, 4);
  assert.equal(LANES[0].id, 'mp3');
  assert.equal(LANES[1].id, 'mp4');
  assert.equal(LANES[1].supportsVideo, true);
  assert.equal(LANES[0].supportsVideo, false);
});

test('getShapeForMetadata returns correct shape based on type', () => {
  const singleTrack = { title: 'Track', thumbnail: '', type: 'track' as const, source: 'youtube' as const, url: '' };
  const shape = getShapeForMetadata(singleTrack);
  assert.deepEqual(shape, [[1]]);

  const playlist = { title: 'Playlist', thumbnail: '', type: 'playlist' as const, trackCount: 15, source: 'youtube' as const, url: '' };
  const playlistShape = getShapeForMetadata(playlist);
  assert.deepEqual(playlistShape, [[1, 1], [1, 1]]);
});
