/**
 * Multinetics Journal Scraper
 * 
 * HOW TO USE:
 * 1. Go to https://jurnal.pnj.ac.id/index.php/multinetics/issue/archive
 * 2. Open browser DevTools (F12 or Cmd+Shift+I)
 * 3. Go to Console tab
 * 4. Paste this entire script and press Enter
 * 5. Wait for the scraping to complete (may take a few minutes)
 * 6. The JSON will be copied to your clipboard and downloaded as a file
 */

(async function scrapeMultinetics() {
    console.log("🚀 Starting Multinetics Scraper...");

    const articles = [];
    const baseUrl = "https://jurnal.pnj.ac.id/index.php/multinetics";

    // Helper: delay to avoid overwhelming the server
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper: fetch and parse HTML
    async function fetchPage(url) {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(html, "text/html");
    }

    // Step 1: Get all issue links from archive
    console.log("📂 Fetching archive page...");
    const archiveDoc = await fetchPage(`${baseUrl}/issue/archive`);
    const issueLinks = [...archiveDoc.querySelectorAll('.obj_issue_summary .title a, .issue-summary .title a, a[href*="/issue/view/"]')]
        .map(a => a.href)
        .filter((v, i, a) => a.indexOf(v) === i); // unique

    console.log(`📚 Found ${issueLinks.length} issues`);

    // Step 2: For each issue, get article links
    for (let i = 0; i < issueLinks.length; i++) {
        const issueUrl = issueLinks[i];
        console.log(`\n📖 Processing issue ${i + 1}/${issueLinks.length}: ${issueUrl}`);

        await delay(500); // Be nice to server
        const issueDoc = await fetchPage(issueUrl);

        // Extract issue metadata
        const issueTitleEl = issueDoc.querySelector('.page_title, .issue_title, h1, h2');
        const issueTitle = issueTitleEl ? issueTitleEl.textContent.trim() : '';

        // Parse volume/issue from title like "Vol. 9 No. 1 (2023)"
        const volMatch = issueTitle.match(/Vol\.?\s*(\d+)/i);
        const numMatch = issueTitle.match(/No\.?\s*(\d+)/i);
        const yearMatch = issueTitle.match(/\((\d{4})\)/);

        const volume = volMatch ? parseInt(volMatch[1]) : null;
        const issueNum = numMatch ? parseInt(numMatch[1]) : null;
        const year = yearMatch ? parseInt(yearMatch[1]) : null;

        // Get article links from this issue
        const articleLinks = [...issueDoc.querySelectorAll('.obj_article_summary .title a, .article-summary .title a, a[href*="/article/view/"]')]
            .map(a => a.href)
            .filter((v, i, a) => a.indexOf(v) === i);

        console.log(`   Found ${articleLinks.length} articles`);

        // Step 3: For each article, get full metadata
        for (let j = 0; j < articleLinks.length; j++) {
            const articleUrl = articleLinks[j];
            console.log(`   📄 Article ${j + 1}/${articleLinks.length}`);

            await delay(300);
            try {
                const articleDoc = await fetchPage(articleUrl);

                // Extract article ID from URL
                const idMatch = articleUrl.match(/\/view\/(\d+)/);
                const articleId = idMatch ? idMatch[1] : `article_${articles.length + 1}`;

                // Title
                const titleEl = articleDoc.querySelector('.page_title, .article-title, h1.page-header');
                const title = titleEl ? titleEl.textContent.trim() : 'Unknown Title';

                // Authors
                const authorEls = articleDoc.querySelectorAll('.authors .name, .author .name, meta[name="citation_author"]');
                const authors = authorEls.length > 0
                    ? [...authorEls].map(el => el.content || el.textContent.trim())
                    : [];

                // Abstract
                const abstractEl = articleDoc.querySelector('.abstract .value, .article-abstract, meta[name="DC.Description"]');
                const abstract = abstractEl
                    ? (abstractEl.content || abstractEl.textContent.trim())
                    : '';

                // Keywords
                const keywordMeta = articleDoc.querySelector('meta[name="citation_keywords"]');
                const keywordSection = articleDoc.querySelector('.keywords .value');
                let keywords = [];
                if (keywordMeta && keywordMeta.content) {
                    keywords = keywordMeta.content.split(/[,;]/).map(k => k.trim()).filter(k => k);
                } else if (keywordSection) {
                    keywords = keywordSection.textContent.split(/[,;]/).map(k => k.trim()).filter(k => k);
                }

                // PDF URL
                const pdfLink = articleDoc.querySelector('a.obj_galley_link[href*=".pdf"], a[href*="download"], a.pdf, a[href*="/galley/"]');
                const pdfMeta = articleDoc.querySelector('meta[name="citation_pdf_url"]');
                const pdfUrl = pdfMeta?.content || pdfLink?.href || null;

                // DOI
                const doiMeta = articleDoc.querySelector('meta[name="DC.Identifier.DOI"], meta[name="citation_doi"]');
                const doi = doiMeta?.content || null;

                articles.push({
                    id: articleId,
                    title,
                    authors,
                    abstract,
                    keywords,
                    year,
                    volume,
                    issue: issueNum,
                    articleUrl,
                    pdfUrl,
                    doi
                });

                console.log(`      ✅ "${title.substring(0, 50)}..."`);

            } catch (err) {
                console.error(`      ❌ Error scraping article: ${err.message}`);
            }
        }
    }

    // Output results
    console.log("\n\n✨ Scraping complete!");
    console.log(`📊 Total articles scraped: ${articles.length}`);

    const output = JSON.stringify({
        scraped_at: new Date().toISOString(),
        total: articles.length,
        articles
    }, null, 2);

    // Copy to clipboard
    try {
        await navigator.clipboard.writeText(output);
        console.log("📋 JSON copied to clipboard!");
    } catch (e) {
        console.log("⚠️ Could not copy to clipboard. See output below.");
    }

    // Download as file
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'multinetics_articles.json';
    a.click();
    URL.revokeObjectURL(url);
    console.log("💾 JSON file downloaded!");

    // Also log to console
    console.log("\n📄 JSON Output:");
    console.log(output);

    return articles;
})();
