import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, query, where, limit, startAfter, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

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

// Get specific elements for the Recommendations section (UPDATED IDs)
const featuredRecommendationPost = document.getElementById('featuredRecommendationPost');
const smallRecommendationPostsGrid = document.getElementById('smallRecommendationPostsGrid');
const recommendationSidebar = document.getElementById('recommendationSidebar');
const mangaReadsList = recommendationSidebar.querySelector('.manga-reads-list'); // More specific selector
const categoryTabs = document.querySelector('#recommendations-section .category-tabs'); // More specific selector
const recommendationLoadMoreBtn = document.getElementById('recommendationLoadMoreBtn');

// Pagination variables
const POSTS_PER_LOAD = 5; // One featured, four small
let lastVisible = null;
let currentCategory = 'All'; // Default category

// Function to calculate time ago (simple approximation)
function timeAgo(timestamp) {
    if (!timestamp) return 'N/A';
    const now = new Date();
    // Ensure timestamp is a Firebase Timestamp object before calling toDate()
    const postDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp); 
    const seconds = Math.floor((now - postDate) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval) + " years ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " months ago";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " days ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " hours ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " minutes ago";
    }
    return Math.floor(seconds) + " seconds ago";
}

async function fetchAndRenderRecommendationPosts(category, append = false) {
    console.log(`[Recommendations] Fetching posts for category: ${category}, append: ${append}`);
    try {
        let postsQuery = collection(db, "posts");

        // Filter by category 'recommendations' first
        postsQuery = query(postsQuery, where("category", "==", "recommendations"));
        console.log("[Recommendations] Querying for 'recommendations' category.");

        // Then, if a specific genre is selected (and not 'All'), filter by genre
        if (category && category !== 'All') {
            postsQuery = query(postsQuery, where("genre", "==", category));
            console.log(`[Recommendations] Further filtering by genre: ${category}`);
        }

        // Removed orderBy('timestamp', 'desc') from Firestore query to avoid index error
        postsQuery = query(postsQuery, limit(POSTS_PER_LOAD)); 

        if (append && lastVisible) {
            postsQuery = query(postsQuery, startAfter(lastVisible));
            console.log("[Recommendations] Appending posts, starting after lastVisible.");
        }

        const snapshot = await getDocs(postsQuery);
        let fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp }));
        
        // Sort client-side after fetching to avoid index error
        fetchedPosts.sort((a, b) => {
            const timeA = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate().getTime() : 0;
            const timeB = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate().getTime() : 0;
            return timeB - timeA; // Descending order
        });

        console.log(`[Recommendations] Fetched ${fetchedPosts.length} recommendation posts.`);
        console.log("[Recommendations] Fetched Posts Data:", fetchedPosts);

        // Clear content only if not appending
        if (!append) {
            featuredRecommendationPost.innerHTML = '';
            smallRecommendationPostsGrid.innerHTML = '';
            console.log("[Recommendations] Cleared existing content (not appending).");
        }

        if (fetchedPosts.length > 0) {
            // Featured Post
            const featuredPost = fetchedPosts[0];
            const featuredPostHTML = `
                <a href="post-detail.html?id=${featuredPost.id}&category=recommendations" class="post-link"> <!-- Updated link -->
                    <div class="post-image-container">
                        <img src="${featuredPost.imageUrl || 'https://placehold.co/600x400/cccccc/333333?text=No+Image'}" alt="${featuredPost.title}" class="post-image">
                        <span class="category-tag">${featuredPost.genre || 'Uncategorized'}</span>
                    </div>
                    <div class="post-info">
                        <span class="read-time">${timeAgo(featuredPost.timestamp)}</span>
                        <h2 class="post-title">${featuredPost.title}</h2>
                        <p class="post-excerpt">${featuredPost.content.substring(0, 150)}...</p>
                        <span class="read-more">Read more &rarr;</span>
                    </div>
                </a>
            `;
            featuredRecommendationPost.innerHTML = featuredPostHTML;
            console.log("[Recommendations] Rendered featured post:", featuredPost.title);

            // Small Posts
            const smallPosts = fetchedPosts.slice(1);
            smallPosts.forEach(post => {
                const smallPostHTML = `
                    <article class="small-post-card">
                        <a href="post-detail.html?id=${post.id}&category=recommendations" class="post-link"> <!-- Updated link -->
                            <div class="post-image-container">
                                <img src="${post.imageUrl || 'https://placehold.co/300x200/cccccc/333333?text=No+Image'}" alt="${post.title}" class="post-image">
                                <span class="category-tag">${post.genre || 'Uncategorized'}</span>
                            </div>
                            <div class="post-info">
                                <span class="read-time">${timeAgo(post.timestamp)}</span>
                                <h3 class="post-title">${post.title}</h3>
                                <span class="read-more">Read more &rarr;</span>
                            </div>
                        </a>
                    </article>
                `;
                smallRecommendationPostsGrid.insertAdjacentHTML('beforeend', smallPostHTML);
                console.log("[Recommendations] Rendered small post:", post.title);
            });

            lastVisible = snapshot.docs[snapshot.docs.length - 1];
            console.log("[Recommendations] lastVisible set.");
        } else if (!append) {
            featuredRecommendationPost.innerHTML = '<p style="text-align: center; color: #555;">No posts found in this category.</p>';
            smallRecommendationPostsGrid.innerHTML = '';
            console.log("[Recommendations] No posts found, displaying message.");
        }

        // Show/hide load more button
        recommendationLoadMoreBtn.style.display = snapshot.docs.length === POSTS_PER_LOAD ? 'block' : 'none';
        console.log(`[Recommendations] Load more button display: ${recommendationLoadMoreBtn.style.display}`);

    } catch (error) {
        console.error("[Recommendations] Error fetching or rendering recommendation posts:", error);
        if (!append) {
            featuredRecommendationPost.innerHTML = '<p style="text-align: center; color: red;">Failed to load recommendations. Please try again later.</p>';
        }
        recommendationLoadMoreBtn.style.display = 'none';
    }
}


