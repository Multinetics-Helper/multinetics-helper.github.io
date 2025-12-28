/**
 * About Page JavaScript
 * GSAP animations and scroll-triggered video
 */

document.addEventListener('DOMContentLoaded', () => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Initialize animations
    initHeroAnimations();
    initSectionAnimations();
    initScrollVideo();
});

// Hero entrance animations
function initHeroAnimations() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.about-hero__eyebrow', {
        y: 30,
        opacity: 0,
        duration: 0.8
    })
        .from('.about-hero__title', {
            y: 50,
            opacity: 0,
            duration: 1
        }, '-=0.5')
        .from('.about-hero__subtitle', {
            y: 30,
            opacity: 0,
            duration: 0.8
        }, '-=0.6')
        .from('.about-hero__circle', {
            scale: 0,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'elastic.out(1, 0.5)'
        }, '-=1');
}

// Section scroll animations
function initSectionAnimations() {
    // Animate each story section
    gsap.utils.toArray('.story-section').forEach((section, i) => {
        const image = section.querySelector('.story-section__image-frame');
        const content = section.querySelector('.story-section__content');
        const decors = section.querySelectorAll('.story-section__decor');
        const isReversed = section.classList.contains('story-section--reversed');

        // Image animation
        gsap.from(image, {
            x: isReversed ? 100 : -100,
            opacity: 0,
            rotation: isReversed ? 5 : -5,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: section,
                start: 'top 70%',
                toggleActions: 'play none none reverse'
            }
        });

        // Content animation
        gsap.from(content.children, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: section,
                start: 'top 65%',
                toggleActions: 'play none none reverse'
            }
        });

        // Decorative elements
        gsap.from(decors, {
            scale: 0,
            opacity: 0,
            rotation: -180,
            duration: 0.6,
            stagger: 0.1,
            ease: 'back.out(2)',
            scrollTrigger: {
                trigger: section,
                start: 'top 60%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // Closing quote animation
    gsap.from('.about-closing__content', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.about-closing',
            start: 'top 70%',
            toggleActions: 'play none none reverse'
        }
    });

    // Quote marks bounce in
    gsap.from('.about-closing__quote-mark', {
        scale: 0,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'elastic.out(1, 0.5)',
        scrollTrigger: {
            trigger: '.about-closing',
            start: 'top 60%',
            toggleActions: 'play none none reverse'
        }
    });
}

// Scroll-triggered video playback
function initScrollVideo() {
    const video = document.getElementById('footerVideo');
    const videoSection = document.getElementById('videoFooter');

    if (!video || !videoSection) return;

    // Create scroll trigger for video
    ScrollTrigger.create({
        trigger: videoSection,
        start: 'top 80%',
        end: 'bottom top',
        onEnter: () => {
            video.play().catch(e => console.log('Video autoplay prevented:', e));
        },
        onLeave: () => {
            video.pause();
        },
        onEnterBack: () => {
            video.play().catch(e => console.log('Video autoplay prevented:', e));
        },
        onLeaveBack: () => {
            video.pause();
            video.currentTime = 0;
        }
    });

    // Optional: Loop video when it ends (if you want it to loop)
    video.addEventListener('ended', () => {
        // Uncomment below if you want the video to loop
        // video.currentTime = 0;
        // video.play();
    });
}

// Parallax effect for hero background elements
gsap.to('.about-hero__circle--1', {
    y: 100,
    ease: 'none',
    scrollTrigger: {
        trigger: '.about-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
    }
});

gsap.to('.about-hero__circle--2', {
    y: 50,
    x: -30,
    ease: 'none',
    scrollTrigger: {
        trigger: '.about-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5
    }
});

// Header scroll behavior  
let lastScroll = 0;
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});
