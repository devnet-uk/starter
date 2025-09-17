import path from "node:path";
import { withContentCollections } from "@content-collections/next";
import type { NextConfig } from "next";
import nextIntlPlugin from "next-intl/plugin";

const withNextIntl = nextIntlPlugin("./modules/i18n/request.ts");

const nextConfig: NextConfig = {
	// Explicitly set the monorepo root for Turbopack to silence workspace warnings
	turbopack: {
		root: path.resolve(__dirname, "..", ".."),
	},
	transpilePackages: ["@repo/api", "@repo/auth", "@repo/database"],
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		remotePatterns: [
			{
				// google profile images
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			{
				// github profile images
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
			},
		],
	},
	async redirects() {
		return [
			{
				source: "/app/settings",
				destination: "/app/settings/general",
				permanent: true,
			},
			{
				source: "/app/:organizationSlug/settings",
				destination: "/app/:organizationSlug/settings/general",
				permanent: true,
			},
			{
				source: "/app/admin",
				destination: "/app/admin/users",
				permanent: true,
			},
		];
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	webpack: (config, { webpack }) => {
		config.plugins.push(
			new webpack.IgnorePlugin({
				resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
			}),
		);

		if (process.env.DISABLE_GOOGLE_FONTS) {
			config.resolve = config.resolve || {};
			config.resolve.alias = {
				...(config.resolve.alias || {}),
				"@shared/lib/font": path.resolve(
					__dirname,
					"modules/shared/lib/font-stub.ts",
				),
			};
		}

		return config;
	},
};

const maybeWithContentCollections = process.env.DISABLE_CONTENT_COLLECTIONS
	? (cfg: NextConfig) => cfg
	: withContentCollections;

export default maybeWithContentCollections(withNextIntl(nextConfig));
