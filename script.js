// Three.js Scene Setup
let scene, camera, renderer, particles, particleSystem;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let time = 0;

// Initialize Three.js Scene
function initThreeJS() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create particle system
    createParticleSystem();

    // Position camera
    camera.position.z = 5;

    // Animation loop
    animate();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onDocumentMouseMove);
}

// Create particle system
function createParticleSystem() {
    const particleCount = 2000; // Increased particle count
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);

    const geometry = new THREE.BufferGeometry();

    for (let i = 0; i < particleCount; i++) {
        // Position - Create more dynamic distribution
        const radius = Math.random() * 20 + 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        // Velocity - More varied movement
        velocities[i * 3] = (Math.random() - 0.5) * 0.03;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.03;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.03;

        // Color - Enhanced cyberpunk neon colors
        const colorChoice = Math.random();
        if (colorChoice < 0.35) {
            // Bright green neon
            colors[i * 3] = 0.0;
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 0.3;
        } else if (colorChoice < 0.65) {
            // Bright cyan neon
            colors[i * 3] = 0.0;
            colors[i * 3 + 1] = 0.9;
            colors[i * 3 + 2] = 1.0;
        } else if (colorChoice < 0.85) {
            // Bright magenta neon
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.0;
            colors[i * 3 + 2] = 1.0;
        } else {
            // White/blue accent
            colors[i * 3] = 0.8;
            colors[i * 3 + 1] = 0.9;
            colors[i * 3 + 2] = 1.0;
        }

        // Size - More varied sizes
        sizes[i] = Math.random() * 4 + 1.5;
        
        // Opacity - Vary opacity for depth effect
        opacities[i] = Math.random() * 0.8 + 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    // Create enhanced shader material with better visual effects
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            mousePosition: { value: new THREE.Vector2(0, 0) },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            attribute vec3 velocity;
            attribute float opacity;
            varying vec3 vColor;
            varying float vDistance;
            varying float vOpacity;
            uniform float time;
            uniform vec2 mousePosition;
            
            void main() {
                vColor = color;
                vOpacity = opacity;
                
                // Enhanced particle animation
                vec3 pos = position;
                
                // Add wave motion
                pos.x += sin(time * 0.5 + position.y * 0.1) * 0.8;
                pos.y += cos(time * 0.3 + position.x * 0.1) * 0.8;
                pos.z += sin(time * 0.7 + position.x * 0.1) * 0.8;
                
                // Add spiral motion
                float angle = time * 0.2 + length(pos.xy) * 0.1;
                pos.x += cos(angle) * 0.3;
                pos.y += sin(angle) * 0.3;
                
                // Enhanced mouse interaction
                float distance = length(pos.xy - mousePosition * 15.0);
                if (distance < 8.0) {
                    vec2 direction = normalize(pos.xy - mousePosition * 15.0);
                    pos.xy += direction * 3.0 * (1.0 - distance / 8.0);
                }
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                vDistance = -mvPosition.z;
                
                // Dynamic size based on distance and time
                float dynamicSize = size * (300.0 / -mvPosition.z);
                dynamicSize *= 1.0 + sin(time * 2.0 + position.x * 0.1) * 0.3;
                dynamicSize *= 1.0 + sin(time * 1.5 + position.y * 0.1) * 0.2;
                
                gl_PointSize = dynamicSize;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vDistance;
            varying float vOpacity;
            uniform float time;
            
            void main() {
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                
                // Enhanced neon glow effect
                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                alpha *= vOpacity;
                alpha *= 0.9 + 0.1 * sin(time * 3.0 + vDistance * 0.1);
                
                // Create inner core
                float core = 1.0 - smoothstep(0.0, 0.2, dist);
                
                // Create outer glow
                float glow = 1.0 - smoothstep(0.3, 0.8, dist);
                glow *= 0.5;
                
                // Combine effects
                vec3 finalColor = vColor * core + vColor * glow * 0.8;
                
                // Add subtle color variation
                finalColor += vec3(0.1, 0.1, 0.2) * glow * sin(time * 2.0 + vDistance * 0.05);
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    time += 0.016; // Consistent 60fps timing

    if (particleSystem) {
        // Update particle positions with enhanced physics
        const positions = particleSystem.geometry.attributes.position.array;
        const velocities = particleSystem.geometry.attributes.velocity.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Update velocity with subtle acceleration
            velocities[i] += (Math.random() - 0.5) * 0.001;
            velocities[i + 1] += (Math.random() - 0.5) * 0.001;
            velocities[i + 2] += (Math.random() - 0.5) * 0.001;
            
            // Apply velocity damping
            velocities[i] *= 0.999;
            velocities[i + 1] *= 0.999;
            velocities[i + 2] *= 0.999;
            
            // Update positions
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // Enhanced boundary wrapping with smooth transitions
            const maxDistance = 25;
            if (positions[i] > maxDistance) positions[i] = -maxDistance;
            if (positions[i] < -maxDistance) positions[i] = maxDistance;
            if (positions[i + 1] > maxDistance) positions[i + 1] = -maxDistance;
            if (positions[i + 1] < -maxDistance) positions[i + 1] = maxDistance;
            if (positions[i + 2] > maxDistance) positions[i + 2] = -maxDistance;
            if (positions[i + 2] < -maxDistance) positions[i + 2] = maxDistance;
        }
        
        particleSystem.geometry.attributes.position.needsUpdate = true;
        
        // Update uniforms
        particleSystem.material.uniforms.time.value = time;
        particleSystem.material.uniforms.mousePosition.value.set(mouseX, mouseY);
        
        // Smooth rotation with varying speeds
        particleSystem.rotation.x += 0.0008;
        particleSystem.rotation.y += 0.0012;
        particleSystem.rotation.z += 0.0004;
    }

    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    if (particleSystem) {
        particleSystem.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    }
}

// Handle mouse movement with smooth interpolation
function onDocumentMouseMove(event) {
    const targetX = (event.clientX - windowHalfX) / windowHalfX;
    const targetY = (event.clientY - windowHalfY) / windowHalfY;
    
    // Smooth interpolation for better performance
    mouseX += (targetX - mouseX) * 0.1;
    mouseY += (targetY - mouseY) * 0.1;
}

// Navigation functionality
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
    animatedElements.forEach(el => observer.observe(el));
}

