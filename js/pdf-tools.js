/**
 * PDF Tools - Page Selector & Checklist
 * Multinetics Helper
 */

// PDF.js Configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// State
let pdfDoc = null;
let selectedPages = new Set();
let checklistState = {};

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const pdfInput = document.getElementById('pdfInput');
const pdfPreview = document.getElementById('pdfPreview');
const pdfFilename = document.getElementById('pdfFilename');
const pdfPageCount = document.getElementById('pdfPageCount');
const pageGrid = document.getElementById('pageGrid');
const selectedCount = document.getElementById('selectedCount');
const totalCount = document.getElementById('totalCount');
const pageWarning = document.getElementById('pageWarning');
const pageWarningText = document.getElementById('pageWarningText');
const exportBtn = document.getElementById('exportBtn');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const changePdfBtn = document.getElementById('changePdfBtn');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const resetChecklistBtn = document.getElementById('resetChecklistBtn');
const toastContainer = document.getElementById('toastContainer');
const burgerMenu = document.getElementById('burgerMenu');
const mobileNav = document.getElementById('mobileNav');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initUploadZone();
    initChecklist();
    initMobileNav();
    initAnimations();
    loadChecklistFromStorage();
});

// ===== MOBILE NAV =====
function initMobileNav() {
    if (burgerMenu && mobileNav) {
        burgerMenu.addEventListener('click', () => {
            burgerMenu.classList.toggle('active');
            mobileNav.classList.toggle('active');
        });

        // Close on link click
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                burgerMenu.classList.remove('active');
                mobileNav.classList.remove('active');
            });
        });
    }
}

// ===== ANIMATIONS =====
function initAnimations() {
    // GSAP animations for hero
    gsap.from('.pdf-hero__eyebrow', {
        duration: 0.8,
        y: 30,
        opacity: 0,
        ease: 'power3.out'
    });

    gsap.from('.pdf-hero__title', {
        duration: 0.8,
        y: 30,
        opacity: 0,
        delay: 0.2,
        ease: 'power3.out'
    });

    gsap.from('.pdf-hero__subtitle', {
        duration: 0.8,
        y: 30,
        opacity: 0,
        delay: 0.4,
        ease: 'power3.out'
    });

    gsap.from('.pdf-section', {
        duration: 0.8,
        y: 50,
        opacity: 0,
        delay: 0.6,
        stagger: 0.2,
        ease: 'power3.out'
    });
}

// ===== UPLOAD ZONE =====
function initUploadZone() {
    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragging');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragging');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragging');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            handlePDFFile(files[0]);
        } else {
            showToast('Invalid file', 'Please upload a PDF file.', 'error');
        }
    });

    // File input
    pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handlePDFFile(file);
        }
    });

    // Control buttons
    selectAllBtn.addEventListener('click', selectAllPages);
    deselectAllBtn.addEventListener('click', deselectAllPages);
    changePdfBtn.addEventListener('click', resetPDFUpload);
    exportBtn.addEventListener('click', exportSelectedPages);
}


// ===== PDF HANDLING =====
async function handlePDFFile(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        pdfFilename.textContent = file.name;
        pdfPageCount.textContent = `${pdfDoc.numPages} pages`;
        totalCount.textContent = pdfDoc.numPages;

        selectedPages.clear();
        await renderPageThumbnails();

        uploadZone.style.display = 'none';
        pdfPreview.style.display = 'block';

        updatePageCounter();

        showToast('PDF Loaded', `Successfully loaded ${file.name}`, 'success');
    } catch (error) {
        console.error('Error loading PDF:', error);
        showToast('Error', 'Failed to load PDF file. Please try again.', 'error');
    }
}

async function renderPageThumbnails() {
    pageGrid.innerHTML = '';

    // First, create all page cards in order
    const pageCards = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const pageCard = document.createElement('div');
        pageCard.className = 'page-card';
        pageCard.dataset.page = i;

        pageCard.innerHTML = `
            <canvas class="page-card__canvas"></canvas>
            <div class="page-card__overlay">
                <div class="page-card__check">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
            </div>
            <span class="page-card__number">${i}</span>
        `;

        pageCard.addEventListener('click', () => togglePage(i, pageCard));
        pageGrid.appendChild(pageCard);
        pageCards.push({ pageNum: i, canvas: pageCard.querySelector('canvas') });
    }

    // Then render all thumbnails (order is preserved since DOM is already built)
    for (const { pageNum, canvas } of pageCards) {
        await renderThumbnail(pageNum, canvas);
    }
}

async function renderThumbnail(pageNum, canvas) {
    const page = await pdfDoc.getPage(pageNum);
    // Use high scale for readable thumbnails
    const scale = 0.8;
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
}

function togglePage(pageNum, pageCard) {
    if (selectedPages.has(pageNum)) {
        selectedPages.delete(pageNum);
        pageCard.classList.remove('selected');
    } else {
        selectedPages.add(pageNum);
        pageCard.classList.add('selected');
    }
    updatePageCounter();
}

