import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

const TENOR_API_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY;
const TENOR_BASE = 'https://tenor.googleapis.com/v2';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const limit = searchParams.get('limit') || '20';

  if (!TENOR_API_KEY) {
    return NextResponse.json({ error: 'Tenor API key not configured' }, { status: 500 });
  }

  try {
    let url: string;
    if (query) {
      url = `${TENOR_BASE}/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=${limit}&media_filter=gif,tinygif`;
    } else {
      url = `${TENOR_BASE}/featured?key=${TENOR_API_KEY}&limit=${limit}&media_filter=gif,tinygif`;
    }

    const response = await fetch(url);
    const data = await response.json();

    const gifs = (data.results || []).map((result: Record<string, unknown>) => {
      const media = result.media_formats as Record<string, { url: string; dims: number[] }> | undefined;
      return {
        id: result.id,
        title: result.title || '',
        url: media?.gif?.url || '',
        preview: media?.tinygif?.url || media?.gif?.url || '',
        width: media?.gif?.dims?.[0] || 200,
        height: media?.gif?.dims?.[1] || 200
      };
    });

    return NextResponse.json({ gifs });
  } catch (error) {
    console.error('Tenor API error:', error);
    return NextResponse.json({ error: 'Failed to fetch GIFs' }, { status: 500 });
  }
}
