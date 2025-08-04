import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBs3qdrCTTlTBBUPFhs-9lotw7ww40RTGg",
    authDomain: "anitrends-1.firebaseapp.com",
    projectId: "anitrends-1",
    storageBucket: "anitrends-1.firebasestorage.app",
    messagingSenderId: "394108326062",
    appId: "1:394108326062:web:3520e4201f05312957dd3f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Keep track of current slide for each slider
let hotTakesCurrentSlide = 0;
let trendingCurrentSlide = 0;

// Get elements for Hot Takes slider
const hotTakesSliderTrack = document.getElementById("sliderTrack");
const hotTakesDotsContainer = document.querySelector("#hottakes .slider-dots"); // Correctly targets the dots for hot takes
const hotTakesPrevBtn = document.querySelector("#hottakes .prev-btn");
const hotTakesNextBtn = document.querySelector("#hottakes .next-btn");

// Get elements for New & Trendy slider
const trendingSliderTrack = document.getElementById("trendingSlider");
const trendingDotsContainer = document.querySelector("#newTrendy .slider-dots"); // Correctly targets the dots for new & trendy
const trendingPrevBtn = document.querySelector("#newTrendy .prev-btn");
const trendingNextBtn = document.querySelector("#newTrendy .next-btn");

async function fetchPosts() {
    try {
        const snapshot = await getDocs(collection(db, "posts"));
        const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Separate posts by category
        const hotTakesPosts = allPosts.filter(post => post.category === 'hot-takes');
        const trendingPosts = allPosts.filter(post => post.category === 'new-trendy');

        if (hotTakesPosts.length) {
            // Pass the correct dots container directly
            initSlider(hotTakesPosts, hotTakesSliderTrack, hotTakesDotsContainer, hotTakesPrevBtn, hotTakesNextBtn, 'hotTakes');
        } else {
            showError("No hot takes posts found", hotTakesSliderTrack);
        }

        if (trendingPosts.length) {
            // Pass the correct dots container directly
            initSlider(trendingPosts, trendingSliderTrack, trendingDotsContainer, trendingPrevBtn, trendingNextBtn, 'trending');
        } else {
            showError("No new & trendy posts found", trendingSliderTrack);
        }

    } catch (err) {
        console.error("Error fetching posts:", err);
        showError("Failed to load posts", hotTakesSliderTrack); // Fallback for hot takes
        showError("Failed to load posts", trendingSliderTrack); // Fallback for trending
    }
}

function initSlider(postsArray, trackElement, dotsElement, prevButton, nextButton, sliderType) {
    renderPosts(postsArray, trackElement, dotsElement, sliderType);
    // Pass the correct dotsElement to setupSliderEvents
    setupSliderEvents(postsArray, trackElement, dotsElement, prevButton, nextButton, sliderType);
    updateSlider(postsArray, trackElement, dotsElement, sliderType === 'hotTakes' ? hotTakesCurrentSlide : trendingCurrentSlide);
}

function renderPosts(postsArray, trackElement, dotsElement, sliderType) {
    trackElement.innerHTML = '';
    dotsElement.innerHTML = '';

    postsArray.forEach((post, index) => {
        const slide = document.createElement('div');
        slide.className = `post ${sliderType === 'trending' ? 'trending-post' : ''}`;
        slide.innerHTML = `
            <a href="post-detail.html?id=${post.id}&category=${post.category}" class="post-link"> <!-- Updated link -->
                <div class="mypostimg">
                    ${post.imageUrl ? `<img src="${post.imageUrl}" alt="${post.title}">` : ''}
                    <div class="category-badge">${sliderType === 'trending' ? 'TRENDING' : 'HOT'}</div>
                </div>
                <div class="mypostcontent">
                    <h2>${post.title}</h2>
                    <p>${post.content.substring(0, 120)}...</p> <!-- Shorten content for preview -->
                    ${post.genre ? `<p><strong>Genre:</strong> ${post.genre}</p>` : ''}
                    <span class="readfull">Read full &rarr;</span>
                </div>
            </a>
            <div class="postactions">
                <button class="likebtn">${sliderType === 'trending' ? '❤️ Like' : '❤️ Like'}</button>
                <button class="commentbtn">💬 Discuss</button>
            </div>
        `;
        trackElement.appendChild(slide);

        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.dataset.index = index;
        dot.addEventListener('click', () => {
            if(sliderType === 'hotTakes') {
                hotTakesCurrentSlide = index;
            } else {
                trendingCurrentSlide = index;
            }
            updateSlider(postsArray, trackElement, dotsElement, index);
        });
        dotsElement.appendChild(dot);
    });
}

