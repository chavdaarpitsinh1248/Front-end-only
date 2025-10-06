// ===================== FLOATING TOYS =====================
const toys = document.querySelectorAll('.toy');
const hero = document.getElementById('hero');
const heroContent = document.querySelectorAll('#hero h2, #hero form');

// Initialize toys with random positions inside hero (avoiding content)
function initToys() {
    const heroWidth = hero.offsetWidth;
    const heroHeight = hero.offsetHeight;

    // Get bounding boxes for hero content
    const exclusionZones = Array.from(heroContent).map(el => el.getBoundingClientRect());

    toys.forEach(toy => {
        let validPosition = false;
        let toyX, toyY;

        while (!validPosition) {
            toyX = Math.random() * (heroWidth - 40);
            toyY = Math.random() * (heroHeight - 40);

            validPosition = !exclusionZones.some(zone => {
                const localX = toyX + hero.getBoundingClientRect().left;
                const localY = toyY + hero.getBoundingClientRect().top;
                return (
                    localX + 20 > zone.left &&
                    localX < zone.right &&
                    localY + 20 > zone.top &&
                    localY < zone.bottom
                );
            });
        }

        toy.style.left = toyX + 'px';
        toy.style.top = toyY + 'px';
    });
}

// Call initialization after page loads
window.addEventListener('load', initToys);

// Move toys away from cursor
document.addEventListener('mousemove', (e) => {
    const heroRect = hero.getBoundingClientRect();
    const mouseX = e.clientX - heroRect.left;
    const mouseY = e.clientY - heroRect.top;

    toys.forEach(toy => {
        let toyX = parseFloat(toy.style.left);
        let toyY = parseFloat(toy.style.top);

        const dx = toyX - mouseX;
        const dy = toyY - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 80) { // dodge radius
            toyX += (dx / distance) * 10;
            toyY += (dy / distance) * 10;

            // Keep toys inside hero
            toyX = Math.min(Math.max(toyX, 0), hero.offsetWidth - 30);
            toyY = Math.min(Math.max(toyY, 0), hero.offsetHeight - 30);

            toy.style.left = toyX + 'px';
            toy.style.top = toyY + 'px';
        }
    });
});

// Gentle floating animation (up and down)
setInterval(() => {
    toys.forEach(toy => {
        let y = parseFloat(toy.style.top);
        y += Math.sin(Date.now() / 500 + parseFloat(toy.style.left)) * 0.5; // gentle float
        toy.style.top = y + 'px';
    });
}, 30);

// Optional: reposition toys on window resize
window.addEventListener('resize', initToys);
