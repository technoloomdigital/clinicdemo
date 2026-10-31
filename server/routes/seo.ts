import { Router } from 'express';
import { config } from '../config';

export const seoRouter = Router();

// This app is a private, logged-in clinic dashboard, not a public marketing site,
// so the correct sitemap entry is just the login page, and it's better disallowed
// from indexing entirely. Kept dynamic (not a static file) so it reflects the real
// deployed domain from APP_URL instead of a hard-coded placeholder.
seoRouter.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /\n');
});

seoRouter.get('/sitemap.xml', (_req, res) => {
  const url = config.appUrl ?? `${_req.protocol}://${_req.get('host')}`;
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url><loc>${url}/</loc></url>\n` +
      `</urlset>\n`,
  );
});
