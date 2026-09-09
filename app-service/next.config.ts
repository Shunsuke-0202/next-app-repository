import type { NextConfig } from "next";

const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "next-app-repository";

const nextConfig: NextConfig = {
  output: isGitHubPagesBuild ? "export" : "standalone",
  basePath: isGitHubPagesBuild ? `/${repositoryName}` : "",
  images: {
    unoptimized: isGitHubPagesBuild,
  },
};

export default nextConfig;
