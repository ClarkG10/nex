const orgType = localStorage.getItem("type");
const token = localStorage.getItem("token");

function setRouter() {
    const currentPath = window.location.pathname;

    switch (currentPath) {
        case `/`:
        case `/index.html`:
        case `/signupCustomer.html`:
        case `/signupSeller.html`:
            if (orgType === "Customer") {
                window.location.pathname = `/home.html`;
            } else if (orgType === "Retail") {
                window.location.pathname = `/storeInventory.html`;
            } else if (orgType === "Vendor") {
                window.location.pathname = `/vendorProducts.html`;
            }
            break;

        case `/storeInventory.html`:
        case `/storeReorderRequests.html`:
        case `/sales.html`:
        case `/orders.html`:
            if (token === null) {
                window.location.pathname = `/index.html`;
            } else if (orgType === "Vendor") {
                window.location.pathname = `/vendorProducts.html`;
            }
            break;

        case `/vendorProducts.html`:
        case `/vendorReorderRequests.html`:
            if (token === null) {
                window.location.pathname = `/index.html`;
            } else if (orgType === "Retail") {
                window.location.pathname = `/storeInventory.html`;
            }
            break;
        
        case `/checkout.html`:
        case `/orderConfirmation.html`:
            if (token === null) {
                window.location.pathname = `/index.html`;
            }
            break;
            
        default:
            break;
    }
}

export { setRouter };