function selectAllPages() {
    selectedPages.clear();
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        selectedPages.add(i);
    }
    document.querySelectorAll('.page-card').forEach(card => {
        card.classList.add('selected');
    });
    updatePageCounter();
}

function deselectAllPages() {
    selectedPages.clear();
    document.querySelectorAll('.page-card').forEach(card => {
        card.classList.remove('selected');
    });
    updatePageCounter();
}

function updatePageCounter() {
    const count = selectedPages.size;
    selectedCount.textContent = count;
    exportBtn.disabled = count === 0;

    // Page warning (20 page limit for proposal)
    if (count > 20) {
        pageWarning.style.display = 'flex';
        pageWarningText.textContent = `${count} pages selected (limit is 20, tapi sedikit lebih tidak masalah)`;
    } else {
        pageWarning.style.display = 'none';
    }
}

function resetPDFUpload() {
    pdfDoc = null;
    selectedPages.clear();
    pageGrid.innerHTML = '';
    pdfInput.value = '';
    uploadZone.style.display = 'block';
    pdfPreview.style.display = 'none';
}

async function exportSelectedPages() {
    if (selectedPages.size === 0 || !pdfDoc) return;

    try {
        exportBtn.disabled = true;
        exportBtn.innerHTML = `
            <svg class="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Exporting...
        `;

        // Get the original PDF data
        const pdfInputFile = pdfInput.files[0];
        const arrayBuffer = await pdfInputFile.arrayBuffer();

        // Load with pdf-lib
        const pdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const newPdf = await PDFLib.PDFDocument.create();

        // Sort selected pages
        const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);

        // Copy pages
        const copiedPages = await newPdf.copyPages(pdfLibDoc, sortedPages.map(p => p - 1));
        copiedPages.forEach(page => newPdf.addPage(page));

        // Generate and download
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `extracted_pages_${Date.now()}.pdf`;
        link.click();

        URL.revokeObjectURL(url);

        showToast('Success!', `Exported ${selectedPages.size} pages successfully.`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Error', 'Failed to export PDF. Please try again.', 'error');
    } finally {
        exportBtn.disabled = false;
        exportBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Selected Pages
        `;
        updatePageCounter();
    }
}

// ===== CHECKLIST =====
function initChecklist() {
    // Toggle group collapse
    document.querySelectorAll('.checklist-group__header').forEach(header => {
        header.addEventListener('click', () => {
            const group = header.closest('.checklist-group');
            group.classList.toggle('collapsed');

            const toggle = header.querySelector('.checklist-group__toggle');
            toggle.setAttribute('aria-expanded', !group.classList.contains('collapsed'));
        });
    });

    // Checkbox changes
    document.querySelectorAll('.checklist-item__checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateChecklistProgress();
            saveChecklistToStorage();
        });
    });

    // Reset button
    resetChecklistBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the checklist?')) {
            resetChecklist();
        }
    });

    updateChecklistProgress();
}

function updateChecklistProgress() {
    const allCheckboxes = document.querySelectorAll('.checklist-item__checkbox:not([data-optional="true"])');
    const checkedBoxes = document.querySelectorAll('.checklist-item__checkbox:not([data-optional="true"]):checked');

    const total = allCheckboxes.length;
    const completed = checkedBoxes.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${completed} of ${total} items completed`;
    progressPercent.textContent = `${percent}%`;

    // Update group counts
    document.querySelectorAll('.checklist-group').forEach(group => {
        const groupCheckboxes = group.querySelectorAll('.checklist-item__checkbox');
        const groupChecked = group.querySelectorAll('.checklist-item__checkbox:checked');
        const countEl = group.querySelector('.checklist-group__count');
        if (countEl) {
            countEl.textContent = `${groupChecked.length}/${groupCheckboxes.length}`;
        }
    });
}

function saveChecklistToStorage() {
    const state = {};
    document.querySelectorAll('.checklist-item__checkbox').forEach(checkbox => {
        state[checkbox.dataset.item] = checkbox.checked;
    });
    localStorage.setItem('multinetics_checklist', JSON.stringify(state));
}

function loadChecklistFromStorage() {
    const saved = localStorage.getItem('multinetics_checklist');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            document.querySelectorAll('.checklist-item__checkbox').forEach(checkbox => {
                if (state[checkbox.dataset.item] !== undefined) {
                    checkbox.checked = state[checkbox.dataset.item];
                }
            });
            updateChecklistProgress();
        } catch (e) {
            console.error('Error loading checklist state:', e);
        }
    }
}

function resetChecklist() {
    document.querySelectorAll('.checklist-item__checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    localStorage.removeItem('multinetics_checklist');
    updateChecklistProgress();
    showToast('Reset Complete', 'Checklist has been reset.', 'success');
}

// ===== TOAST NOTIFICATIONS =====
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = {
        success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toast.innerHTML = `
        <div class="toast__icon">${icons[type] || icons.info}</div>
        <div class="toast__content">
            <div class="toast__title">${title}</div>
            <div class="toast__message">${message}</div>
        </div>
        <button class="toast__close" onclick="this.closest('.toast').remove()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Add spin animation for loading state
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);
