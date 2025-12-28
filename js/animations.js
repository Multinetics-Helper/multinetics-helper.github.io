/**
 * GSAP Animations - Multinetics Search
 * Smooth, premium animations for the UI
 */

class Animations {
    constructor() {
        this.gsap = window.gsap;
        this.ScrollTrigger = window.ScrollTrigger;

        if (this.gsap && this.ScrollTrigger) {
            this.gsap.registerPlugin(this.ScrollTrigger);
            this.init();
        }
    }

    init() {
        this.initScrollProgress();
        this.initHeroAnimations();
        this.initScrollAnimations();
        this.initHeaderScroll();
        this.initMagneticButtons();
        this.initParallax();
    }

    // Scroll progress bar
    initScrollProgress() {
        const progressBar = document.getElementById('scrollProgress');
        if (!progressBar) return;

        this.gsap.to(progressBar, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.3
            }
        });

        // Set initial state
        this.gsap.set(progressBar, { scaleX: 0, transformOrigin: 'left center' });
    }

    // Hero section entrance animations
    initHeroAnimations() {
        const heroElements = document.querySelectorAll('.hero .gsap-fade-up');

        if (heroElements.length === 0) return;

        const tl = this.gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.fromTo(heroElements,
            {
                y: 50,
                opacity: 0
            },
            {
                y: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.15
            }
        );

        // Animate stats numbers
        this.animateStats();
    }

    // Animate stat numbers counting up
    animateStats() {
        const statNumbers = document.querySelectorAll('.stat__number');

        statNumbers.forEach(stat => {
            const target = parseInt(stat.textContent) || 0;
            if (target > 0) {
                this.gsap.fromTo(stat,
                    { textContent: 0 },
                    {
                        textContent: target,
                        duration: 2,
                        ease: 'power2.out',
                        snap: { textContent: 1 },
                        scrollTrigger: {
                            trigger: stat,
                            start: 'top 80%'
                        }
                    }
                );
            }
        });
    }

    // Update stats with actual data
    updateStats(articles, authors, topics) {
        const statArticles = document.getElementById('statArticles');
        const statYears = document.getElementById('statYears');
        const statTopics = document.getElementById('statTopics');

        if (statArticles) {
            this.gsap.to(statArticles, {
                textContent: articles,
                duration: 1.5,
                ease: 'power2.out',
                snap: { textContent: 1 }
            });
        }

        if (statYears) {
            this.gsap.to(statYears, {
                textContent: authors,
                duration: 1.5,
                ease: 'power2.out',
                snap: { textContent: 1 }
            });
        }

        if (statTopics) {
            this.gsap.to(statTopics, {
                textContent: topics,
                duration: 1.5,
                ease: 'power2.out',
                snap: { textContent: 1 }
            });
        }
    }

    // Scroll-triggered animations
    initScrollAnimations() {
        // Fade up elements
        this.gsap.utils.toArray('.gsap-fade-up:not(.hero .gsap-fade-up)').forEach(el => {
            this.gsap.fromTo(el,
                { y: 40, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });
    }

    // Header behavior on scroll
    initHeaderScroll() {
        const header = document.getElementById('header');
        if (!header) return;

        let lastScrollY = 0;

        this.ScrollTrigger.create({
            start: 'top -100',
            onUpdate: (self) => {
                const scrollY = window.scrollY;

                // Add shadow when scrolled
                header.classList.toggle('scrolled', scrollY > 50);

                // Hide/show on scroll direction (optional - currently disabled)
                // if (scrollY > lastScrollY && scrollY > 200) {
                //   header.style.transform = 'translateY(-100%)';
                // } else {
                //   header.style.transform = 'translateY(0)';
                // }

                lastScrollY = scrollY;
            }
        });
    }

    // Magnetic button effect
    initMagneticButtons() {
        const magneticButtons = document.querySelectorAll('.magnetic-btn');

        magneticButtons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                this.gsap.to(btn, {
                    x: x * 0.3,
                    y: y * 0.3,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            btn.addEventListener('mouseleave', () => {
                this.gsap.to(btn, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.3)'
                });
            });
        });
    }

    // Parallax background effects
    initParallax() {
        const parallaxElements = document.querySelectorAll('.parallax');

        parallaxElements.forEach((el, i) => {
            const speed = (i + 1) * 0.1;

            this.gsap.to(el, {
                y: () => window.innerHeight * speed,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                }
            });
        });
    }

    // Animate article cards on render
    animateCards(container) {
        const cards = container.querySelectorAll('.article-card');

        this.gsap.fromTo(cards,
            {
                y: 30,
                opacity: 0,
                scale: 0.95
            },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.5,
                stagger: 0.05,
                ease: 'power3.out'
            }
        );
    }

    // Modal open animation
    openModal(overlay, modal) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        this.gsap.fromTo(modal,
            { y: 30, scale: 0.95 },
            { y: 0, scale: 1, duration: 0.4, ease: 'power3.out' }
        );
    }

    // Modal close animation
    closeModal(overlay, modal) {
        this.gsap.to(modal, {
            y: 20,
            scale: 0.95,
            duration: 0.3,
            ease: 'power3.in',
            onComplete: () => {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Search input focus animation
    animateSearchFocus(wrapper, focused) {
        if (focused) {
            this.gsap.to(wrapper, {
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out'
            });
        } else {
            this.gsap.to(wrapper, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    }

    // Toast notification animation
    showToast(toast) {
        this.gsap.to(toast, {
            x: 0,
            duration: 0.5,
            ease: 'power3.out'
        });

        this.gsap.to(toast, {
            x: '120%',
            duration: 0.4,
            ease: 'power3.in',
            delay: 3
        });
    }
}

// Initialize
window.animations = new Animations();
