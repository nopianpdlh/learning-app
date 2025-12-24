/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://tutornomor1.vercel.app",
  generateRobotsTxt: true,
  generateIndexSitemap: false,

  // Exclude authenticated routes
  exclude: [
    "/admin/*",
    "/student/*",
    "/tutor/*",
    "/api/*",
    "/auth/*",
    "/payment/*",
  ],

  // Static pages to include
  additionalPaths: async (config) => [
    await config.transform(config, "/"),
    await config.transform(config, "/login"),
    await config.transform(config, "/register"),
    await config.transform(config, "/programs"),
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/student", "/tutor", "/api", "/auth", "/payment"],
      },
    ],
  },
};
