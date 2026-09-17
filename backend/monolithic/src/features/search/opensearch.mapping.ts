export const USER_INDEX_ALIAS = process.env.OPENSEARCH_INDEX_ALIAS || 'ginivibe-users';
export const USER_INDEX_VERSION = 1;
export const USER_INDEX_NAME = `${USER_INDEX_ALIAS}-v${USER_INDEX_VERSION}`;

export const USER_INDEX_MAPPING = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        ginivibe_text_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding'],
        },
      },
    },
  },
  mappings: {
    properties: {
      userId: {
        type: 'keyword',
      },
      username: {
        type: 'text',
        analyzer: 'ginivibe_text_analyzer',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      displayName: {
        type: 'text',
        analyzer: 'ginivibe_text_analyzer',
      },
      firstName: {
        type: 'text',
        analyzer: 'ginivibe_text_analyzer',
      },
      lastName: {
        type: 'text',
        analyzer: 'ginivibe_text_analyzer',
      },
      bio: {
        type: 'text',
        analyzer: 'ginivibe_text_analyzer',
      },
      profilePic: {
        type: 'keyword',
        index: false,
      },
      gender: {
        type: 'keyword',
      },
      zodiacSign: {
        type: 'keyword',
      },
      dob: {
        type: 'keyword',
      },
      interests: {
        type: 'keyword',
      },
      canonicalText: {
        type: 'text',
        analyzer: 'ginivibe_text_analyzer',
      },
      contentHash: {
        type: 'keyword',
      },
      projectionVersion: {
        type: 'integer',
      },
      indexedAt: {
        type: 'date',
      },
    },
  },
};
