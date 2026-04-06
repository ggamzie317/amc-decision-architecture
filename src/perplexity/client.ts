export interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface PerplexityJsonSchemaConfig {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
}

export interface PerplexityJsonSchemaRequest {
  model?: string;
  messages: PerplexityMessage[];
  jsonSchema: PerplexityJsonSchemaConfig;
  searchDomainFilter?: string[];
  temperature?: number;
}

export interface PerplexityJsonSchemaResponse {
  id?: string;
  model?: string;
  content: string;
  citations: string[];
}

export class PerplexityApiError extends Error {
  readonly status: number;
  readonly responseText: string;

  constructor(status: number, responseText: string) {
    super(`Perplexity API request failed with status ${status}`);
    this.name = "PerplexityApiError";
    this.status = status;
    this.responseText = responseText;
  }
}

export interface PerplexityClientOptions {
  apiKey?: string;
  apiBaseUrl?: string;
  defaultModel?: string;
}

export class PerplexityClient {
  private readonly apiKey: string;
  private readonly apiBaseUrl: string;
  private readonly defaultModel: string;

  constructor(options: PerplexityClientOptions = {}) {
    const apiKey = options.apiKey ?? process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY is required");
    }

    this.apiKey = apiKey;
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.perplexity.ai";
    this.defaultModel = options.defaultModel ?? process.env.PERPLEXITY_MODEL ?? "sonar";
  }

  async createJsonSchemaCompletion(
    request: PerplexityJsonSchemaRequest,
  ): Promise<PerplexityJsonSchemaResponse> {
    const payload = {
      model: request.model ?? this.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? 0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: request.jsonSchema.name,
          schema: request.jsonSchema.schema,
          strict: request.jsonSchema.strict ?? true,
        },
      },
      ...(request.searchDomainFilter && request.searchDomainFilter.length > 0
        ? { search_domain_filter: request.searchDomainFilter }
        : {}),
    };

    const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new PerplexityApiError(response.status, text);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new Error(`Perplexity API returned non-JSON response: ${String(error)}`);
    }

    const content = parsed?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new Error("Perplexity API response missing choices[0].message.content");
    }

    const citations = Array.isArray(parsed?.citations)
      ? parsed.citations.filter((item: unknown) => typeof item === "string")
      : [];

    return {
      id: typeof parsed?.id === "string" ? parsed.id : undefined,
      model: typeof parsed?.model === "string" ? parsed.model : undefined,
      content,
      citations,
    };
  }
}
