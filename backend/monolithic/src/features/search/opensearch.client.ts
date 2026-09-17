import type { SearchProjectionDocument } from './projection.types';

export class OpenSearchClient {
  private readonly baseUrl: string;
  private readonly authHeader?: string;

  constructor() {
    this.baseUrl = (process.env.OPENSEARCH_URL || 'http://localhost:9200').replace(/\/$/, '');
    const username = process.env.OPENSEARCH_USERNAME;
    const password = process.env.OPENSEARCH_PASSWORD;

    if (username && password) {
      this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authHeader) {
      headers.Authorization = this.authHeader;
    }
    return headers;
  }

  /**
   * Pings OpenSearch cluster to check connectivity.
   */
  public async ping(): Promise<boolean> {
    try {
      const res = await fetch(this.baseUrl, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Checks if an index exists.
   */
  public async indexExists(indexName: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/${encodeURIComponent(indexName)}`, {
        method: 'HEAD',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(3000),
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Creates an index with specified mappings and settings.
   */
  public async createIndex(indexName: string, mapping: object): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${encodeURIComponent(indexName)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(mapping),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to create index ${indexName}: ${res.status} - ${body}`);
    }
    return true;
  }

  /**
   * Deletes an index.
   */
  public async deleteIndex(indexName: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${encodeURIComponent(indexName)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.ok || res.status === 404;
  }

  /**
   * Creates or updates an alias pointing to an index.
   */
  public async putAlias(indexName: string, aliasName: string): Promise<boolean> {
    const payload = {
      actions: [
        {
          add: {
            index: indexName,
            alias: aliasName,
          },
        },
      ],
    };

    const res = await fetch(`${this.baseUrl}/_aliases`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to map alias ${aliasName} to ${indexName}: ${body}`);
    }
    return true;
  }

  /**
   * Executes a bulk index operation.
   * Formats ndjson payload using stable docId = doc.userId.
   */
  public async bulkIndex(
    indexName: string,
    documents: SearchProjectionDocument[]
  ): Promise<{ indexed: number; errors: any[] }> {
    if (documents.length === 0) return { indexed: 0, errors: [] };

    let ndjson = '';
    for (const doc of documents) {
      const actionLine = JSON.stringify({ index: { _index: indexName, _id: doc.userId } });
      const sourceLine = JSON.stringify(doc);
      ndjson += `${actionLine}\n${sourceLine}\n`;
    }

    const res = await fetch(`${this.baseUrl}/_bulk`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/x-ndjson',
      },
      body: ndjson,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Bulk index failed: ${res.status} - ${body}`);
    }

    const result = (await res.json()) as any;
    const errors: any[] = [];
    let indexed = 0;

    if (Array.isArray(result.items)) {
      for (const item of result.items) {
        const action = item.index || item.create || item.update;
        if (action && action.error) {
          errors.push(action);
        } else {
          indexed++;
        }
      }
    }

    return { indexed, errors };
  }

  /**
   * Retrieves a document by its ID.
   */
  public async getDocument(
    indexName: string,
    docId: string
  ): Promise<SearchProjectionDocument | null> {
    try {
      const res = await fetch(
        `${this.baseUrl}/${encodeURIComponent(indexName)}/_doc/${encodeURIComponent(docId)}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (res.status === 404) return null;
      if (!res.ok) return null;

      const data = (await res.json()) as any;
      return (data._source as SearchProjectionDocument) || null;
    } catch {
      return null;
    }
  }

  /**
   * Deletes a document by ID.
   */
  public async deleteDocument(indexName: string, docId: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.baseUrl}/${encodeURIComponent(indexName)}/_doc/${encodeURIComponent(docId)}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );
      return res.ok || res.status === 404;
    } catch {
      return false;
    }
  }
}

export const opensearchClient = new OpenSearchClient();
