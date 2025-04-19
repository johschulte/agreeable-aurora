// Utility zum Abrufen von Webseiten-Metadaten
export async function fetchWebsiteMetadata(url) {
  try {
    // Prüfen, ob die URL-Syntax gültig ist
    new URL(url);

    // Website-Inhalt abrufen (mit einem längeren Timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 Sekunden Timeout

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TheUrlList/1.0; +https://urlist.com)",
        Accept: "text/html",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Fetched HTML for ${url}, length: ${html.length} characters`);

    // Einfaches Parsen der Meta-Tags mit erweiterten Regex-Mustern
    let description = extractMetaTag(html, "description") || "";
    let image = extractMetaTag(html, "image") || "";

    // Sammle alle möglichen OpenGraph-Tags
    let ogImage = extractOpenGraphTag(html, "image") || "";
    let ogTitle = extractOpenGraphTag(html, "title") || "";
    let ogDescription = extractOpenGraphTag(html, "description") || "";

    // Twitter Card Metadaten als Fallback
    let twitterImage = extractTwitterTag(html, "image") || "";
    let twitterTitle = extractTwitterTag(html, "title") || "";
    let twitterDescription = extractTwitterTag(html, "description") || "";

    // Fallback-Hierarchie
    const title = ogTitle || twitterTitle || extractTitle(html) || "";
    description = description || ogDescription || twitterDescription || "";
    image = image || ogImage || twitterImage || extractImageSrc(html) || "";

    console.log("Extracted metadata:", { title, description, image });

    return {
      title,
      description,
      image,
    };
  } catch (error) {
    console.error("Error fetching website metadata:", error);
    return {
      title: "",
      description: "",
      image: null,
    };
  }
}

// Hilfsfunktionen zum Extrahieren von Meta-Tags
function extractMetaTag(html, name) {
  // Erweiterte Regex, die auch Variationen in den Meta-Tags erkennt
  const patterns = [
    new RegExp(
      `<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta\\s+content=["']([^"']*)["']\\s+name=["']${name}["']`,
      "i"
    ),
  ];

  for (const regex of patterns) {
    const match = html.match(regex);
    if (match) return match[1];
  }

  return null;
}

function extractOpenGraphTag(html, property) {
  // Erweiterte Regex, die auch Variationen in den OpenGraph-Tags erkennt
  const patterns = [
    new RegExp(
      `<meta\\s+property=["']og:${property}["']\\s+content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta\\s+content=["']([^"']*)["']\\s+property=["']og:${property}["']`,
      "i"
    ),
  ];

  for (const regex of patterns) {
    const match = html.match(regex);
    if (match) return match[1];
  }

  return null;
}

function extractTwitterTag(html, property) {
  // Regex für Twitter Card Meta-Tags
  const patterns = [
    new RegExp(
      `<meta\\s+name=["']twitter:${property}["']\\s+content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta\\s+content=["']([^"']*)["']\\s+name=["']twitter:${property}["']`,
      "i"
    ),
  ];

  for (const regex of patterns) {
    const match = html.match(regex);
    if (match) return match[1];
  }

  return null;
}

function extractTitle(html) {
  const regex = /<title[^>]*>([^<]+)<\/title>/i;
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractImageSrc(html) {
  // Versuche, ein dominantes Bild auf der Seite zu finden
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = html.match(imgRegex);
  return match ? match[1] : null;
}
