import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

// GIPHY API - use the public beta key or set your own
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65';
const GIPHY_BASE = 'https://api.giphy.com/v1/gifs';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const limit = searchParams.get('limit') || '20';

  try {
    let url: string;
    if (query) {
      url = `${GIPHY_BASE}/search?q=${encodeURIComponent(query)}&api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`;
    } else {
      url = `${GIPHY_BASE}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`;
    }

    const response = await fetch(url);
    const data = await response.json();

    const gifs = (data.data || []).map((result: Record<string, unknown>) => {
      const images = result.images as Record<string, { url: string; width: string; height: string }> | undefined;
      return {
        id: result.id,
        title: (result.title as string) || '',
        url: images?.original?.url || images?.fixed_height?.url || '',
        preview: images?.fixed_height_small?.url || images?.fixed_height?.url || '',
        width: parseInt(images?.original?.width || '200', 10),
        height: parseInt(images?.original?.height || '200', 10)
      };
    });

    return NextResponse.json({ gifs });
  } catch (error) {
    console.error('GIPHY API error:', error);
    return NextResponse.json({ error: 'Failed to fetch GIFs' }, { status: 500 });
  }
}
