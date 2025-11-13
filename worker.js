let cache = { data: null, timestamp: 0 };

export default {
  async fetch(request, env) {
    const ADS_API_TOKEN = env.ADS_TOKEN;
    const LIBRARY_ID = env.LIB_ID;
    const ADS_BASE_URL = "https://api.adsabs.harvard.edu/v1";
    const PAGE_SIZE = 200;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Return cached data if < 24h old
    if (cache.data && now - cache.timestamp < oneDay) {
      return new Response(JSON.stringify(cache.data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (!ADS_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: "ADS_API_TOKEN missing from environment." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch all bibcodes from ADS library (handles pagination)
    async function fetchAllBibcodes() {
      let all = [];
      let start = 0;
      let numDocs = 0;

      while (true) {
        const url = `${ADS_BASE_URL}/biblib/libraries/${LIBRARY_ID}?start=${start}&rows=${PAGE_SIZE}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${ADS_API_TOKEN}` },
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Library fetch failed: ${res.status} - ${txt}`);
        }

        const data = await res.json();
        const docs = data?.documents || [];
        numDocs = data?.metadata?.num_documents || docs.length;
        all.push(...docs);

        if (all.length >= numDocs || docs.length === 0) break;
        start += PAGE_SIZE;
      }

      return all;
    }

    // Fetch bibcodes
    const bibcodes = await fetchAllBibcodes();
    if (bibcodes.length === 0) {
      const result = { papers: 0, citations: 0, h_index: 0 };
      cache = { data: result, timestamp: now };
      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Fetch citation counts for each paper
    const citationCounts = [];
    for (const bibcode of bibcodes) {
      const res = await fetch(
        `${ADS_BASE_URL}/search/query?q=bibcode:${encodeURIComponent(
          bibcode
        )}&fl=citation_count`,
        {
          headers: {
            Authorization: `Bearer ${ADS_API_TOKEN}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) continue;
      const data = await res.json();
      const docs = data?.response?.docs || [];
      const citationCount =
        docs.length > 0 && typeof docs[0].citation_count === "number"
          ? docs[0].citation_count
          : 0;
      citationCounts.push(citationCount);
    }

    // Compute total citations and h-index
    const totalCitations = citationCounts.reduce((a, b) => a + b, 0);
    citationCounts.sort((a, b) => b - a);
    let hIndex = 0;
    for (let i = 0; i < citationCounts.length; i++) {
      if (citationCounts[i] >= i + 1) hIndex = i + 1;
      else break;
    }

    // Final result
    const result = {
      papers: bibcodes.length,
      citations: totalCitations,
      h_index: hIndex,
    };

    // Save to memory cache
    cache = { data: result, timestamp: now };

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
