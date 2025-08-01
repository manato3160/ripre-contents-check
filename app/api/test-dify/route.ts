import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing DIFY API connection...');

    // 環境変数の確認
    const apiUrl = process.env.DIFY_API_URL;
    const apiKey = process.env.DIFY_API_KEY;

    if (!apiUrl || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not set',
        details: {
          hasApiUrl: !!apiUrl,
          hasApiKey: !!apiKey
        }
      });
    }

    console.log('Environment variables found:', {
      apiUrl,
      apiKeyPrefix: apiKey.substring(0, 10) + '...'
    });

    // 複数のエンドポイントをテスト
    const endpoints = [
      '/workflows/run',
      '/chat-messages',
      '/completion-messages'
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);

        const testPayload = endpoint === '/workflows/run'
          ? {
            inputs: { query: 'テスト' },
            response_mode: 'blocking',
            user: 'test-user'
          }
          : {
            inputs: {},
            query: 'テスト',
            response_mode: 'blocking',
            user: 'test-user'
          };

        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayload),
        });

        const responseText = await response.text();

        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          response: responseText.substring(0, 500) // 最初の500文字のみ
        });

        console.log(`${endpoint} result:`, {
          status: response.status,
          success: response.ok,
          responsePreview: responseText.substring(0, 100)
        });

      } catch (error) {
        results.push({
          endpoint,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      environment: {
        apiUrl,
        apiKeyPrefix: apiKey.substring(0, 10) + '...'
      },
      testResults: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DIFY test error:', error);

    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}