function enableEditing() {
    document.getElementById("nameInput").disabled = false;
    document.getElementById("emailInput").disabled = false;
    document.getElementById("phoneInput").disabled = false;
    document.getElementById("passwordInput").disabled = false;
    document.getElementById("countryCode").disabled = false;
    
    document.querySelector(".edit-btn").style.display = "none";
    document.querySelector(".save-btn").style.display = "block";
}

function saveProfile() {
    let name = document.getElementById("nameInput").value;
    let email = document.getElementById("emailInput").value;
    let countryCode = document.getElementById("countryCode").value;
    let phone = document.getElementById("phoneInput").value;
    let password = document.getElementById("passwordInput").value;

    // Store data locally (for demo, real app should use a backend)
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPhone", countryCode + " " + phone);
    localStorage.setItem("userPassword", password);

    alert("Profile updated successfully!");

    // Disable inputs again
    document.getElementById("nameInput").disabled = true;
    document.getElementById("emailInput").disabled = true;
    document.getElementById("phoneInput").disabled = true;
    document.getElementById("passwordInput").disabled = true;
    document.getElementById("countryCode").disabled = true;

    document.querySelector(".edit-btn").style.display = "block";
    document.querySelector(".save-btn").style.display = "none";
}

function uploadProfilePic() {
    const file = document.getElementById("fileInput").files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("profilePic").src = e.target.result;
            localStorage.setItem("profilePic", e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// Load saved profile data
window.onload = function () {
    if (localStorage.getItem("userName")) {
        document.getElementById("nameInput").value = localStorage.getItem("userName");
    }
    if (localStorage.getItem("userEmail")) {
        document.getElementById("emailInput").value = localStorage.getItem("userEmail");
    }
    if (localStorage.getItem("userPhone")) {
        document.getElementById("phoneInput").value = localStorage.getItem("userPhone").split(" ")[1];
        document.getElementById("countryCode").value = localStorage.getItem("userPhone").split(" ")[0];
    }
    if (localStorage.getItem("profilePic")) {
        document.getElementById("profilePic").src = localStorage.getItem("profilePic");
    }
};