function setupSliderEvents(postsArray, trackElement, dotsElement, prevButton, nextButton, sliderType) {
    prevButton.addEventListener('click', () => navigate(postsArray, trackElement, dotsElement, -1, sliderType));
    nextButton.addEventListener('click', () => navigate(postsArray, trackElement, dotsElement, 1, sliderType));

    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(() => {
            updateSlider(postsArray, trackElement, dotsElement, sliderType === 'hotTakes' ? hotTakesCurrentSlide : trendingCurrentSlide);
        }, 100);
    });

    let startX = 0;
    let isDragging = false;

    trackElement.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    trackElement.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const deltaX = e.touches[0].clientX - startX;
        if (Math.abs(deltaX) > 50) {
            navigate(postsArray, trackElement, dotsElement, deltaX > 0 ? -1 : 1, sliderType);
            isDragging = false;
        }
    });

    trackElement.addEventListener('touchend', () => {
        isDragging = false;
    });
}

function navigate(postsArray, trackElement, dotsElement, direction, sliderType) {
    let currentSlide;
    if (sliderType === 'hotTakes') {
        currentSlide = hotTakesCurrentSlide;
    } else {
        currentSlide = trendingCurrentSlide;
    }

    currentSlide += direction;
    if (currentSlide >= postsArray.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = postsArray.length - 1;

    if (sliderType === 'hotTakes') {
        hotTakesCurrentSlide = currentSlide;
    } else {
        trendingCurrentSlide = currentSlide;
    }

    updateSlider(postsArray, trackElement, dotsElement, currentSlide);
}

function updateSlider(postsArray, trackElement, dotsElement, currentSlideIndex) {
    if (!trackElement.children.length) return;

    const slideWidth = trackElement.children[0].offsetWidth + 20; 
    const newTransform = -currentSlideIndex * slideWidth;
    trackElement.style.transform = `translateX(${newTransform}px)`;

    Array.from(dotsElement.children).forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlideIndex);
    });
}

function showError(msg, targetElement) {
    targetElement.innerHTML = `<div class="error" style="text-align: center; padding: 20px; color: red;">${msg}</div>`;
}

document.addEventListener('DOMContentLoaded', fetchPosts);


// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navItems = document.getElementById('navItems');
    const dropdowns = document.querySelectorAll('.dropdown');

    // Toggle mobile menu
    hamburger.addEventListener('click', function(e) {
        e.preventDefault();
        navItems.classList.toggle('active');
        this.classList.toggle('fa-times');
        this.classList.toggle('fa-bars');
    });

    // Handle dropdown menus on mobile
    dropdowns.forEach(function(dropdown) {
        const link = dropdown.querySelector('a');

        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdown.classList.toggle('active');
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('nav') && window.innerWidth <= 768) {
            navItems.classList.remove('active');
            hamburger.classList.remove('fa-times');
            hamburger.classList.add('fa-bars');
            dropdowns.forEach(d => d.classList.remove('active'));
        }
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-items a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                navItems.classList.remove('active');
                hamburger.classList.remove('fa-times');
                hamburger.classList.add('fa-bars');
            }
        });
    });
});
