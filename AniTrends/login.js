  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
  import { getAuth, signInWithEmailAndPassword, getRedirectResult, GoogleAuthProvider, signInWithPopup, FacebookAuthProvider   } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBs3qdrCTTlTBBUPFhs-9lotw7ww40RTGg",
    authDomain: "anitrends-1.firebaseapp.com",
    projectId: "anitrends-1",
    storageBucket: "anitrends-1.firebasestorage.app",
    messagingSenderId: "394108326062",
    appId: "1:394108326062:web:3520e4201f05312957dd3f",
    measurementId: "G-RC0KQD1KKB"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  
  const auth = getAuth(app);
  auth.languageCode = 'en';
  const provider = new GoogleAuthProvider();
  const googleLogin = document.getElementById('googleBtn');
    googleLogin.addEventListener('click', (e) => {
        signInWithPopup(auth, provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            alert("Signed in successfully");
            // ...
            window.location.href = "loggedIn.html";

        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            // ...
        });
    });


  //submit button
  const submit = document.getElementById('Submit');
  //add event listener to submit button
  submit.addEventListener("click", (e) => {
    e.preventDefault();

    //inputs
  const email = document.getElementById('Email').value;
  const password = document.getElementById('Password').value;


  signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed in
    const user = userCredential.user;
    alert("Signed up successfully");
    // ...
    window.location.href = "loggedIn.html";
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    alert(errorMessage);
    // ..
  });

  })
//end submit button