// Skill bars animation
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-bar');
    
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const level = entry.target.getAttribute('data-level');
                entry.target.style.width = level + '%';
            }
        });
    }, { threshold: 0.5 });

    skillBars.forEach(bar => skillObserver.observe(bar));
}

// Floating elements animation
function initFloatingElements() {
    const floatingElements = document.querySelectorAll('.floating-element');
    
    floatingElements.forEach(element => {
        const speed = parseFloat(element.getAttribute('data-speed')) || 0.5;
        
        function animate() {
            const time = Date.now() * 0.001 * speed;
            const x = Math.sin(time) * 20;
            const y = Math.cos(time * 0.5) * 20;
            const rotation = Math.sin(time * 0.3) * 15;
            const scale = 1 + Math.sin(time * 0.7) * 0.1;
            
            element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
            requestAnimationFrame(animate);
        }
        
        animate();
    });
}

// Contact form handling
function initContactForm() {
    const form = document.getElementById('contact-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Show loading state
            submitBtn.innerHTML = '<span class="loading"></span> Sending...';
            submitBtn.disabled = true;
            
            // Simulate form submission (replace with actual form handling)
            setTimeout(() => {
                alert('Thank you for your message! I\'ll get back to you soon.');
                form.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// Scroll progress bar
function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.offsetHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.style.background = 'rgba(0, 0, 0, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 255, 65, 0.3)';
        } else {
            navbar.style.background = 'rgba(0, 0, 0, 0.95)';
            navbar.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.3)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Parallax effect for hero stats
function initParallaxEffects() {
    const heroStats = document.querySelector('.hero-stats');
    
    if (heroStats) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            heroStats.style.transform = `translateY(${rate}px)`;
        });
    }
}

// Typing effect for hero title
function initTypingEffect() {
    const titleName = document.querySelector('.title-name');
    if (!titleName) return;
    
    const text = titleName.textContent;
    titleName.textContent = '';
    
    let i = 0;
    const typeWriter = () => {
        if (i < text.length) {
            titleName.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    };
    
    // Start typing effect after a delay
    setTimeout(typeWriter, 1000);
}

// Counter animation for stats
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalValue = parseInt(target.textContent);
                const duration = 2000;
                const increment = finalValue / (duration / 16);
                let currentValue = 0;
                
                const updateCounter = () => {
                    currentValue += increment;
                    if (currentValue < finalValue) {
                        target.textContent = Math.floor(currentValue);
                        requestAnimationFrame(updateCounter);
                    } else {
                        target.textContent = finalValue;
                    }
                };
                
                updateCounter();
                counterObserver.unobserve(target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => counterObserver.observe(counter));
}

// Glitch effect for text
function initGlitchEffects() {
    const glitchElements = document.querySelectorAll('.title-name, .section-title');
    
    glitchElements.forEach(element => {
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance every interval
                element.style.textShadow = `
                    ${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px 0 #ff0000,
                    ${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px 0 #00ffff
                `;
                
                setTimeout(() => {
                    element.style.textShadow = '0 0 20px rgba(0, 255, 65, 0.8)';
                }, 100);
            }
        }, 2000);
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    initNavigation();
    initScrollAnimations();
    initSkillBars();
    initFloatingElements();
    initContactForm();
    initScrollProgress();
    initNavbarScroll();
    initParallaxEffects();
    initTypingEffect();
    initCounterAnimation();
    initGlitchEffects();
    
    // Add animation classes to elements
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
        if (index > 0) { // Skip hero section
            section.classList.add('fade-in');
        }
    });
    
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        card.classList.add(index % 2 === 0 ? 'slide-in-left' : 'slide-in-right');
    });
    
    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach((item, index) => {
        item.classList.add('fade-in');
        item.style.animationDelay = `${index * 0.1}s`;
    });
});

// Add some interactive hover effects
document.addEventListener('DOMContentLoaded', () => {
    // Project cards hover effect
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
            card.style.boxShadow = '0 0 40px rgba(0, 255, 65, 0.8)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '0 0 30px rgba(0, 255, 65, 0.5)';
        });
    });
    
    // Skill items hover effect
    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.background = 'rgba(0, 212, 255, 0.3)';
            item.style.color = '#ffffff';
            item.style.transform = 'translateX(10px) scale(1.05)';
            item.style.boxShadow = '0 0 30px rgba(0, 212, 255, 0.8)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.background = 'rgba(0, 212, 255, 0.1)';
            item.style.color = '#00d4ff';
            item.style.transform = 'translateX(0) scale(1)';
            item.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
        });
    });
});

// Performance optimization: Throttle scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Apply throttling to scroll events
window.addEventListener('scroll', throttle(() => {
    // Scroll-based animations can be added here
}, 16)); // ~60fps
