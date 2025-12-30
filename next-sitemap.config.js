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
    "/executive/*",
    "/api/*",
    "/auth/*",
    "/payment/*",
    "/complete-profile",
    "/dashboard",
    "/notifications",
  ],

  // Static pages with priority
  additionalPaths: async (config) => [
    { loc: "/", priority: 1.0, changefreq: "daily" },
    { loc: "/programs", priority: 0.9, changefreq: "daily" },
    { loc: "/login", priority: 0.7, changefreq: "monthly" },
    { loc: "/register", priority: 0.8, changefreq: "monthly" },
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/student",
          "/tutor",
          "/executive",
          "/api",
          "/auth",
          "/payment",
          "/complete-profile",
          "/dashboard",
        ],
      },
    ],
  },
};
