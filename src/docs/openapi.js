const code = { name: 'code', in: 'path', required: true, schema: { type: 'string', pattern: '^[A-Za-z0-9_-]{3,16}$' } };

const err = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

export const openapi = {
  openapi: '3.0.3',
  info: { title: 'Linkly', version: '1.0.0', description: 'URL shortener with click analytics' },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: { 200: { description: 'Service and database are up' }, 503: { description: 'Database unavailable' } },
      },
    },
    '/links': {
      post: {
        summary: 'Create a short link',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateLink' } } },
        },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Link' } } } },
          400: err('Invalid URL, code or expiry'),
          409: err('Code already taken'),
        },
      },
    },
    '/links/{code}': {
      get: {
        summary: 'Link metadata',
        parameters: [code],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Link' } } } },
          400: err('Invalid code'),
          404: err('Unknown code'),
        },
      },
      delete: {
        summary: 'Delete a link and its clicks',
        parameters: [code],
        responses: { 204: { description: 'Deleted' }, 400: err('Invalid code'), 404: err('Unknown code') },
      },
    },
    '/links/{code}/clicks': {
      get: {
        summary: 'Keyset-paginated click log',
        parameters: [
          code,
          {
            name: 'after',
            in: 'query',
            description: 'Cursor: last click id from the previous page',
            schema: { type: 'integer', minimum: 1 },
          },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClickPage' } } } },
          400: err('Invalid code or query'),
          404: err('Unknown code'),
        },
      },
    },
    '/links/{code}/clicks.csv': {
      get: {
        summary: 'Streamed CSV of the click log',
        parameters: [code],
        responses: {
          200: { description: 'CSV file', content: { 'text/csv': { schema: { type: 'string' } } } },
          400: err('Invalid code'),
          404: err('Unknown code'),
        },
      },
    },
    '/{code}': {
      get: {
        summary: 'Redirect to the target and record a click',
        parameters: [code],
        responses: {
          302: { description: 'Redirect to target_url (Location header)' },
          400: err('Invalid code'),
          404: err('Unknown code'),
          410: err('Link expired'),
        },
      },
    },
  },
  components: {
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string' } } },
      CreateLink: {
        type: 'object',
        required: ['target_url'],
        properties: {
          target_url: { type: 'string', format: 'uri', description: 'http(s) URL only' },
          code: { type: 'string', pattern: '^[A-Za-z0-9_-]{3,16}$' },
          expires_at: { type: 'string', format: 'date-time' },
        },
      },
      Link: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          target_url: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          expires_at: { type: 'string', format: 'date-time', nullable: true },
          click_count: { type: 'integer' },
        },
      },
      ClickPage: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                clicked_at: { type: 'string', format: 'date-time' },
                referrer: { type: 'string', nullable: true },
                user_agent: { type: 'string', nullable: true },
              },
            },
          },
          next_cursor: { type: 'integer', nullable: true },
        },
      },
    },
  },
};
