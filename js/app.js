/**
 * Main Application - Multinetics Search
 * Orchestrates search, filters, and UI
 */

class MultinecticsApp {
    constructor() {
        // DOM Elements
        this.searchInput = document.getElementById('searchInput');
        this.resultsGrid = document.getElementById('resultsGrid');
        this.resultsCount = document.getElementById('resultsCount');
        this.loadingState = document.getElementById('loadingState');
        this.emptyState = document.getElementById('emptyState');
        this.noDataState = document.getElementById('noDataState');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modal = document.getElementById('modal');
        this.modalBody = document.getElementById('modalBody');
        this.modalClose = document.getElementById('modalClose');

        // State
        this.articles = [];
        this.currentResults = [];
        this.debounceTimer = null;

        // Modules
        this.searchEngine = new window.SearchEngine();
        this.filters = new window.Filters();

        // Initialize
        this.init();
    }

    async init() {
        this.showLoading(true);

        try {
            await this.loadData();
            this.setupSearch();
            this.setupFilters();
            this.setupModal();
            this.setupKeyboardShortcuts();
            this.render();
            this.updateStats();
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showNoData();
        }

        this.showLoading(false);
    }

    // Load articles data
    async loadData() {
        try {
            const response = await fetch('data/articles.json');
            const data = await response.json();

            this.articles = data.articles || [];

            if (this.articles.length === 0) {
                this.showNoData();
                return;
            }

            // Initialize modules with data
            this.searchEngine.init(this.articles);
            this.filters.init(this.articles);

            // Hide no data state
            if (this.noDataState) {
                this.noDataState.style.display = 'none';
            }

            console.log(`✅ Loaded ${this.articles.length} articles`);
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    // Setup search functionality
    setupSearch() {
        if (!this.searchInput) return;

        // Search on input
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 200);
        });