// Event Listeners for Category Tabs
categoryTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab')) {
        console.log(`[Recommendations] Category tab clicked: ${e.target.dataset.category}`);
        // Remove active class from all tabs within this section
        categoryTabs.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        // Add active class to clicked tab
        e.target.classList.add('active');

        currentCategory = e.target.dataset.category;
        lastVisible = null; // Reset pagination when category changes
        fetchAndRenderRecommendationPosts(currentCategory); // Fetch new posts for the selected category
    }
});

// Event Listener for Load More button
recommendationLoadMoreBtn.addEventListener('click', () => {
    console.log("[Recommendations] Load More button clicked.");
    fetchAndRenderRecommendationPosts(currentCategory, true); // Fetch more posts, appending them
});

// Initial fetch when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Recommendations] DOMContentLoaded - Initial fetch for recommendations.");
    fetchAndRenderRecommendationPosts(currentCategory);
    renderMangaReads(); // Ensure manga reads are also fetched on DOMContentLoaded
});

// Function to render Manga Reads List - now fetches from 'posts' collection with category 'manga'
async function renderMangaReads() {
    console.log("[Manga Reads] Fetching manga reads.");
    try {
        // Query the 'posts' collection, filtering by category 'manga'
        // Removed orderBy('timestamp', 'desc') from Firestore query to avoid index error
        const mangaQuery = query(collection(db, "posts"), where("category", "==", "manga"), limit(5)); 
        const snapshot = await getDocs(mangaQuery);
        let fetchedManga = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort client-side after fetching to avoid index error
        fetchedManga.sort((a, b) => {
            const timeA = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate().getTime() : 0;
            const timeB = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate().getTime() : 0;
            return timeB - timeA; // Descending order
        });

        console.log(`[Manga Reads] Fetched ${fetchedManga.length} manga posts.`);
        console.log("[Manga Reads] Fetched Manga Data:", fetchedManga);

        mangaReadsList.innerHTML = ''; // Clear existing
        if (fetchedManga.length === 0) { // Check length of sorted array
            mangaReadsList.innerHTML = '<p>No top manga reads available.</p>';
            console.log("[Manga Reads] No manga posts found, displaying message.");
            return;
        }
        fetchedManga.forEach(manga => {
            const mangaItemHTML = `
                <div class="manga-item">
                    <img src="${manga.imageUrl || 'https://placehold.co/50x50/cccccc/333333?text=Manga'}" alt="${manga.title}" class="manga-image">
                    <div class="manga-info">
                        <h4>${manga.title}</h4>
                        <p>${manga.genre || 'Manga'}</p>
                    </div>
                </div>
            `;
            mangaReadsList.insertAdjacentHTML('beforeend', mangaItemHTML);
            console.log("[Manga Reads] Rendered manga item:", manga.title);
        });
    } catch (error) {
        console.error("[Manga Reads] Error fetching manga reads:", error);
        mangaReadsList.innerHTML = '<p style="color: red;">Failed to load top manga reads.</p>';
    }
}
