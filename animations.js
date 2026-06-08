/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     PORTFOLIO ANIMATIONS & EFFECTS                        ║
 * ║                   Premium Interactive Animations v2.0                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// PARTICLE SYSTEM - Floating particles in hero section
// ============================================================================
class ParticleSystem {
    constructor(container) {
        this.container = container;
        this.particles = [];
        this.particleCount = 40;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isVisible = true;
        this.init();
    }

    init() {
        // Create particle container
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particle-canvas';
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
        `;
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.resize(), { passive: true });
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        }, { passive: true });

        // Pause when not visible for performance
        const observer = new IntersectionObserver((entries) => {
            this.isVisible = entries[0].isIntersecting;
        }, { threshold: 0.1 });
        observer.observe(this.container);
    }

    resize() {
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                pulseSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }

    animate() {
        if (!this.isVisible) {
            requestAnimationFrame(() => this.animate());
            return;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach((p, i) => {
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Mouse interaction - particles gently move away from mouse
            const dx = p.x - this.mouseX;
            const dy = p.y - this.mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const force = (150 - dist) / 150;
                p.vx += (dx / dist) * force * 0.02;
                p.vy += (dy / dist) * force * 0.02;
            }
            
            // Damping
            p.vx *= 0.99;
            p.vy *= 0.99;
            
            // Pulse opacity
            p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.005;
            p.opacity = Math.max(0.1, Math.min(0.6, p.opacity));
            
            // Wrap around edges
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            
            // Draw particle with glow
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            this.ctx.fill();
            
            // Draw connections
            this.particles.slice(i + 1).forEach(p2 => {
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 80) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - dist / 80)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            });
        });
        
        this.ctx.shadowBlur = 0;
        requestAnimationFrame(() => this.animate());
    }
}

// ============================================================================
// MAGNETIC BUTTON EFFECT
// ============================================================================
class MagneticButton {
    constructor(element) {
        this.element = element;
        this.strength = 30;
        this.init();
    }

    init() {
        this.element.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        this.element.addEventListener('mousemove', (e) => {
            const rect = this.element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            this.element.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        
        this.element.addEventListener('mouseleave', () => {
            this.element.style.transform = 'translate(0, 0)';
        });
    }
}

// ============================================================================
// TEXT SCRAMBLE EFFECT
// ============================================================================
class TextScramble {
    constructor(element) {
        this.element = element;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.originalText = element.textContent;
        this.queue = [];
        this.frame = 0;
        this.frameRequest = null;
        this.resolve = null;
    }

    setText(newText) {
        const oldText = this.element.textContent;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise(resolve => this.resolve = resolve);
        this.queue = [];
        
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;
        
        for (let i = 0; i < this.queue.length; i++) {
            let { from, to, start, end, char } = this.queue[i];
            
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.chars[Math.floor(Math.random() * this.chars.length)];
                    this.queue[i].char = char;
                }
                output += `<span style="color: rgba(255,255,255,0.4)">${char}</span>`;
            } else {
                output += from;
            }
        }
        
        this.element.innerHTML = output;
        
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(() => this.update());
            this.frame++;
        }
    }
}

// ============================================================================
// SCROLL REVEAL ANIMATION
// ============================================================================
class ScrollReveal {
    constructor() {
        this.elements = [];
        this.init();
    }

    init() {
        // Add reveal classes to elements
        const selectors = [
            '.about-content-wrapper',
            '.highlight-box',
            '.skill-item-image',
            '.project-card',
            '.contact-item',
            '.education-item',
            '.internship-item',
            '.skills-header'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((el, i) => {
                el.classList.add('reveal-element');
                el.style.setProperty('--reveal-delay', `${i * 0.1}s`);
            });
        });

        // Create observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.reveal-element').forEach(el => {
            observer.observe(el);
        });

        // Inject reveal styles
        this.injectStyles();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .reveal-element {
                opacity: 0;
                transform: translateY(50px);
                transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                transition-delay: var(--reveal-delay, 0s);
            }
            
            .reveal-element.revealed {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================================
// TILT EFFECT FOR CARDS
// ============================================================================
class TiltEffect {
    constructor(element) {
        this.element = element;
        this.max = 10;
        this.perspective = 1000;
        this.init();
    }

    init() {
        this.element.style.transformStyle = 'preserve-3d';
        this.element.style.transition = 'transform 0.3s ease-out';
        
        this.element.addEventListener('mousemove', (e) => {
            const rect = this.element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPercent = (x / rect.width - 0.5) * 2;
            const yPercent = (y / rect.height - 0.5) * 2;
            
            const rotateX = -yPercent * this.max;
            const rotateY = xPercent * this.max;
            
            this.element.style.transform = `
                perspective(${this.perspective}px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg)
                scale3d(1.02, 1.02, 1.02)
            `;
        });
        
        this.element.addEventListener('mouseleave', () => {
            this.element.style.transform = `
                perspective(${this.perspective}px) 
                rotateX(0deg) 
                rotateY(0deg)
                scale3d(1, 1, 1)
            `;
        });
    }
}

// ============================================================================
// SMOOTH COUNTER ANIMATION
// ============================================================================
class CounterAnimation {
    constructor(element, target, duration = 2000) {
        this.element = element;
        this.target = target;
        this.duration = duration;
        this.start = 0;
        this.current = 0;
        this.startTime = null;
    }

    animate(timestamp) {
        if (!this.startTime) this.startTime = timestamp;
        
        const progress = Math.min((timestamp - this.startTime) / this.duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        this.current = Math.floor(easeOut * this.target);
        this.element.textContent = this.current + (this.element.dataset.suffix || '');
        
        if (progress < 1) {
            requestAnimationFrame((t) => this.animate(t));
        }
    }

    start() {
        requestAnimationFrame((t) => this.animate(t));
    }
}

// ============================================================================
// CURSOR GLOW EFFECT
// ============================================================================
class CursorGlow {
    constructor() {
        this.cursor = null;
        this.cursorTrail = [];
        this.trailLength = 8;
        this.init();
    }

    init() {
        // Main cursor
        this.cursor = document.createElement('div');
        this.cursor.className = 'custom-cursor';
        document.body.appendChild(this.cursor);
        
        // Trail elements
        for (let i = 0; i < this.trailLength; i++) {
            const trail = document.createElement('div');
            trail.className = 'cursor-trail';
            trail.style.setProperty('--trail-delay', `${i * 20}ms`);
            trail.style.setProperty('--trail-opacity', `${1 - i / this.trailLength}`);
            trail.style.setProperty('--trail-scale', `${1 - i * 0.1}`);
            document.body.appendChild(trail);
            this.cursorTrail.push({ element: trail, x: 0, y: 0 });
        }
        
        this.injectStyles();
        this.bindEvents();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .custom-cursor {
                position: fixed;
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255, 255, 255, 0.8);
                border-radius: 50%;
                pointer-events: none;
                z-index: 10001;
                transform: translate(-50%, -50%);
                transition: width 0.2s, height 0.2s, background 0.2s;
                mix-blend-mode: difference;
            }
            
            .custom-cursor.hover {
                width: 50px;
                height: 50px;
                background: rgba(255, 255, 255, 0.1);
            }
            
            .custom-cursor.click {
                transform: translate(-50%, -50%) scale(0.8);
            }
            
            .cursor-trail {
                position: fixed;
                width: 8px;
                height: 8px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                transform: translate(-50%, -50%) scale(var(--trail-scale));
                opacity: var(--trail-opacity);
                transition: transform 0.1s ease-out;
            }
            
            @media (max-width: 768px) {
                .custom-cursor, .cursor-trail {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        let cursorX = 0, cursorY = 0;
        let trailPositions = Array(this.trailLength).fill().map(() => ({ x: 0, y: 0 }));
        
        document.addEventListener('mousemove', (e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            
            this.cursor.style.left = `${cursorX}px`;
            this.cursor.style.top = `${cursorY}px`;
        });
        
        // Animate trail
        const animateTrail = () => {
            trailPositions.unshift({ x: cursorX, y: cursorY });
            trailPositions.pop();
            
            this.cursorTrail.forEach((trail, i) => {
                const pos = trailPositions[Math.min(i * 2, trailPositions.length - 1)];
                trail.element.style.left = `${pos.x}px`;
                trail.element.style.top = `${pos.y}px`;
            });
            
            requestAnimationFrame(animateTrail);
        };
        animateTrail();
        
        // Hover effects
        const hoverElements = document.querySelectorAll('a, button, .project-card, .skill-item-image, .highlight-box');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => this.cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => this.cursor.classList.remove('hover'));
        });
        
        // Click effect
        document.addEventListener('mousedown', () => this.cursor.classList.add('click'));
        document.addEventListener('mouseup', () => this.cursor.classList.remove('click'));
    }
}

// ============================================================================
// PARALLAX SCROLLING
// ============================================================================
class ParallaxScroll {
    constructor() {
        this.elements = [];
        this.init();
    }

    init() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        parallaxElements.forEach(el => {
            this.elements.push({
                element: el,
                speed: parseFloat(el.dataset.parallax) || 0.5
            });
        });

        // Add parallax to hero section elements
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.dataset.parallax = '0.3';
            this.elements.push({ element: heroContent, speed: 0.3 });
        }

        window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    }

    onScroll() {
        const scrollY = window.scrollY;
        
        this.elements.forEach(({ element, speed }) => {
            const rect = element.getBoundingClientRect();
            const inView = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (inView) {
                const y = scrollY * speed;
                element.style.transform = `translateY(${-y}px)`;
            }
        });
    }
}

// ============================================================================
// TYPING ANIMATION ENHANCED
// ============================================================================
class TypeWriter {
    constructor(element, phrases, options = {}) {
        this.element = element;
        this.phrases = phrases;
        this.currentPhraseIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        this.typeSpeed = options.typeSpeed || 100;
        this.deleteSpeed = options.deleteSpeed || 50;
        this.pauseDuration = options.pauseDuration || 2000;
        this.type();
    }

    type() {
        const currentPhrase = this.phrases[this.currentPhraseIndex];
        
        if (this.isDeleting) {
            this.currentCharIndex--;
            this.element.textContent = currentPhrase.substring(0, this.currentCharIndex);
        } else {
            this.currentCharIndex++;
            this.element.textContent = currentPhrase.substring(0, this.currentCharIndex);
        }
        
        let delay = this.isDeleting ? this.deleteSpeed : this.typeSpeed;
        
        if (!this.isDeleting && this.currentCharIndex === currentPhrase.length) {
            delay = this.pauseDuration;
            this.isDeleting = true;
        } else if (this.isDeleting && this.currentCharIndex === 0) {
            this.isDeleting = false;
            this.currentPhraseIndex = (this.currentPhraseIndex + 1) % this.phrases.length;
            delay = 500;
        }
        
        setTimeout(() => this.type(), delay);
    }
}

// ============================================================================
// RIPPLE EFFECT
// ============================================================================
class RippleEffect {
    constructor() {
        this.init();
    }

    init() {
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-resume, .project-link, .view-more-btn');
        
        buttons.forEach(button => {
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            
            button.addEventListener('click', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                
                button.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });

        this.injectStyles();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ripple {
                position: absolute;
                width: 20px;
                height: 20px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0);
                animation: ripple-animation 0.6s ease-out;
                pointer-events: none;
            }
            
            @keyframes ripple-animation {
                to {
                    transform: translate(-50%, -50%) scale(20);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================================
// SKILL BAR ANIMATION
// ============================================================================
class SkillBarAnimation {
    constructor() {
        this.init();
    }

    init() {
        const skillItems = document.querySelectorAll('.skill-item-image');
        
        skillItems.forEach((item, index) => {
            // Add glow effect on hover
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateY(-15px) scale(1.1)';
                item.style.boxShadow = '0 20px 50px rgba(255, 255, 255, 0.2), 0 0 30px rgba(255, 255, 255, 0.1)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = '';
                item.style.boxShadow = '';
            });
            
            // Add floating animation with different delays
            item.style.animation = `float-skill ${3 + Math.random()}s ease-in-out ${index * 0.1}s infinite`;
        });

        this.injectStyles();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float-skill {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }
            
            .skill-item-image {
                transition: transform 0.4s ease, box-shadow 0.4s ease !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================================
// NAVIGATION ANIMATION
// ============================================================================
class NavigationAnimation {
    constructor() {
        this.init();
    }

    init() {
        const navLinks = document.querySelectorAll('.nav-links a');
        const burger = document.querySelector('.burger');
        const header = document.querySelector('header');
        
        // Active link indicator
        const indicator = document.createElement('span');
        indicator.className = 'nav-indicator';
        document.querySelector('.nav-links')?.appendChild(indicator);
        
        // Animate active link
        navLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                this.moveIndicator(indicator, link);
            });
            
            link.addEventListener('click', () => {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
        
        // Header scroll effect
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;
            
            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            // Hide/show on scroll direction
            if (currentScroll > lastScroll && currentScroll > 200) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScroll = currentScroll;
        });

        this.injectStyles();
    }

    moveIndicator(indicator, target) {
        const rect = target.getBoundingClientRect();
        const parentRect = target.parentElement.parentElement.getBoundingClientRect();
        
        indicator.style.width = `${rect.width}px`;
        indicator.style.left = `${rect.left - parentRect.left}px`;
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .nav-indicator {
                position: absolute;
                bottom: -5px;
                height: 3px;
                background: linear-gradient(90deg, #ffffff, #aaaaaa);
                border-radius: 2px;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            
            header {
                transition: transform 0.3s ease, background 0.3s ease, padding 0.3s ease !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================================
// PROJECT CARD HOVER EFFECTS
// ============================================================================
class ProjectCardEffects {
    constructor() {
        this.init();
    }

    init() {
        const projectCards = document.querySelectorAll('.project-card');
        
        projectCards.forEach(card => {
            // Create shine effect element
            const shine = document.createElement('div');
            shine.className = 'card-shine';
            card.appendChild(shine);
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                shine.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
            });
            
            card.addEventListener('mouseleave', () => {
                shine.style.background = 'transparent';
            });
        });

        this.injectStyles();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .project-card {
                position: relative;
                overflow: hidden;
            }
            
            .card-shine {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10;
                transition: background 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================================
// SMOOTH SCROLL WITH EASING
// ============================================================================
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                
                if (target) {
                    this.scrollTo(target);
                }
            });
        });
    }

    scrollTo(target) {
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - 100;
        const startPosition = window.scrollY;
        const distance = targetPosition - startPosition;
        const duration = 1000;
        let start = null;

        const animation = (currentTime) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Easing function
            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }
}

// ============================================================================
// LOADING SCREEN ANIMATION
// ============================================================================
class LoadingScreen {
    constructor() {
        this.init();
    }

    init() {
        const loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-circle"></div>
                <div class="loader-circle"></div>
                <div class="loader-circle"></div>
                <div class="loader-text">Loading</div>
            </div>
        `;
        document.body.appendChild(loader);
        
        this.injectStyles();
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('loaded');
                setTimeout(() => loader.remove(), 300);
            }, 200);
        });
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #page-loader {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #111111;
                z-index: 100000;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: opacity 0.5s ease;
            }
            
            #page-loader.loaded {
                opacity: 0;
                pointer-events: none;
            }
            
            .loader-content {
                text-align: center;
            }
            
            .loader-circle {
                display: inline-block;
                width: 15px;
                height: 15px;
                border-radius: 50%;
                background: #fff;
                margin: 0 5px;
                animation: loader-bounce 0.6s ease-in-out infinite;
            }
            
            .loader-circle:nth-child(2) {
                animation-delay: 0.1s;
            }
            
            .loader-circle:nth-child(3) {
                animation-delay: 0.2s;
            }
            
            @keyframes loader-bounce {
                0%, 100% { transform: translateY(0); opacity: 0.5; }
                50% { transform: translateY(-20px); opacity: 1; }
            }
            
            .loader-text {
                color: #fff;
                font-family: 'Montserrat', sans-serif;
                margin-top: 20px;
                letter-spacing: 3px;
                text-transform: uppercase;
                font-size: 14px;
                animation: fade-in-out 1.5s ease-in-out infinite;
            }
            
            @keyframes fade-in-out {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================================
// FLOATING ACTION BUTTON
// ============================================================================
class FloatingActionButton {
    constructor() {
        this.init();
    }

    init() {
        const fab = document.createElement('div');
        fab.id = 'floating-action-btn';
        fab.innerHTML = `
            <button class="fab-main" aria-label="Scroll to top">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
            </button>
        `;
        document.body.appendChild(fab);
        
        this.injectStyles();
        this.bindEvents(fab);
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #floating-action-btn {
                position: fixed;
                bottom: 30px;
                right: 30px;
                z-index: 9999;
                opacity: 0;
                transform: translateY(100px);
                transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            
            #floating-action-btn.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .fab-main {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ffffff, #dddddd);
                border: none;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                color: #111;
            }
            
            .fab-main:hover {
                transform: scale(1.1) rotate(360deg);
                box-shadow: 0 6px 30px rgba(255, 255, 255, 0.2);
            }
            
            .fab-main svg {
                transition: transform 0.3s ease;
            }
            
            .fab-main:hover svg {
                transform: translateY(-3px);
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents(fab) {
        const fabBtn = fab.querySelector('.fab-main');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                fab.classList.add('visible');
            } else {
                fab.classList.remove('visible');
            }
        }, { passive: true });
        
        fabBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// ============================================================================
// SECTION PROGRESS INDICATOR
// ============================================================================
class SectionProgress {
    constructor() {
        this.init();
    }

    init() {
        const progressBar = document.createElement('div');
        progressBar.id = 'section-progress';
        document.body.appendChild(progressBar);
        
        this.injectStyles();
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = `${progress}%`;
        }, { passive: true });
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #section-progress {
                position: fixed;
                top: 0;
                left: 0;
                height: 3px;
                background: linear-gradient(90deg, #ffffff, #888888);
                z-index: 10002;
                transition: width 0.1s ease-out;
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================================
// INITIALIZE ALL ANIMATIONS
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initialize loading screen first
    new LoadingScreen();
    
    // Wait for page to fully load
    window.addEventListener('load', () => {
        // Hero section particle system (skip if reduced motion)
        if (!prefersReducedMotion) {
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                new ParticleSystem(heroSection);
            }
        }
        
        // Scroll reveal animations
        new ScrollReveal();
        
        // Custom cursor (only on desktop, skip if reduced motion)
        if (window.innerWidth > 768 && !prefersReducedMotion) {
            new CursorGlow();
        }
        
        // Magnetic buttons
        document.querySelectorAll('.btn-primary, .btn-secondary, .btn-resume').forEach(btn => {
            new MagneticButton(btn);
        });
        
        // Tilt effect on cards (skip if reduced motion)
        if (!prefersReducedMotion) {
            document.querySelectorAll('.project-card, .highlight-box').forEach(card => {
                new TiltEffect(card);
            });
        }
        
        // Ripple effect
        new RippleEffect();
        
        // Skill bar animations
        new SkillBarAnimation();
        
        // Navigation animations
        new NavigationAnimation();
        
        // Project card effects
        new ProjectCardEffects();
        
        // Smooth scroll
        new SmoothScroll();
        
        // Floating action button
        new FloatingActionButton();
        
        // Section progress indicator
        new SectionProgress();
        
        // Text scramble on hero title (optional enhancement)
        const heroTitle = document.querySelector('.hero-content h1');
        if (heroTitle && !prefersReducedMotion) {
            heroTitle.addEventListener('mouseenter', () => {
                const scramble = new TextScramble(heroTitle);
                scramble.setText(heroTitle.textContent);
            });
        }
        
        // Enhanced typing animation
        const typingElement = document.querySelector('.typing-text');
        if (typingElement) {
            new TypeWriter(typingElement, [
                'Full Stack Developer',
                'UI/UX Enthusiast',
                'Problem Solver',
                'Creative Thinker'
            ], {
                typeSpeed: 80,
                deleteSpeed: 40,
                pauseDuration: 2500
            });
        }
        
        console.log('🚀 All premium animations initialized successfully!');
    });
});

// ============================================================================
// UTILITY: Performance optimization
// ============================================================================
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Optimize scroll handlers
window.addEventListener('scroll', debounce(() => {
    // Trigger any scroll-dependent animations here
}, 16), { passive: true });
