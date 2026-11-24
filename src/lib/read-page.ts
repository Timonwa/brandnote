const MAX_TEXT_LENGTH = 12_000;
const MAX_LINKS = 30;

export type PageContent = {
  url: string;
  title: string;
  description: string;
  text: string;
  links: string[];
};

// acme.com and www.acme.com are the same site; anything else is off limits.
function siteOf(url: URL): string {
  return url.hostname.replace(/^www\./, "");
}

export function isSameSite(a: string | URL, b: string | URL): boolean {
  return siteOf(new URL(a)) === siteOf(new URL(b));
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'");
}

function extractText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<\/(p|div|li|h[1-6]|section|article|br|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

function extractLinks(html: string, pageUrl: URL): string[] {
  const links = new Set<string>();
  for (const match of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)) {
    try {
      const link = new URL(match[1], pageUrl);
      const isPage = !/\.(png|jpe?g|gif|svg|webp|pdf|zip|css|js|xml)$/i.test(link.pathname);
      if (link.protocol.startsWith("http") && isSameSite(link, pageUrl) && isPage) {
        link.search = "";
        links.add(link.toString());
      }
    } catch {
      // Not a valid URL; skip it.
    }
    if (links.size >= MAX_LINKS) break;
  }
  return [...links];
}

export async function readPage(url: string): Promise<PageContent> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "BrandnoteBot/1.0 (demo onboarding agent)",
      accept: "text/html",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  const finalUrl = new URL(response.url || url);
  const html = await response.text();
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? "";

  return {
    url: finalUrl.toString(),
    title: decodeEntities(title).trim(),
    description: decodeEntities(description).trim(),
    text: extractText(html),
    links: extractLinks(html, finalUrl),
  };
}
