const request = require('supertest');
const app = require('../../src/app');

const BASE = '/notes';

describe('Notes API — Integration', () => {
  describe('POST /notes', () => {
    it('creates a note with title and content', async () => {
      const res = await request(app)
        .post(BASE)
        .send({ title: 'Test Note', content: 'Test content' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Test Note');
      expect(res.body.content).toBe('Test content');
      expect(res.body.version).toBe(1);
      expect(res.body.created_at).toBeDefined();
      expect(res.body.updated_at).toBeDefined();
    });

    it('creates a note with only content', async () => {
      const res = await request(app)
        .post(BASE)
        .send({ content: 'Only content' })
        .expect(201);

      expect(res.body.title).toBe('Untitled');
      expect(res.body.content).toBe('Only content');
      expect(res.body.version).toBe(1);
    });

    it('creates a note with only title', async () => {
      const res = await request(app)
        .post(BASE)
        .send({ title: 'Only title' })
        .expect(201);

      expect(res.body.title).toBe('Only title');
      expect(res.body.content).toBe('');
      expect(res.body.version).toBe(1);
    });

    it('returns 400 when both title and content are missing', async () => {
      const res = await request(app)
        .post(BASE)
        .send({})
        .expect(400);

      expect(res.body.error).toBe('Title or content is required');
    });

    it('returns 400 when body is completely empty', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Content-Type', 'application/json')
        .send('')
        .expect(400);
    });
  });

  describe('GET /notes', () => {
    it('returns all notes with version field', async () => {
      const res = await request(app).get(BASE).expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((note) => {
        expect(note.version).toBeDefined();
        expect(typeof note.version).toBe('number');
      });
    });

    it('returns notes ordered by created_at DESC', async () => {
      const first = await request(app).post(BASE).send({ title: 'Old', content: '1' });
      await new Promise((r) => setTimeout(r, 20));
      const second = await request(app).post(BASE).send({ title: 'New', content: '2' });

      const res = await request(app).get(BASE).expect(200);

      expect(res.body[0].id).toBe(second.body.id);
      expect(res.body[1].id).toBe(first.body.id);
      expect(new Date(res.body[0].created_at).getTime()).toBeGreaterThanOrEqual(
        new Date(res.body[1].created_at).getTime()
      );
    });
  });

  describe('GET /notes/:id', () => {
    it('returns a note by id with version', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Find Me', content: 'Content' });

      const res = await request(app)
        .get(`${BASE}/${createRes.body.id}`)
        .expect(200);

      expect(res.body.title).toBe('Find Me');
      expect(res.body.version).toBe(1);
    });

    it('returns 404 for non-existent note', async () => {
      const res = await request(app)
        .get(`${BASE}/00000000-0000-0000-0000-000000000000`)
        .expect(404);

      expect(res.body.error).toBe('Note not found');
    });

    it('returns 400 for invalid UUID format', async () => {
      const res = await request(app)
        .get(`${BASE}/not-a-uuid`)
        .expect(400);

      expect(res.body.error).toBe('Invalid note ID format');
    });
  });

  describe('PUT /notes/:id', () => {
    it('updates title and content with correct version', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Original', content: 'Original body' });

      const res = await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ title: 'Updated', content: 'Updated body', version: 1 })
        .expect(200);

      expect(res.body.title).toBe('Updated');
      expect(res.body.content).toBe('Updated body');
      expect(res.body.version).toBe(2);
    });

    it('updates only title, preserves content', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Keep Content', content: 'Important' });

      const res = await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ title: 'New Title', version: 1 })
        .expect(200);

      expect(res.body.title).toBe('New Title');
      expect(res.body.content).toBe('Important');
      expect(res.body.version).toBe(2);
    });

    it('updates only content, preserves title', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Keep Title', content: 'Old body' });

      const res = await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ content: 'New body', version: 1 })
        .expect(200);

      expect(res.body.title).toBe('Keep Title');
      expect(res.body.content).toBe('New body');
      expect(res.body.version).toBe(2);
    });

    it('returns 404 when updating non-existent note', async () => {
      await request(app)
        .put(`${BASE}/00000000-0000-0000-0000-000000000000`)
        .send({ title: 'Nope', version: 1 })
        .expect(404);
    });

    it('returns 400 for invalid UUID format', async () => {
      await request(app)
        .put(`${BASE}/bad-id`)
        .send({ title: 'Nope', version: 1 })
        .expect(400);
    });

    it('updates updated_at timestamp', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Time Test', content: 'Body' });

      await new Promise((r) => setTimeout(r, 10));

      const updateRes = await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ title: 'Time Updated', version: 1 });

      expect(new Date(updateRes.body.updated_at).getTime()).toBeGreaterThan(
        new Date(createRes.body.updated_at).getTime()
      );
    });

    it('returns 400 when version is missing', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'No Version', content: 'Test' });

      const res = await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ title: 'Updated', content: 'Updated' })
        .expect(400);

      expect(res.body.error).toBe('Version is required for updates');
    });

    it('returns 400 when version is invalid (not a number)', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Bad Version', content: 'Test' });

      const res = await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ title: 'Updated', version: 'abc' })
        .expect(400);

      expect(res.body.error).toBe('Invalid version number');
    });

    it('returns 400 when version is zero', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Zero Version', content: 'Test' });

      await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ title: 'Updated', version: 0 })
        .expect(400);
    });

    it('returns 400 when version is negative', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Neg Version', content: 'Test' });

      await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ title: 'Updated', version: -1 })
        .expect(400);
    });

    it('returns 400 when version is a float', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Float Version', content: 'Test' });

      await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ title: 'Updated', version: 1.5 })
        .expect(400);
    });
  });

  describe('DELETE /notes/:id', () => {
    it('deletes an existing note', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Delete Me', content: 'Gone' });

      await request(app)
        .delete(`${BASE}/${createRes.body.id}`)
        .expect(204);

      await request(app)
        .get(`${BASE}/${createRes.body.id}`)
        .expect(404);
    });

    it('returns 404 when deleting non-existent note', async () => {
      await request(app)
        .delete(`${BASE}/00000000-0000-0000-0000-000000000000`)
        .expect(404);
    });

    it('returns 404 when deleting the same note twice', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Double Delete', content: 'Test' });

      await request(app)
        .delete(`${BASE}/${createRes.body.id}`)
        .expect(204);

      await request(app)
        .delete(`${BASE}/${createRes.body.id}`)
        .expect(404);
    });

    it('returns 400 for invalid UUID format', async () => {
      await request(app)
        .delete(`${BASE}/not-a-uuid`)
        .expect(400);
    });
  });

  describe('Full CRUD Lifecycle', () => {
    it('create → read → update → delete → verify gone', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Lifecycle', content: 'Full test' })
        .expect(201);

      const id = createRes.body.id;
      expect(id).toBeDefined();
      expect(createRes.body.version).toBe(1);

      const readRes = await request(app).get(`${BASE}/${id}`).expect(200);
      expect(readRes.body.title).toBe('Lifecycle');
      expect(readRes.body.version).toBe(1);

      const updateRes = await request(app)
        .put(`${BASE}/${id}`)
        .send({ title: 'Lifecycle Updated', version: 1 })
        .expect(200);
      expect(updateRes.body.title).toBe('Lifecycle Updated');
      expect(updateRes.body.content).toBe('Full test');
      expect(updateRes.body.version).toBe(2);

      const listRes = await request(app).get(BASE).expect(200);
      const found = listRes.body.find((n) => n.id === id);
      expect(found).toBeDefined();
      expect(found.title).toBe('Lifecycle Updated');
      expect(found.version).toBe(2);

      await request(app).delete(`${BASE}/${id}`).expect(204);

      await request(app).get(`${BASE}/${id}`).expect(404);

      const finalList = await request(app).get(BASE).expect(200);
      const stillFound = finalList.body.find((n) => n.id === id);
      expect(stillFound).toBeUndefined();
    });
  });

  describe('Optimistic Concurrency Control (OCC)', () => {
    it('second concurrent update with stale version returns 409', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Original', content: 'Original' })
        .expect(201);

      const id = createRes.body.id;
      expect(createRes.body.version).toBe(1);

      const getA = await request(app).get(`${BASE}/${id}`).expect(200);
      const getB = await request(app).get(`${BASE}/${id}`).expect(200);

      expect(getA.body.version).toBe(1);
      expect(getB.body.version).toBe(1);

      const updateA = await request(app)
        .put(`${BASE}/${id}`)
        .send({ title: 'Client A', version: 1 })
        .expect(200);

      expect(updateA.body.version).toBe(2);
      expect(updateA.body.title).toBe('Client A');

      const updateB = await request(app)
        .put(`${BASE}/${id}`)
        .send({ title: 'Client B', version: 1 })
        .expect(409);

      expect(updateB.body.error).toBe('Note has been modified by another client');
      expect(updateB.body.clientVersion).toBe(1);
      expect(updateB.body.currentVersion).toBe(2);
    });

    it('DB state remains unchanged after conflict', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Conflict Test', content: 'Content' })
        .expect(201);

      const id = createRes.body.id;

      await request(app)
        .put(`${BASE}/${id}`)
        .send({ title: 'First Update', version: 1 })
        .expect(200);

      await request(app)
        .put(`${BASE}/${id}`)
        .send({ title: 'Stale Update', version: 1 })
        .expect(409);

      const current = await request(app).get(`${BASE}/${id}`).expect(200);

      expect(current.body.title).toBe('First Update');
      expect(current.body.version).toBe(2);
    });

    it('version increments correctly across multiple updates', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Version Test', content: '' })
        .expect(201);

      const id = createRes.body.id;
      let version = 1;

      for (let i = 1; i <= 5; i++) {
        const res = await request(app)
          .put(`${BASE}/${id}`)
          .send({ title: `Update ${i}`, version })
          .expect(200);

        expect(res.body.version).toBe(i + 1);
        expect(res.body.title).toBe(`Update ${i}`);
        version = res.body.version;
      }

      const current = await request(app).get(`${BASE}/${id}`).expect(200);
      expect(current.body.version).toBe(6);
    });

    it('correct update succeeds after resolving conflict', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Resolve Test', content: '' })
        .expect(201);

      const id = createRes.body.id;

      const updateA = await request(app)
        .put(`${BASE}/${id}`)
        .send({ title: 'A wins', version: 1 })
        .expect(200);

      const conflict = await request(app)
        .put(`${BASE}/${id}`)
        .send({ title: 'B stale', version: 1 })
        .expect(409);

      expect(conflict.body.currentVersion).toBe(2);

      const updateBRetry = await request(app)
        .put(`${BASE}/${id}`)
        .send({ title: 'B resolved', version: conflict.body.currentVersion })
        .expect(200);

      expect(updateBRetry.body.title).toBe('B resolved');
      expect(updateBRetry.body.version).toBe(3);
    });

    it('stale update with version far behind current returns 409', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Far Behind', content: '' })
        .expect(201);

      const id = createRes.body.id;

      for (let v = 1; v <= 4; v++) {
        await request(app)
          .put(`${BASE}/${id}`)
          .send({ title: `v${v + 1}`, version: v });
      }

      const stale = await request(app)
        .put(`${BASE}/${id}`)
        .send({ title: 'Very Stale', version: 1 })
        .expect(409);

      expect(stale.body.clientVersion).toBe(1);
      expect(stale.body.currentVersion).toBe(5);
    });
  });

  describe('Edge Cases — Content Validation', () => {
    it('accepts empty string content', async () => {
      const res = await request(app)
        .post(BASE)
        .send({ title: 'Empty Content', content: '' })
        .expect(201);

      expect(res.body.content).toBe('');
    });

    it('accepts very large content (100KB)', async () => {
      const largeContent = 'x'.repeat(100 * 1024);

      const res = await request(app)
        .post(BASE)
        .send({ title: 'Large Note', content: largeContent })
        .expect(201);

      expect(res.body.content.length).toBe(100 * 1024);
    });

    it('accepts content with special characters', async () => {
      const special = '<script>alert(1)</script>\n"quotes"&\'apostrophe\' — emoji ✅';

      const res = await request(app)
        .post(BASE)
        .send({ title: 'Special', content: special })
        .expect(201);

      expect(res.body.content).toBe(special);
    });

    it('accepts unicode content', async () => {
      const unicode = 'こんにちは 你好 مرحبا 🎉';

      const res = await request(app)
        .post(BASE)
        .send({ title: 'Unicode', content: unicode })
        .expect(201);

      expect(res.body.content).toBe(unicode);
    });

    it('accepts multi-line content', async () => {
      const multiLine = 'Line 1\nLine 2\n\nLine 4';

      const res = await request(app)
        .post(BASE)
        .send({ title: 'Multi', content: multiLine })
        .expect(201);

      expect(res.body.content).toBe(multiLine);
    });
  });
});
