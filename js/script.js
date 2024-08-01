// Header always on top
document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 0) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
});

// Bacgkground slideshow
document.addEventListener('DOMContentLoaded', function() {
    const backgrounds = [
        '../img/tokyo.jpg',
        '../img/guilin.jpg',
        '../img/paris.jpg',
        '../img/london.jpg',
    ];

    let currentBackgroundIndex = 0;
    const backgroundContainer = document.querySelector('.background-container');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    function changeBackground(index) {
        backgroundContainer.style.backgroundImage = `url('${backgrounds[index]}')`;
    }

    function showNextBackground() {
        currentBackgroundIndex = (currentBackgroundIndex + 1) % backgrounds.length;
        changeBackground(currentBackgroundIndex);
    }

    function showPrevBackground() {
        currentBackgroundIndex = (currentBackgroundIndex - 1 + backgrounds.length) % backgrounds.length;
        changeBackground(currentBackgroundIndex);
    }

    setInterval(showNextBackground, 8000);

    nextButton.addEventListener('click', showNextBackground);
    prevButton.addEventListener('click', showPrevBackground);

    changeBackground(currentBackgroundIndex);
});

// Notification
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();

    alert('Thank you for your submission! Our team will contact you within 24 hours.');

    this.reset();
});