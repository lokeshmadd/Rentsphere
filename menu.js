function toggleMenu() {
    document.getElementById("leftMenu").classList.toggle("active");
}
// Check if user is logged in
function checkLogin() {
    if (localStorage.getItem("loggedIn") !== "true") {
        alert("Please log in first!");
        window.location.href = "login.html"; // Redirect to Login Page
    } else {
        document.getElementById("nameInput").value = localStorage.getItem("name");
        document.getElementById("emailInput").value = localStorage.getItem("email");
    }
}

// Enable Editing
function editProfile() {
    document.getElementById("nameInput").disabled = false;
}

// Save Edited Profile
function saveProfile() {
    let newName = document.getElementById("nameInput").value;
    localStorage.setItem("name", newName);
    alert("Profile Updated!");
}

// Logout Function
function logout() {
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html"; // Redirect to Login
}
