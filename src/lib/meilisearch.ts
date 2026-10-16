import { MeiliSearch } from 'meilisearch';

const host = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const apiKey = process.env.MEILISEARCH_ADMIN_KEY || '';

export const meilisearchClient = new MeiliSearch({
  host,
  apiKey,
});
