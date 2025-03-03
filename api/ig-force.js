export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const userAgent = req.headers.get('user-agent') || '';
  
  // Check if the request is coming from Instagram
  if (userAgent.includes('Instagram')) {
    // Create a dummy PDF for demonstration
    // In production, you would fetch an actual file
    const dummyPdf = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10]); // %PDF-1.4 header
    
    // Return file download response
    
    return new Response(dummyPdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename=blablabla.pdf',
        'Content-Transfer-Encoding': 'binary',
        'Accept-Ranges': 'bytes',
      },
    });
  } else {
    // Redirect for non-Instagram browsers
    return Response.redirect('https://eventos.trasla.com.ar', { status: 302 });
  }
}