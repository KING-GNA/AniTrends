import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

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

// Cloudinary configuration
const CLOUD_NAME = "dd955gpxp";
const UPLOAD_PRESET = "my_blog_uploads";

// Upload file to Cloudinary
const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            console.error("Cloudinary Error:", data.error.message);
            // Use a custom message box instead of alert
            displayMessage("Failed to upload image: " + data.error.message, 'error');
            throw new Error(data.error.message);
        }

        return data.secure_url;
    } catch (err) {
        console.error("Upload failed:", err.message);
        // Use a custom message box instead of alert
        displayMessage("Failed to upload image. Check console for details.", 'error');
        return "";
    }
};

// Function to display custom messages (replaces alert)
function displayMessage(message, type = 'info') {
    const messageBox = document.createElement('div');
    messageBox.textContent = message;
    messageBox.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        animation: fadeOut 5s forwards;
    `;

    if (type === 'success') {
        messageBox.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
        messageBox.style.backgroundColor = '#f44336';
    } else {
        messageBox.style.backgroundColor = '#2196F3';
    }

    document.body.appendChild(messageBox);

    // Define fadeOut animation
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = `
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
    `;
    document.head.appendChild(styleSheet);

    setTimeout(() => {
        messageBox.remove();
        styleSheet.remove(); // Clean up the style tag
    }, 5000);
}


// Function to handle form submissions for all categories
async function handlePostSubmit(e, category) {
    e.preventDefault();

    let postId, title, content, genre, imageFile, formId, postIdFieldId, titleFieldId, contentFieldId, genreFieldId, imageFieldId, submitButtonId;

    // Determine which form elements to use based on the category
    if (category === 'hot-takes') {
        formId = 'hotTakesForm';
        postIdFieldId = 'htPostId';
        titleFieldId = 'htTitle';
        contentFieldId = 'htContent';
        genreFieldId = 'htGenre';
        imageFieldId = 'htImage';
        submitButtonId = 'htSubmitButton';
    } else if (category === 'new-trendy') {
        formId = 'trendingForm';
        postIdFieldId = 'trPostId';
        titleFieldId = 'trTitle';
        contentFieldId = 'trContent';
        genreFieldId = null; // No genre for trending
        imageFieldId = 'trImage';
        submitButtonId = 'trSubmitButton';
    } else if (category === 'manga') {
        formId = 'mangaForm';
        postIdFieldId = 'mgPostId';
        titleFieldId = 'mgTitle';
        contentFieldId = 'mgContent';
        genreFieldId = 'mgGenre'; // Genre for manga
        imageFieldId = 'mgImage';
        submitButtonId = 'mgSubmitButton';
    } else if (category === 'recommendations') { // NEW: Recommendations Category
        formId = 'recommendationsForm';
        postIdFieldId = 'recPostId';
        titleFieldId = 'recTitle';
        contentFieldId = 'recContent';
        genreFieldId = 'recGenre'; // Genre for recommendations
        imageFieldId = 'recImage';
        submitButtonId = 'recSubmitButton';
    }

    // Get form values
    postId = document.getElementById(postIdFieldId).value;
    title = document.getElementById(titleFieldId).value;
    content = document.getElementById(contentFieldId).value;
    genre = genreFieldId ? document.getElementById(genreFieldId)?.value : null;
    imageFile = document.getElementById(imageFieldId).files[0];

    let imageUrl = "";
    if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
    }

    const postData = {
        title,
        content,
        category, // Store the category
        timestamp: new Date()
    };

    if (genre) {
        postData.genre = genre;
    }
    if (imageUrl) {
        postData.imageUrl = imageUrl;
    }

    try {
        if (postId) {
            // Update existing post
            const docRef = doc(db, "posts", postId);
            const updateData = { ...postData };
            // If no new image is selected, don't overwrite existing imageUrl
            if (!imageFile) {
                delete updateData.imageUrl;
            }
            await updateDoc(docRef, updateData);
            displayMessage(`${category === 'hot-takes' ? 'Hot Take' : category === 'new-trendy' ? 'Trending Post' : category === 'manga' ? 'Manga Post' : 'Recommendation Post'} updated successfully!`, 'success');
        } else {
            // Add new post
            await addDoc(collection(db, "posts"), postData);
            displayMessage(`${category === 'hot-takes' ? 'Hot Take' : category === 'new-trendy' ? 'Trending Post' : category === 'manga' ? 'Manga Post' : 'Recommendation Post'} published!`, 'success');
        }

        // Reset form and update UI
        document.getElementById(formId).reset();
        document.getElementById(postIdFieldId).value = "";
        document.getElementById(submitButtonId).textContent = `Publish ${category === 'hot-takes' ? 'Hot Take' : category === 'new-trendy' ? 'Mark as Trending' : category === 'manga' ? 'Manga Post' : 'Recommendation'}`;
        fetchPosts(); // Re-fetch and render posts
    } catch (err) {
        console.error("Error saving post:", err);
        displayMessage("Operation failed. See console for details.", 'error');
    }
}

// Fetch and render posts for all sections
async function fetchPosts() {
    const snapshot = await getDocs(collection(db, "posts"));
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter posts by category and render
    const hotTakesPosts = posts.filter(p => p.category === 'hot-takes');
    renderPostsSection(hotTakesPosts, 'hotTakesPosts', 'hot-takes');

    const trendingPosts = posts.filter(p => p.category === 'new-trendy');
    renderPostsSection(trendingPosts, 'trendingPosts', 'new-trendy');

    const mangaPosts = posts.filter(p => p.category === 'manga');
    renderPostsSection(mangaPosts, 'mangaPosts', 'manga');

    // NEW: Filter and render recommendations posts
    const recommendationsPosts = posts.filter(p => p.category === 'recommendations');
    renderPostsSection(recommendationsPosts, 'recommendationsPosts', 'recommendations');
}

function renderPostsSection(posts, containerId, category) {
    const container = document.getElementById(containerId);
    container.innerHTML = posts.map(post => `
        <div class="post-card">
            ${post.imageUrl ? `<img src="${post.imageUrl}" alt="${post.title}">` : ''}
            <div class="post-card-content">
                <h3>${post.title}</h3>
                <p>${post.content}</p>
                ${post.genre ? `<p>Genre: ${post.genre}</p>` : ''}
            </div>
            <div class="post-actions">
                <button class="edit-btn" onclick="editPost('${post.id}', '${category}')">Edit</button>
                <button class="delete-btn" onclick="deletePost('${post.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete post
window.deletePost = async function (postId) {
    // Replace confirm with a custom modal/message box
    const userConfirmed = await new Promise(resolve => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1001;
            text-align: center;
        `;
        modal.innerHTML = `
            <p>Are you sure you want to delete this post?</p>
            <button id="confirmDeleteBtn" style="background: red; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin-right: 10px; cursor: pointer;">Delete</button>
            <button id="cancelDeleteBtn" style="background: #ccc; color: black; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('confirmDeleteBtn').onclick = () => {
            modal.remove();
            resolve(true);
        };
        document.getElementById('cancelDeleteBtn').onclick = () => {
            modal.remove();
            resolve(false);
        };
    });

    if (userConfirmed) {
        try {
            await deleteDoc(doc(db, "posts", postId));
            displayMessage("Post deleted!", 'success');
            fetchPosts();
        } catch (err) {
            console.error("Error deleting post:", err);
            displayMessage("Failed to delete post. See console for details.", 'error');
        }
    }
};

