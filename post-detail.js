import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, where, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Your Firebase configuration (copy this from one of your existing Firebase-initialized JS files)
const firebaseConfig = {
    apiKey: "AIzaSyBs3qdrCTTlTBBUPFhs-9lotw7ww40RTGg",
    authDomain: "anitrends-1.firebaseapp.com",
    projectId: "anitrends-1",
    storageBucket: "anitrends-1.firebasestorage.app",
    messagingSenderId: "394108326062",
    appId: "1:394108326062:web:3520e4201f05312957dd3f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to format timestamp
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

// Function to fetch and render "More Reads" (related posts)
async function fetchAndRenderMoreReads(currentPostId, currentPostCategory) {
    const moreReadsContainer = document.getElementById('moreReads');
    moreReadsContainer.innerHTML = '<p>Loading related posts...</p>'; // Show loading message

    try {
        // Query posts from the same category, excluding the current post
        let q = query(
            collection(db, "posts"),
            where("category", "==", currentPostCategory),
            limit(5) // Fetch a few more than needed, then filter and take top X
        );

        const querySnapshot = await getDocs(q);
        let relatedPosts = [];
        querySnapshot.forEach((doc) => {
            if (doc.id !== currentPostId) { // Filter out the current post
                relatedPosts.push({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp });
            }
        });

        // Sort client-side by timestamp in descending order
        relatedPosts.sort((a, b) => {
            const timeA = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate().getTime() : 0;
            const timeB = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate().getTime() : 0;
            return timeB - timeA; // Descending order
        });

        // Take only the top 3 or 4 related posts for display
        relatedPosts = relatedPosts.slice(0, 4); 

        if (relatedPosts.length > 0) {
            moreReadsContainer.innerHTML = ''; // Clear loading message
            relatedPosts.forEach(post => {
                const postLink = document.createElement('a');
                postLink.href = `post-detail.html?id=${post.id}&category=${post.category}`;
                postLink.classList.add('related-post-item');
                postLink.innerHTML = `
                    <img src="${post.imageUrl || 'https://placehold.co/80x80/cccccc/333333?text=Post'}" alt="${post.title}">
                    <div class="related-post-info">
                        <h4>${post.title}</h4>
                        <p>${timeAgo(post.timestamp)}</p>
                    </div>
                `;
                moreReadsContainer.appendChild(postLink);
            });
        } else {
            moreReadsContainer.innerHTML = '<p>No related posts found in this category.</p>';
        }
    } catch (error) {
        console.error("Error fetching more reads:", error);
        moreReadsContainer.innerHTML = '<p style="color: red;">Failed to load related posts.</p>';
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    const postCategory = urlParams.get('category'); // 'hot-takes', 'new-trendy', or 'recommendations'

    const postTitleElement = document.getElementById('postTitle');
    const postMetaElement = document.getElementById('postMeta');
    const postImageElement = document.getElementById('postImage');
    const postBodyElement = document.getElementById('postBody');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Show loading indicator
    loadingIndicator.style.display = 'block';
    postTitleElement.textContent = 'Loading Post...';
    postMetaElement.innerHTML = '';
    postImageElement.src = 'https://placehold.co/800x400/cccccc/333333?text=Loading+Image';
    postBodyElement.innerHTML = '';

    if (!postId || !postCategory) {
        postTitleElement.textContent = "Invalid Post URL";
        postMetaElement.innerHTML = '<p>No post ID or category provided in the URL.</p>';
        postBodyElement.innerHTML = '<p>Please navigate to a post from the main page.</p>';
        loadingIndicator.style.display = 'none';
        return;
    }

    try {
        // Fetch the main post details
        const docRef = doc(db, "posts", postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const postData = docSnap.data();

            // Set document title
            document.title = postData.title + " - ANITRENDS";

            // Populate main post content
            postTitleElement.textContent = postData.title;
            postMetaElement.innerHTML = `
                <p><strong>Category:</strong> ${postData.genre || postData.category || 'Uncategorized'}</p>
                <p><strong>Published:</strong> ${timeAgo(postData.timestamp)}</p>
            `;
            postImageElement.src = postData.imageUrl || 'https://placehold.co/800x400/dddddd/000000?text=No+Image+Available';
            postImageElement.alt = postData.title;

            // NEW: Directly set innerHTML for raw HTML content
            // WARNING: This is vulnerable to XSS if input is not sanitized.
            postBodyElement.innerHTML = postData.content; 

            // After loading the main post, fetch and render related posts
            fetchAndRenderMoreReads(postId, postCategory);

        } else {
            postTitleElement.textContent = "Post Not Found";
            postMetaElement.innerHTML = '<p>The post you are looking for does not exist.</p>';
            postBodyElement.innerHTML = '';
            postImageElement.style.display = 'none'; // Hide placeholder image if no post
        }
    } catch (error) {
        console.error("Error fetching post details:", error);
        postTitleElement.textContent = "Error Loading Post";
        postMetaElement.innerHTML = '<p style="color: red;">There was an error loading the post. Please try again later.</p>';
        postBodyElement.innerHTML = '';
        postImageElement.style.display = 'none';
    } finally {
        loadingIndicator.style.display = 'none'; // Hide loading indicator
    }
});
