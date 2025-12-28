/**
 * Search Module - Multinetics Search
 * Fuzzy search implementation using Fuse.js
 */

class SearchEngine {
    constructor() {
        this.fuse = null;
        this.articles = [];
        this.options = {
            keys: [
                { name: 'title', weight: 0.4 },
                { name: 'abstract', weight: 0.25 },
                { name: 'keywords', weight: 0.2 },
                { name: 'authors', weight: 0.15 }
            ],
            threshold: 0.4, // 0 = exact match, 1 = match anything
            ignoreLocation: true,
            includeMatches: true,
            minMatchCharLength: 2,
            findAllMatches: true
        };
    }

    // Initialize with articles data
    init(articles) {
        this.articles = articles;

        if (window.Fuse) {
            this.fuse = new Fuse(this.articles, this.options);
        } else {
            console.warn('Fuse.js not loaded, falling back to basic search');
        }

        return this;
    }

    // Search articles - exact substring matching
    search(query) {
        if (!query || query.trim() === '') {
            return this.articles.map(article => ({ item: article, matches: [] }));
        }

        // Always use exact substring matching
        return this.basicSearch(query.trim());
    }

    // Basic search fallback (no Fuse.js)
    basicSearch(query) {
        const lowerQuery = query.toLowerCase();

        return this.articles
            .filter(article => {
                const titleMatch = article.title?.toLowerCase().includes(lowerQuery);
                const abstractMatch = article.abstract?.toLowerCase().includes(lowerQuery);
                const keywordsMatch = article.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
                const authorsMatch = article.authors?.some(a => a.toLowerCase().includes(lowerQuery));

                return titleMatch || abstractMatch || keywordsMatch || authorsMatch;
            })
            .map(article => ({ item: article, matches: [] }));
    }

    // Highlight matching text in results
    highlightMatches(text, matches) {
        if (!matches || matches.length === 0 || !text) {
            return this.escapeHtml(text || '');
        }

        // Find matches for this specific text
        const textMatches = matches.filter(m => m.value === text);

        if (textMatches.length === 0) {
            return this.escapeHtml(text);
        }

        // Get all indices to highlight
        let indices = [];
        textMatches.forEach(m => {
            if (m.indices) {
                indices = indices.concat(m.indices);
            }
        });

        // Sort and merge overlapping indices
        indices.sort((a, b) => a[0] - b[0]);

        if (indices.length === 0) {
            return this.escapeHtml(text);
        }

        // Build highlighted string
        let result = '';
        let lastEnd = 0;

        indices.forEach(([start, end]) => {
            if (start > lastEnd) {
                result += this.escapeHtml(text.slice(lastEnd, start));
            }
            result += `<mark class="highlight">${this.escapeHtml(text.slice(start, end + 1))}</mark>`;
            lastEnd = end + 1;
        });

        if (lastEnd < text.length) {
            result += this.escapeHtml(text.slice(lastEnd));
        }

        return result;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Get search suggestions (top keywords)
    getSuggestions() {
        const keywordCount = {};

        this.articles.forEach(article => {
            if (article.keywords) {
                article.keywords.forEach(keyword => {
                    const k = keyword.toLowerCase();
                    keywordCount[k] = (keywordCount[k] || 0) + 1;
                });
            }
        });

        return Object.entries(keywordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([keyword]) => keyword);
    }
}

// Export globally
window.SearchEngine = SearchEngine;
