const request = require('supertest');
const app = require('../../src/app');

const BASE = '/notes';

function extractId(response) {
  return response.body.id;
}

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
    });

    it('creates a note with only title', async () => {
      const res = await request(app)
        .post(BASE)
        .send({ title: 'Only title' })
        .expect(201);

      expect(res.body.title).toBe('Only title');
      expect(res.body.content).toBe('');
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
    it('returns all notes', async () => {
      const res = await request(app).get(BASE).expect(200);
      expect(Array.isArray(res.body)).toBe(true);
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
    it('returns a note by id', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Find Me', content: 'Content' });

      const res = await request(app)
        .get(`${BASE}/${createRes.body.id}`)
        .expect(200);

      expect(res.body.title).toBe('Find Me');
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
    it('updates title and content', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Original', content: 'Original body' });

      const res = await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ title: 'Updated', content: 'Updated body' })
        .expect(200);

      expect(res.body.title).toBe('Updated');
      expect(res.body.content).toBe('Updated body');
    });

    it('updates only title, preserves content', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Keep Content', content: 'Important' });

      const res = await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ title: 'New Title' })
        .expect(200);

      expect(res.body.title).toBe('New Title');
      expect(res.body.content).toBe('Important');
    });

    it('updates only content, preserves title', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Keep Title', content: 'Old body' });

      const res = await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ content: 'New body' })
        .expect(200);

      expect(res.body.title).toBe('Keep Title');
      expect(res.body.content).toBe('New body');
    });

    it('returns 404 when updating non-existent note', async () => {
      await request(app)
        .put(`${BASE}/00000000-0000-0000-0000-000000000000`)
        .send({ title: 'Nope' })
        .expect(404);
    });

    it('returns 400 for invalid UUID format', async () => {
      await request(app)
        .put(`${BASE}/bad-id`)
        .send({ title: 'Nope' })
        .expect(400);
    });

    it('updates updated_at timestamp', async () => {
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Time Test', content: 'Body' });

      await new Promise((r) => setTimeout(r, 10));

      const updateRes = await request(app)
        .put(`${BASE}/${createRes.body.id}`)
        .send({ title: 'Time Updated' });

      expect(new Date(updateRes.body.updated_at).getTime()).toBeGreaterThan(
        new Date(createRes.body.updated_at).getTime()
      );
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
      // Create
      const createRes = await request(app)
        .post(BASE)
        .send({ title: 'Lifecycle', content: 'Full test' })
        .expect(201);

      const id = createRes.body.id;
      expect(id).toBeDefined();

      // Read
      const readRes = await request(app).get(`${BASE}/${id}`).expect(200);
      expect(readRes.body.title).toBe('Lifecycle');

      // Update
      const updateRes = await request(app)
        .put(`${BASE}/${id}`)
        .send({ title: 'Lifecycle Updated' })
        .expect(200);
      expect(updateRes.body.title).toBe('Lifecycle Updated');
      expect(updateRes.body.content).toBe('Full test');

      // Verify in list
      const listRes = await request(app).get(BASE).expect(200);
      const found = listRes.body.find((n) => n.id === id);
      expect(found).toBeDefined();
      expect(found.title).toBe('Lifecycle Updated');

      // Delete
      await request(app).delete(`${BASE}/${id}`).expect(204);

      // Verify gone
      await request(app).get(`${BASE}/${id}`).expect(404);

      const finalList = await request(app).get(BASE).expect(200);
      const stillFound = finalList.body.find((n) => n.id === id);
      expect(stillFound).toBeUndefined();
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
