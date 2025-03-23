// Get the form element
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Get stored user data from localStorage
    const storedEmail = localStorage.getItem('userEmail');
    const storedPassword = localStorage.getItem('userPassword');

    // Check if entered credentials match the stored ones
    if (email === storedEmail && password === storedPassword) {
           } else {
        alert("Invalid credentials. Please try again.");
    }
});
