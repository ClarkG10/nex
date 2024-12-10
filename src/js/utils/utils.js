import { setRouter } from "../router/router.js";

setRouter();

const backendURL = 'http://ite19-backend.test';

const headers = {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Accept': 'application/json',
};

async function determineUserAccess() {
    try {
        const profileResponse = await fetch(backendURL + '/api/profile/show', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (!profileResponse.ok) {
            throw new Error('Failed to fetch user data');
        }

        const profileData = await profileResponse.json();
        console.log('User profile:', profileData);

        if (profileData?.business_type == 'Retail') {
            localStorage.setItem('type', 'Retail');
            window.location.pathname = '/storeInventory.html';
        } else if (profileData?.business_type == 'Vendor') {
            localStorage.setItem('type', 'Vendor');
            window.location.pathname = '/vendorProducts.html';
        } else if (profileData?.role == "Customer") {
            localStorage.setItem('type', 'Customer');
            window.location.pathname = '/home.html';
        }
    } catch (error) {
        console.error('Error fetching user data');
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
}

async function userlogged() {
    if (localStorage.getItem("token")) {
        const loggedIn = document.getElementById("loggedIn");

        const profileResponse = await fetch(backendURL + '/api/profile/show', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (!profileResponse.ok) {
            throw new Error('Failed to fetch user data');
        }

        const profileData = await profileResponse.json();
        if (profileData?.business_type == 'Retail' || profileData?.business_type == 'Vendor') {
            document.getElementById("business_id").value = profileData.id;
        }

        let html = "";
        let hasLoggedIn = false;

        if (profileData?.role == 'Customer') {
            hasLoggedIn = true;
            html = `
                <!-- Logged-in -->
                <img
                    class="rounded-circle mx-2 border"
                    style="aspect-ratio: 1/1"
                    src="${profileData.image_path ? backendURL + '/storage/' + profileData.image_path : 'src/imgs/NEX1.png'}"
                    alt="User"
                    width="30px"
                />
                <button type="button" class="btn bg text-white rounded-3 mx-2" id="btn_logout">Logout</button>
            `;
        }

        if (!hasLoggedIn) {
            html = `
                <!-- Login button -->
                <a href="index.html" class="text-decoration-none">
                    <button class="btn bg text-white rounded-3 mx-2">Login</button>
                </a>
            `;
        }

        loggedIn.innerHTML = html;

        // Initialize logout functionality
        logout();
    }
}


async function logout() {
    const btn_logout = document.getElementById("btn_logout");

    if (btn_logout) {
        btn_logout.addEventListener("click", async () => {
            btn_logout.disabled = true;
            try {
                const logoutResponse = await fetch(backendURL + "/api/logout", {
                    headers,
                });

                if (!logoutResponse.ok) {
                    throw new Error(`Logout failed: ${logoutResponse.statusText}`);
                }

                localStorage.clear();
                window.location.href = "/index.html"; 
            } catch (error) {
                console.error("Error during logout:", error);
                alert("Failed to logout. Please try again.");
            }
        });
    }
}


function hasThreeMinutesPassed(timestamp) {
    const eventTime = new Date(timestamp); 
    const currentTime = new Date();  
    
    const timeDifference = currentTime - eventTime;

    return timeDifference >= 3 * 60 * 1000;
}


export {
    headers,
    backendURL,
    determineUserAccess,
    userlogged,
    hasThreeMinutesPassed,
    logout,
}