/**
 * Filters Module - Multinetics Search
 * Volume and issue filter management
 */

class Filters {
    constructor() {
        this.volumeFilter = document.getElementById('filterVolume');
        this.issueFilter = document.getElementById('filterIssue');
        this.activeFilters = {
            volume: null,
            issue: null
        };
        this.onFilterChange = null;
    }

    // Initialize filters with article data
    init(articles) {
        this.populateVolumeFilter(articles);
        this.populateIssueFilter(articles);
        this.bindEvents();

        return this;
    }

    // Set callback for filter changes
    setOnFilterChange(callback) {
        this.onFilterChange = callback;
        return this;
    }

    // Populate volume filter dropdown
    populateVolumeFilter(articles) {
        if (!this.volumeFilter) return;

        const volumes = [...new Set(articles.map(a => a.volume).filter(Boolean))].sort((a, b) => b - a);

        // Clear existing options (except first)
        this.volumeFilter.innerHTML = '<option value="">All Volumes</option>';

        volumes.forEach(vol => {
            const option = document.createElement('option');
            option.value = vol;
            option.textContent = `Vol. ${vol}`;
            this.volumeFilter.appendChild(option);
        });
    }

    // Populate issue filter dropdown
    populateIssueFilter(articles) {
        if (!this.issueFilter) return;

        const issues = [...new Set(articles.map(a => a.issue).filter(Boolean))].sort((a, b) => a - b);

        // Clear existing options (except first)
        this.issueFilter.innerHTML = '<option value="">All Issues</option>';

        issues.forEach(issue => {
            const option = document.createElement('option');
            option.value = issue;
            option.textContent = `Issue ${issue}`;
            this.issueFilter.appendChild(option);
        });
    }

    // Bind filter events
    bindEvents() {
        if (this.volumeFilter) {
            this.volumeFilter.addEventListener('change', (e) => {
                this.activeFilters.volume = e.target.value ? parseInt(e.target.value) : null;
                this.triggerChange();
            });
        }

        if (this.issueFilter) {
            this.issueFilter.addEventListener('change', (e) => {
                this.activeFilters.issue = e.target.value ? parseInt(e.target.value) : null;
                this.triggerChange();
            });
        }
    }

    // Trigger filter change callback
    triggerChange() {
        if (this.onFilterChange) {
            this.onFilterChange(this.activeFilters);
        }
    }

    // Apply filters to search results
    apply(results) {
        return results.filter(result => {
            const article = result.item || result;

            // Volume filter
            if (this.activeFilters.volume && article.volume !== this.activeFilters.volume) {
                return false;
            }

            // Issue filter
            if (this.activeFilters.issue && article.issue !== this.activeFilters.issue) {
                return false;
            }

            return true;
        });
    }

    // Reset all filters
    reset() {
        this.activeFilters = {
            volume: null,
            issue: null
        };

        if (this.volumeFilter) this.volumeFilter.value = '';
        if (this.issueFilter) this.issueFilter.value = '';

        this.triggerChange();
    }

    // Check if any filter is active
    hasActiveFilters() {
        return this.activeFilters.volume !== null || this.activeFilters.issue !== null;
    }

    // Get unique topic keywords for potential topic filter
    getTopicKeywords(articles) {
        const keywordCount = {};

        articles.forEach(article => {
            if (article.keywords) {
                article.keywords.forEach(keyword => {
                    const k = keyword.toLowerCase().trim();
                    if (k.length > 2) {
                        keywordCount[k] = (keywordCount[k] || 0) + 1;
                    }
                });
            }
        });

        return Object.entries(keywordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
    }
}

// Export globally
window.Filters = Filters;
