/**
 * Filters Module - Multinetics Search
 * Year and volume filter management
 */

class Filters {
    constructor() {
        this.yearFilter = document.getElementById('filterYear');
        this.volumeFilter = document.getElementById('filterVolume');
        this.activeFilters = {
            year: null,
            volume: null
        };
        this.onFilterChange = null;
    }

    // Initialize filters with article data
    init(articles) {
        this.populateYearFilter(articles);
        this.populateVolumeFilter(articles);
        this.bindEvents();

        return this;
    }

    // Set callback for filter changes
    setOnFilterChange(callback) {
        this.onFilterChange = callback;
        return this;
    }

    // Populate year filter dropdown
    populateYearFilter(articles) {
        if (!this.yearFilter) return;

        const years = [...new Set(articles.map(a => a.year).filter(Boolean))].sort((a, b) => b - a);

        // Clear existing options (except first)
        this.yearFilter.innerHTML = '<option value="">All Years</option>';

        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            this.yearFilter.appendChild(option);
        });
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

    // Bind filter events
    bindEvents() {
        if (this.yearFilter) {
            this.yearFilter.addEventListener('change', (e) => {
                this.activeFilters.year = e.target.value ? parseInt(e.target.value) : null;
                this.triggerChange();
            });
        }

        if (this.volumeFilter) {
            this.volumeFilter.addEventListener('change', (e) => {
                this.activeFilters.volume = e.target.value ? parseInt(e.target.value) : null;
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

            // Year filter
            if (this.activeFilters.year && article.year !== this.activeFilters.year) {
                return false;
            }

            // Volume filter
            if (this.activeFilters.volume && article.volume !== this.activeFilters.volume) {
                return false;
            }

            return true;
        });
    }

    // Reset all filters
    reset() {
        this.activeFilters = {
            year: null,
            volume: null
        };

        if (this.yearFilter) this.yearFilter.value = '';
        if (this.volumeFilter) this.volumeFilter.value = '';

        this.triggerChange();
    }

    // Check if any filter is active
    hasActiveFilters() {
        return this.activeFilters.year !== null || this.activeFilters.volume !== null;
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
