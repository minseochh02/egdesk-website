import { NextRequest, NextResponse } from 'next/server';

const LAW_BASE = 'https://www.law.go.kr/DRF';
const OC_KEY = process.env.LAW_OC_KEY ?? 'EGDESK';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const endpoint = searchParams.get('endpoint');
    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint param required' }, { status: 400 });
    }

    const url = new URL(`${LAW_BASE}/${endpoint}`);

    // Forward all params except 'endpoint', inject OC key and type
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') url.searchParams.set(key, value);
    });
    url.searchParams.set('OC', OC_KEY);
    url.searchParams.set('type', 'JSON');

    const resp = await fetch(url.toString(), {
      signal: AbortSignal.timeout(30_000),
      headers: {
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://egdesk.cloud',
        Origin: 'https://egdesk.cloud',
      },
    });

    const text = await resp.text();

    if (!resp.ok) {
      return NextResponse.json({ error: `law.go.kr HTTP ${resp.status}` }, { status: 502 });
    }

    if (text.trimStart().startsWith('<html') || text.trimStart().startsWith('<!')) {
      return NextResponse.json(
        { error: '법제처 API가 오류 페이지를 반환했습니다.' },
        { status: 502 }
      );
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return new NextResponse(text, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e), cause: String(e?.cause ?? '') }, { status: 500 });
  }
}
