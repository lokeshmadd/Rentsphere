// Get the form element
document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const reenterPassword = document.getElementById('reenterPassword').value;

    // Check if the passwords match
    if (password !== reenterPassword) {
        alert("Passwords do not match. Please re-enter.");
        return;
    }

    // Basic validation for empty fields
    if (!email || !password || !reenterPassword) {
        alert("Please fill out all fields.");
        return;
    }

    // Simulate saving user data (this could be stored in localStorage or a database in a real application)
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userPassword', password);

    });
