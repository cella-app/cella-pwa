import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ENV } from '@/shared/config/env';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const cookieStore = cookies();
    const authToken = (await cookieStore).get('authToken')?.value || (await cookieStore).get('directus_session_token')?.value;

    if (!authToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get file info from Directus to get filename_disk
    const fileResponse = await fetch(`${ENV.API_URL}/files/${params.fileId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Cookie': `directus_session_token=${authToken}`,
      },
    });

    if (!fileResponse.ok) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileData = await fileResponse.json();
    const filename_disk = fileData.data.filename_disk;

    // Fetch the actual image file
    const imageResponse = await fetch(`${ENV.API_URL}/assets/${filename_disk}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Cookie': `directus_session_token=${authToken}`,
      },
    });

    if (!imageResponse.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Avatar proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}