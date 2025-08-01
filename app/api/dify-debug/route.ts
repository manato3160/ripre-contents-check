import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testInput = "テスト用の広告文です。" } = body;

    console.log('DIFY Debug API called with input:', testInput);

    // 環境変数の確認
    const apiUrl = process.env.DIFY_API_URL;
    const apiKey = process.env.DIFY_API_KEY;

    if (!apiUrl || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured',
        details: {
          hasApiUrl: !!apiUrl,
          hasApiKey: !!apiKey
        }
      });
    }

    // DIFY ワークフローの詳細テスト
    console.log('Testing DIFY Workflow with detailed debugging...');

    const response = await fetch(`${apiUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          documents: testInput
        },
        response_mode: 'blocking',
        user: 'debug-user'
      }),
    });

    const responseText = await response.text();
    console.log('DIFY Response Status:', response.status);
    console.log('DIFY Response Text:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { raw_response: responseText };
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'DIFY API Error',
        details: {
          status: response.status,
          statusText: response.statusText,
          response: responseData,
          apiUrl,
          apiKeyPrefix: apiKey.substring(0, 10) + '...'
        }
      });
    }

    // 成功した場合の詳細情報
    return NextResponse.json({
      success: true,
      message: 'DIFY API connection successful',
      details: {
        status: response.status,
        response: responseData,
        workflow_run_id: responseData.workflow_run_id,
        task_id: responseData.task_id,
        outputs: responseData.data?.outputs,
        apiUrl,
        apiKeyPrefix: apiKey.substring(0, 10) + '...'
      }
    });

  } catch (error) {
    console.error('DIFY Debug error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Debug test failed',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
  }
}