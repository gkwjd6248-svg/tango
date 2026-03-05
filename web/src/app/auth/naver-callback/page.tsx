'use client';

import { useEffect } from 'react';

export default function NaverCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken && window.opener) {
      window.opener.postMessage(
        { naverToken: accessToken },
        window.location.origin,
      );
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-warm-500">Processing login...</p>
    </div>
  );
}
