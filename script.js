document.addEventListener("DOMContentLoaded", function() {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");
    const content = document.getElementById("content");

    // Sidebar Toggle Function
    menuToggle.addEventListener("click", function() {
        sidebar.classList.toggle("open");
        content.classList.toggle("open");
    });

    // Close sidebar when clicking outside
    document.addEventListener("click", function(event) {
        if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            sidebar.classList.remove("open");
            content.classList.remove("open");
        }
    });

    // Load correct section on page load
    const hash = window.location.hash.substring(1);
    loadSection(hash || 'home');

    // Handle browser back/forward buttons
    window.onpopstate = function(event) {
        loadSection(event.state?.section || 'home');
    };

    // Load saved profile picture and data
    loadProfile();
});

// Function to navigate and update URL
function navigate(section) {
    window.history.pushState({ section }, '', `#${section}`);
    loadSection(section);
}

// Function to dynamically load sections
function loadSection(section) {
    const content = document.getElementById('content');

    const sections = {
        home: `<h2>Home</h2><p>Welcome to Rent It!</p>`,
        payment: `<h2>Payment&Transcation</h2><p>Manage your payments here.</p>`,
        reviews: `<h2>Reviews</h2><p>See what others are saying.</p>`,
        notifications: `<h2>Notifications</h2><p>Check your latest updates.</p>`,
        'rental-agreement': `<h2>Rental Agreement</h2><p>View your rental agreements.</p>`,
        help: `<h2>Help</h2><p>Need assistance? Contact support.</p>`,
        settings: `<h2>Settings</h2><p>Update your account settings here.</p>`
    };

    content.innerHTML = sections[section] || `<h2>404 Not Found</h2><p>Section not found.</p>`;
}

// Logout function
function logout() {
    alert("Logging out...");
    localStorage.clear();
    window.location.href = "login.html";
}

// Function to Upload Profile Picture
function uploadProfilePic() {
    const newPic = prompt("Enter new profile image URL:");
    if (newPic) {
        document.getElementById("profile-pic").src = newPic;
        localStorage.setItem("profilePic", newPic);
    }
}

// Function to Save Profile Changes
function saveChanges() {
    const profileData = {
        firstName: document.getElementById("first-name").value.trim(),
        lastName: document.getElementById("last-name").value.trim(),
        username: document.getElementById("username").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        countryCode: document.getElementById("country-code").value,
        birthDate: document.getElementById("birth-date").value,
        gender: document.getElementById("gender").value
    };

    if (!profileData.firstName || !profileData.email) {
        alert("First Name and Email are required.");
        return;
    }

    localStorage.setItem("profileData", JSON.stringify(profileData));
    alert("Profile updated successfully!");
}

// Load saved profile data
function loadProfile() {
    const savedProfile = localStorage.getItem("profileData");
    if (savedProfile) {
        const data = JSON.parse(savedProfile);
        document.getElementById("first-name").value = data.firstName;
        document.getElementById("last-name").value = data.lastName;
        document.getElementById("username").value = data.username;
        document.getElementById("email").value = data.email;
        document.getElementById("phone").value = data.phone;
        document.getElementById("country-code").value = data.countryCode;
        document.getElementById("birth-date").value = data.birthDate;
        document.getElementById("gender").value = data.gender;
    }

    const savedPic = localStorage.getItem("profilePic");
    if (savedPic) {
        document.getElementById("profile-pic").src = savedPic;
    }
}

// Payment System
document.addEventListener("DOMContentLoaded", function () {
    const paymentOptions = document.querySelectorAll(".payment-option");
    const payButton = document.querySelector(".pay-button");
    const cardDetails = document.getElementById("card-details");
    
    paymentOptions.forEach(option => {
        option.addEventListener("click", function () {
            paymentOptions.forEach(opt => opt.classList.remove("selected"));
            this.classList.add("selected");

            if (this.dataset.method === "card") {
                cardDetails.style.display = "block";
            } else {
                cardDetails.style.display = "none";
            }

            payButton.style.display = "block";
            payButton.innerText = `Pay using ${this.querySelector(".payment-name").innerText}`;
        });
    });

    payButton.addEventListener("click", function () {
        const selectedMethod = document.querySelector(".payment-option.selected .payment-name").innerText;
    });
});

// FAQ Search
function searchFAQ() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    let items = document.querySelectorAll(".faq-item");

    items.forEach(item => {
        item.style.display = item.innerText.toLowerCase().includes(input) ? "block" : "none";
    });
}

// Toggle Filter
document.addEventListener("DOMContentLoaded", function() {
    const filterBtn = document.getElementById("filter-btn");
    const filterOptions = document.getElementById("filter-options");

    filterBtn.addEventListener("click", function() {
        filterOptions.style.display = (filterOptions.style.display === "block") ? "none" : "block";
        filterBtn.innerHTML = filterOptions.style.display === "block" ? "Filter ▲" : "Filter ▼";
    });
});

// Accordion Effect
document.querySelectorAll(".accordion").forEach(acc => {
    acc.addEventListener("click", function() {
        this.classList.toggle("active");
        const panel = this.nextElementSibling;
        panel.style.display = panel.style.display === "block" ? "none" : "block";
    });
});
function initMap() {
    let map = new google.maps.Map(document.getElementById("map"), {
        zoom: 5,
        center: { lat: 20.5937, lng: 78.9629 } // Default Location
    });

    let marker = new google.maps.Marker({
        map: map
    });

    // Get User's Current Location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                let userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                map.setCenter(userLocation);
                map.setZoom(15);
                marker.setPosition(userLocation);
                marker.setTitle("Your Location");
            },
            function () {
                alert("Geolocation permission denied.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}
function getAddressFromCoordinates(lat, lng) {
    let geocoder = new google.maps.Geocoder();
    let latLng = { lat: lat, lng: lng };

    geocoder.geocode({ location: latLng }, function (results, status) {
        if (status === "OK") {
            if (results[0]) {
                alert("Address: " + results[0].formatted_address);
            } else {
                alert("No address found.");
            }
        } else {
            alert("Geocoder failed due to: " + status);
        }
    });
}

// Example Usage: Convert User's Location to Address
navigator.geolocation.getCurrentPosition(function (position) {
    getAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
});

document.getElementById("postAdForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const brand = document.getElementById("brand").value;
    const age = document.getElementById("age").value;
    const price = document.getElementById("price").value;
    const location = document.getElementById("location").value;

    const adData = {
        title,
        category,
        description,
        brand,
        age,
        price,
        location
    };

    const response = await fetch("http://localhost:5000/post-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adData)
    });

    const result = await response.json();

    if (response.ok) {
        alert("Ad posted successfully!");
    } else {
        alert("Failed to post ad: " + result.message);
    }
});
