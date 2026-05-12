/**
 * @type {import('next-sitemap').IRobotPolicy[]}
 */
const rules = [];
const [blockBots, butAllowCrawlingHomePage] = [false, false];
const crawlDelay = 10; // seconds

if (blockBots) {
  rules.push({
    userAgent: '*',
    ...(butAllowCrawlingHomePage
      ? { allow: '/$' } // Allow crawling the home page
      : { disallow: '/' }), // Disallow crawling the entire site
    crawlDelay,
  });
} else {
  rules.push({
    userAgent: '*',
    allow: '/',
    disallow: '/admin/',
  });
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://example.com',
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  generateRobotsTxt: true,
  exclude: ['/admin/*'],
  // [DEV] Localization
  // alternateRefs: [
  //   {
  //     href: 'https://es.example.com',
  //     hreflang: 'es',
  //   },
  //   {
  //     href: 'https://fr.example.com',
  //     hreflang: 'fr',
  //   },
  // ],
  outDir: 'src/app/(assets)',
  robotsTxtOptions: {
    includeNonIndexSitemaps: false,
    additionalSitemaps: [],
    policies: rules,
  },
};
