// Production Render service URL generated for this deployment
export const RENDER_DEPLOYED_URL = 'https://algoarena-mk6v.onrender.com';

function getValidBackendUrl(): string {
  const envUrl = (import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/$/, '');

  // If explicitly configured with a non-placeholder URL
  if (
    envUrl &&
    !envUrl.includes('your-render-service') &&
    !envUrl.includes('example.com') &&
    !envUrl.includes('placeholder') &&
    !envUrl.includes('my-app')
  ) {
    return envUrl;
  }

  // When running inside local container or AI Studio Cloud Run preview, use relative URL
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.includes('run.app') ||
      host.includes('googleusercontent.com')
    ) {
      return '';
    }
  }

  // Fallback to the live Render backend service when deployed on external static hosting
  return RENDER_DEPLOYED_URL;
}

export const backendUrl = getValidBackendUrl();

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!backendUrl) {
    return cleanPath;
  }
  return `${backendUrl}${cleanPath}`;
}

