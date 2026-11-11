import { test, expect } from '@playwright/test';
import { GraphQLClient } from '../../src/clients/graphqlClient';
import { loadQuery } from '../../src/utils/files';
import { endpoints } from '../../src/config';

type Post = { id: string; title: string; body?: string };

/**
 * GraphQLZero is a fake JSONPlaceholder-backed API: mutations return realistic
 * payloads but nothing is persisted, so we assert on the mutation responses.
 */
test.describe('GraphQLZero — mutations (CRUD)', () => {
  let gql: GraphQLClient;
  test.beforeEach(({ request }) => {
    gql = new GraphQLClient(request, endpoints.graphqlZero);
  });

  test('createPost returns the new post with an id', async () => {
    const input = { title: `QA post ${Date.now()}`, body: 'Created by automation' };
    const data = await gql.queryOk<{ createPost: Post }>(loadQuery('createPost'), { input });
    expect(data.createPost.id).toBeTruthy();
    expect(data.createPost).toMatchObject(input);
  });

  test('updatePost changes only the given fields', async () => {
    const data = await gql.queryOk<{ updatePost: Post }>(loadQuery('updatePost'), {
      id: '1',
      input: { title: 'Updated by automation' },
    });
    expect(data.updatePost.id).toBe('1');
    expect(data.updatePost.title).toBe('Updated by automation');
    expect(data.updatePost.body).toBeTruthy(); // untouched field still present
  });

  test('deletePost returns true', async () => {
    const data = await gql.queryOk<{ deletePost: boolean }>(loadQuery('deletePost'), { id: '1' });
    expect(data.deletePost).toBe(true);
  });

  test('nested query resolves related user', async () => {
    const data = await gql.queryOk<{ post: Post & { user: { id: string; name: string; email: string } } }>(
      loadQuery('getPostWithUser'),
      { id: '1' },
    );
    expect(data.post.user.id).toBeTruthy();
    expect(data.post.user.email).toMatch(/^[^@\s]+@[^@\s]+$/);
  });
});
