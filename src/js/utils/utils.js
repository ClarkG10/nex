import { setRouter } from "../routes/router.js";

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

        if (profileData?.business_type == 'Store') {
            localStorage.setItem('type', 'Store');
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

async function userlogged(){
    const profileResponse = await fetch(backendURL + '/api/profile/show', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    });

    if (!profileResponse.ok) {
        throw new Error('Failed to fetch user data');
    }

    const profileData = await profileResponse.json();
    if (profileData?.business_type == 'Store') {
        document.getElementById("business_id").value = profileData.id
    } else if (profileData?.business_type == 'Vendor') {
        document.getElementById("business_id").value = profileData.id
    }
}

async function logout(){
    const btn_logout = document.getElementById("btn_logout");

    btn_logout.onclick = async () => {
    
    const logoutResponse = await fetch(backendURL + "/api/logout", { headers }); 

    if(!logoutResponse.ok) throw new Error(`HTTP error! status: ${logoutResponse.status}`);
        
    if(logoutResponse.ok){
        localStorage.clear();
        window.location.pathname = "/index.html";
    }
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