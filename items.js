document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Fetch items from the backend
        const itemsResponse = await fetch("http://localhost:5000/get-items");
        const items = await itemsResponse.json();

        const itemsContainer = document.getElementById("itemsContainer");
        itemsContainer.innerHTML = items.map(item => `
            <div class="item-card">
                <h3>${item.name}</h3>
                <img src="uploads/${item.image}" alt="${item.name}" width="150">
                <p><strong>Description:</strong> ${item.description}</p>
                <p><strong>Price:</strong> $${item.price}</p>
            </div>
        `).join("");

        // Fetch ads from the backend
        const adsResponse = await fetch("http://localhost:5000/get-ads");
        const ads = await adsResponse.json();

        const adsContainer = document.getElementById("adsContainer");
        adsContainer.innerHTML = ads.map(ad => `
            <div class="ad-card">
                <h3>${ad.title || "No Title"}</h3>
                <img src="uploads/${ad.images[0] || 'placeholder.jpg'}" alt="${ad.title}" width="150">
                <p><strong>Category:</strong> ${ad.category || "Not Provided"}</p>
                <p><strong>Description:</strong> ${ad.description || "No Description"}</p>
                <p><strong>Brand:</strong> ${ad.brand || "Not Provided"}</p>
                <p><strong>Condition:</strong> ${ad.condition || "Not Provided"}</p>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error fetching data:", error);
    }
});
