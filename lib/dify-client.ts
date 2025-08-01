interface DifyWorkflowResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: any;
    error?: string;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

interface DifyResponse {
  answer: string;
  conversation_id?: string;
  message_id?: string;
  workflow_run_id?: string;
  task_id?: string;
  metadata?: {
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}

interface DifyError {
  code: string;
  message: string;
  status: number;
}

export class DifyClient {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.DIFY_API_URL || '';
    this.apiKey = process.env.DIFY_API_KEY || '';

    if (!this.apiUrl || !this.apiKey) {
      throw new Error('DIFY_API_URL and DIFY_API_KEY must be set in environment variables');
    }
  }

  async runWorkflow(
    inputs: Record<string, any>,
    user: string = 'default-user'
  ): Promise<DifyWorkflowResponse> {
    try {
      const endpoint = `${this.apiUrl}/workflows/run`;

      console.log('Making request to DIFY Workflow API:', {
        url: endpoint,
        hasApiKey: !!this.apiKey,
        apiKeyPrefix: this.apiKey.substring(0, 10) + '...',
        inputs: Object.keys(inputs)
      });

      const requestBody = {
        inputs,
        response_mode: 'blocking',
        user,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('DIFY Workflow API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DIFY Workflow API error response:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(`DIFY Workflow API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('DIFY Workflow API success response:', data);
      return data;
    } catch (error) {
      console.error('DIFY Workflow API request failed:', error);
      throw error;
    }
  }

  async chatCompletion(
    query: string,
    user: string = 'default-user',
    conversationId?: string
  ): Promise<DifyResponse> {
    try {
      // まずワークフローを試す（正しいパラメータ名を使用）
      try {
        const workflowResponse = await this.runWorkflow({
          documents: query
        }, user);

        // ワークフローレスポンスをDifyResponseに変換
        return {
          answer: workflowResponse.data.outputs?.answer || JSON.stringify(workflowResponse.data.outputs),
          workflow_run_id: workflowResponse.workflow_run_id,
          task_id: workflowResponse.task_id,
          metadata: {
            usage: {
              total_tokens: workflowResponse.data.total_tokens,
              prompt_tokens: 0,
              completion_tokens: workflowResponse.data.total_tokens
            }
          }
        };
      } catch (workflowError) {
        console.log('Workflow failed, trying chat-messages...', workflowError);
      }

      // ワークフローが失敗した場合、従来のchat-messagesを試す
      let endpoint = `${this.apiUrl}/chat-messages`;

      console.log('Making request to DIFY API:', {
        url: endpoint,
        hasApiKey: !!this.apiKey,
        apiKeyPrefix: this.apiKey.substring(0, 10) + '...',
        queryLength: query.length
      });

      let requestBody: any = {
        inputs: {},
        query,
        response_mode: 'blocking',
        user,
      };

      if (conversationId) {
        requestBody.conversation_id = conversationId;
      }

      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // chat-messagesで400エラーの場合、completion-messagesを試す
      if (!response.ok && response.status === 400) {
        console.log('chat-messages failed, trying completion-messages...');
        endpoint = `${this.apiUrl}/completion-messages`;

        requestBody = {
          inputs: {},
          query,
          response_mode: 'blocking',
          user,
        };

        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      }

      console.log('DIFY API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DIFY API error response:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(`DIFY API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('DIFY API success response:', data);
      return data;
    } catch (error) {
      console.error('DIFY API request failed:', error);
      throw error;
    }
  }

  async analyzeCompliance(
    documents: string,
    officialUrls: string[],
    productInfo?: any
  ): Promise<any> {
    try {
      // DIFY ワークフローの入力フィールドを準備（値がある場合のみ送信）
      const workflowInputs: Record<string, any> = {
        documents: documents // 必須フィールド
      };

      // 任意フィールド：値がある場合のみ追加
      if (officialUrls[0]?.trim()) workflowInputs.official_url1 = officialUrls[0];
      if (officialUrls[1]?.trim()) workflowInputs.official_url2 = officialUrls[1];
      if (officialUrls[2]?.trim()) workflowInputs.official_url3 = officialUrls[2];
      if (officialUrls[3]?.trim()) workflowInputs.official_url4 = officialUrls[3];
      if (officialUrls[4]?.trim()) workflowInputs.official_url5 = officialUrls[4];

      // reference_documents系はファイル型なので、現在は送信しない
      // 将来的にファイルアップロード機能を実装する際に追加可能

      console.log('Calling DIFY workflow with inputs:', Object.keys(workflowInputs));

      return await this.runWorkflow(workflowInputs);
    } catch (error) {
      console.error('DIFY API call failed in analyzeCompliance:', error);

      // DIFY APIが完全に失敗した場合のフォールバック
      throw new Error(`DIFY API unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const difyClient = new DifyClient();