        // Focus animation
        const wrapper = this.searchInput.closest('.search-box__input-wrapper');
        if (wrapper && window.animations) {
            this.searchInput.addEventListener('focus', () => {
                window.animations.animateSearchFocus(wrapper, true);
            });

            this.searchInput.addEventListener('blur', () => {
                window.animations.animateSearchFocus(wrapper, false);
            });
        }
    }

    // Setup filter callbacks
    setupFilters() {
        this.filters.setOnFilterChange(() => {
            this.performSearch(this.searchInput?.value || '');
        });
    }

    // Setup modal
    setupModal() {
        // Close button
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => this.closeModal());
        }

        // Click outside to close
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.modalOverlay) {
                    this.closeModal();
                }
            });
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalOverlay?.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + K to focus search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.searchInput?.focus();
            }
        });
    }

    // Perform search
    performSearch(query) {
        if (this.articles.length === 0) return;

        // Search
        let results = this.searchEngine.search(query);

        // Apply filters
        results = this.filters.apply(results);

        this.currentResults = results;
        this.render();
    }

    // Render results
    render() {
        if (!this.resultsGrid) return;

        const results = this.currentResults.length > 0
            ? this.currentResults
            : this.articles.map(a => ({ item: a, matches: [] }));

        // Update count
        if (this.resultsCount) {
            this.resultsCount.textContent = results.length;
        }

        // Show empty state if no results
        if (results.length === 0 && this.articles.length > 0) {
            this.showEmpty(true);
            this.resultsGrid.innerHTML = '';
            return;
        }

        this.showEmpty(false);

        // Render cards
        this.resultsGrid.innerHTML = results.map(result => {
            const article = result.item;
            return this.renderCard(article, result.matches);
        }).join('');

        // Bind card events
        this.bindCardEvents();

        // Animate cards
        if (window.animations) {
            window.animations.animateCards(this.resultsGrid);
        }
    }

    // Render single card
    renderCard(article, matches = []) {
        const authorsText = article.authors?.join(', ') || 'Unknown';
        const keywordsHtml = (article.keywords || []).slice(0, 3)
            .map(k => `<span class="article-card__keyword">${this.escapeHtml(k)}</span>`)
            .join('');

        return `
      <article class="article-card" data-id="${article.id}">
        <div class="article-card__meta">
          ${article.year ? `<span class="article-card__year">${article.year}</span>` : ''}
          ${article.volume ? `<span class="article-card__volume">Vol. ${article.volume}${article.issue ? `, No. ${article.issue}` : ''}</span>` : ''}
        </div>
        
        <h3 class="article-card__title">${this.escapeHtml(article.title)}</h3>
        
        <p class="article-card__authors">${this.escapeHtml(authorsText)}</p>
        
        ${article.abstract ? `<p class="article-card__abstract">${this.escapeHtml(article.abstract)}</p>` : ''}
        
        ${keywordsHtml ? `<div class="article-card__keywords">${keywordsHtml}</div>` : ''}
        
        <div class="article-card__actions">
          <button class="article-card__btn article-card__btn--secondary" data-action="view" data-id="${article.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Details
          </button>
          ${article.pdfUrl ? `
            <a href="${article.pdfUrl}" target="_blank" rel="noopener" class="article-card__btn article-card__btn--primary" onclick="event.stopPropagation()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              PDF
            </a>
          ` : ''}
        </div>
      </article>
    `;
    }

    // Bind card click events
    bindCardEvents() {
        const cards = this.resultsGrid.querySelectorAll('.article-card');

        cards.forEach(card => {
            // View button click
            const viewBtn = card.querySelector('[data-action="view"]');
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = viewBtn.dataset.id;
                    this.openModal(id);
                });
            }

            // Card click (also opens modal)
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.openModal(id);
            });
        });
    }

    // Open modal with article details
    openModal(articleId) {
        const article = this.articles.find(a => a.id === articleId);
        if (!article || !this.modalBody) return;

        this.modalBody.innerHTML = this.renderModalContent(article);

        if (window.animations) {
            window.animations.openModal(this.modalOverlay, this.modal);
        } else {
            this.modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Close modal
    closeModal() {
        if (window.animations) {
            window.animations.closeModal(this.modalOverlay, this.modal);
        } else {
            this.modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Render modal content
    renderModalContent(article) {
        const authorsText = article.authors?.join(', ') || 'Unknown';
        const keywordsHtml = (article.keywords || [])
            .map(k => `<span class="modal__keyword">${this.escapeHtml(k)}</span>`)
            .join('');

        return `
      <h2 class="modal__title">${this.escapeHtml(article.title)}</h2>
      
      <div class="modal__meta">
        ${article.year ? `
          <div class="modal__meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${article.year}
          </div>
        ` : ''}
        ${article.volume ? `
          <div class="modal__meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            Vol. ${article.volume}${article.issue ? `, No. ${article.issue}` : ''}
          </div>
        ` : ''}
      </div>
      
      <div class="modal__section">
        <h4 class="modal__section-title">Authors</h4>
        <p class="modal__abstract">${this.escapeHtml(authorsText)}</p>
      </div>
      
      ${article.abstract ? `
        <div class="modal__section">
          <h4 class="modal__section-title">Abstract</h4>
          <p class="modal__abstract">${this.escapeHtml(article.abstract)}</p>
        </div>
      ` : ''}
      
      ${keywordsHtml ? `
        <div class="modal__section">
          <h4 class="modal__section-title">Keywords</h4>
          <div class="modal__keywords">${keywordsHtml}</div>
        </div>
      ` : ''}
      
      <div class="modal__actions">
        ${article.articleUrl ? `
          <a href="${article.articleUrl}" target="_blank" rel="noopener" class="modal__btn modal__btn--secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            View on Multinetics
          </a>
        ` : ''}
        ${article.pdfUrl ? `
          <a href="${article.pdfUrl}" target="_blank" rel="noopener" class="modal__btn modal__btn--primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download PDF
          </a>
        ` : ''}
      </div>
    `;
    }

    // Update stats display
    updateStats() {
        const years = [...new Set(this.articles.map(a => a.year).filter(Boolean))];
        const allKeywords = this.articles.flatMap(a => a.keywords || []);
        const uniqueKeywords = [...new Set(allKeywords.map(k => k.toLowerCase()))];

        const yearsCount = years.length > 0 ? Math.max(...years) - Math.min(...years) : 0;

        if (window.animations) {
            window.animations.updateStats(this.articles.length, yearsCount, uniqueKeywords.length);
        } else {
            const statArticles = document.getElementById('statArticles');
            const statYears = document.getElementById('statYears');
            const statTopics = document.getElementById('statTopics');

            if (statArticles) statArticles.textContent = this.articles.length;
            if (statYears) statYears.textContent = yearsCount + '+';
            if (statTopics) statTopics.textContent = uniqueKeywords.length;
        }
    }

    // Show/hide loading state
    showLoading(show) {
        if (this.loadingState) {
            this.loadingState.style.display = show ? 'flex' : 'none';
        }
        if (this.resultsGrid) {
            this.resultsGrid.style.display = show ? 'none' : 'grid';
        }
    }

    // Show/hide empty state
    showEmpty(show) {
        if (this.emptyState) {
            this.emptyState.style.display = show ? 'block' : 'none';
        }
    }

    // Show no data state
    showNoData() {
        if (this.noDataState) {
            this.noDataState.style.display = 'block';
        }
        if (this.loadingState) {
            this.loadingState.style.display = 'none';
        }
        if (this.resultsGrid) {
            this.resultsGrid.style.display = 'none';
        }
    }

    // Escape HTML helper
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Toast notification
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
      <span class="toast__icon toast__icon--${type}">
        ${type === 'success'
                ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
            }
      </span>
      <span>${message}</span>
    `;

        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MultinecticsApp();
});
