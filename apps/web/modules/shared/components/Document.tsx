import { ClientProviders } from "@shared/components/ClientProviders";
import { ConsentProvider } from "@shared/components/ConsentProvider";
import { Inter } from "next/font/google";
import { cn } from "@ui/lib";
import { cookies } from "next/headers";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";

const sansFont = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
});

export async function Document({
	children,
	locale,
}: PropsWithChildren<{ locale: string }>) {
	const cookieStore = await cookies();
	const consentCookie = cookieStore.get("consent");

	return (
		<html lang={locale} suppressHydrationWarning className={sansFont.className}>
			<body
				className={cn(
					"min-h-screen bg-background text-foreground antialiased",
				)}
			>
				<NuqsAdapter>
					<ConsentProvider
						initialConsent={consentCookie?.value === "true"}
					>
						<ClientProviders>{children}</ClientProviders>
					</ConsentProvider>
				</NuqsAdapter>
			</body>
		</html>
	);
}