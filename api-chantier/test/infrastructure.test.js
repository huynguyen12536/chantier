import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        server,
        base: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((r, j) => server.close((err) => (err ? j(err) : r()))),
      });
    });
  });
}

describe('Imp-01 Infrastructure', () => {
  it('GET /health/live returns 200 without requiring DB', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const res = await fetch(`${base}/health/live`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.check, 'live');
      assert.equal(body.status, 'ok');
      assert.ok(res.headers.get('x-correlation-id'));
    } finally {
      await close();
    }
  });

  it('echoes inbound x-correlation-id', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const res = await fetch(`${base}/health/live`, {
        headers: { 'x-correlation-id': 'test-corr-001' },
      });
      assert.equal(res.headers.get('x-correlation-id'), 'test-corr-001');
    } finally {
      await close();
    }
  });

  it('GET unknown route returns 404 envelope with correlationId', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const res = await fetch(`${base}/no-such-route`);
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.error.code, 'NOT_FOUND');
      assert.ok(body.error.correlationId);
    } finally {
      await close();
    }
  });

  it('root returns service metadata', async () => {
    const app = createApp();
    const { base, close } = await listen(app);
    try {
      const res = await fetch(`${base}/`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.name, 'api-chantier');
    } finally {
      await close();
    }
  });
});