// Edit post
window.editPost = async function (postId, category) {
    const docRef = doc(db, "posts", postId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        console.error("No such document!");
        displayMessage("Post not found for editing.", 'error');
        return;
    }

    const postData = docSnap.data();

    // Deactivate all content sections and tabs first
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('active');
    });

    // Determine which form to populate based on category and activate its section/tab
    if (category === 'hot-takes') {
        document.getElementById('htPostId').value = postId;
        document.getElementById('htTitle').value = postData.title;
        document.getElementById('htContent').value = postData.content;
        document.getElementById('htGenre').value = postData.genre || 'Action';
        document.getElementById('htSubmitButton').textContent = "Update Hot Take";
        document.getElementById('hot-takes').classList.add('active');
        document.querySelector('.tab[data-section="hot-takes"]').classList.add('active');

    } else if (category === 'new-trendy') {
        document.getElementById('trPostId').value = postId;
        document.getElementById('trTitle').value = postData.title;
        document.getElementById('trContent').value = postData.content;
        document.getElementById('trSubmitButton').textContent = "Update Trending Post";
        document.getElementById('new-trendy').classList.add('active');
        document.querySelector('.tab[data-section="new-trendy"]').classList.add('active');
    } else if (category === 'manga') {
        document.getElementById('mgPostId').value = postId;
        document.getElementById('mgTitle').value = postData.title;
        document.getElementById('mgContent').value = postData.content;
        document.getElementById('mgGenre').value = postData.genre || 'Action'; // Default if not set
        document.getElementById('mgSubmitButton').textContent = "Update Manga Post";
        document.getElementById('manga').classList.add('active');
        document.querySelector('.tab[data-section="manga"]').classList.add('active');
    } else if (category === 'recommendations') { // NEW: Handle recommendations edit
        document.getElementById('recPostId').value = postId;
        document.getElementById('recTitle').value = postData.title;
        document.getElementById('recContent').value = postData.content;
        document.getElementById('recGenre').value = postData.genre || 'Action'; // Default if not set
        document.getElementById('recSubmitButton').textContent = "Update Recommendation";
        document.getElementById('recommendations').classList.add('active');
        document.querySelector('.tab[data-section="recommendations"]').classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Initialize section tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('active');
        });
        tab.classList.add('active');
        document.getElementById(tab.dataset.section).classList.add('active');
    });
});

// Initial fetch of posts when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Form handlers - moved inside DOMContentLoaded
    // IMPORTANT: Ensure these elements exist in admin.html before attaching listeners
    // If an element is null, this line will cause the TypeError.
    // The previous admin.html update added the 'recommendationsForm'.
    const hotTakesForm = document.getElementById('hotTakesForm');
    if (hotTakesForm) hotTakesForm.addEventListener('submit', (e) => handlePostSubmit(e, 'hot-takes'));
    
    const trendingForm = document.getElementById('trendingForm');
    if (trendingForm) trendingForm.addEventListener('submit', (e) => handlePostSubmit(e, 'new-trendy'));
    
    const mangaForm = document.getElementById('mangaForm');
    if (mangaForm) mangaForm.addEventListener('submit', (e) => handlePostSubmit(e, 'manga'));
    
    const recommendationsForm = document.getElementById('recommendationsForm');
    if (recommendationsForm) recommendationsForm.addEventListener('submit', (e) => handlePostSubmit(e, 'recommendations')); 

    fetchPosts();
});
