import { backendURL, headers, logout, userlogged } from "../utils/utils.js";

userlogged();
logout();
async function getCheckoutItems() {
    const getCartItems = document.getElementById("getCartItems");
    const getInformation = document.getElementById("getInformation");
    const totalElement = document.getElementById("total");
    const urlParams = new URLSearchParams(window.location.search);
    const cartId = urlParams.get("cart_id");

    const cartResponse = await fetch(backendURL + "/api/carts/by-store", { headers });
    const productsResponse = await fetch(backendURL + "/api/product/all", { headers });
    const profileResponse = await fetch(backendURL + "/api/profile/show", { headers });

    if (!cartResponse.ok) throw new Error("Can't fetch cart data");
    if (!productsResponse.ok) throw new Error("Can't fetch product data");
    if (!profileResponse.ok) throw new Error("Can't fetch profile data");

    const cartData = await cartResponse.json();
    const productsData = await productsResponse.json();
    const profileData = await profileResponse.json();

    console.log(cartData)

    const cart = cartData.find(item => item.id == cartId);
    let cartItemHTML = "";
    let finalTotal = 0;

    cart.items.forEach(item => {
        cartItemHTML += getItemHTML(item, productsData);
        finalTotal += parseFloat(item.price) * parseInt(item.quantity);
    });

    getCartItems.innerHTML = cartItemHTML;

    totalElement.innerHTML = `Total: Php ${finalTotal.toFixed(2)}`;

    placeOrder.innerHTML = `<div class="d-flex justify-content-end align-items-end">
          <a href="orderConfirmation.html"
            ><button class="btn bg text-white">Place Order</button></a
          >
        </div>`

    getInformation.innerHTML = `
      <div class="row">
        <div class="col-2 fw-bold">
          ${profileData.first_name} ${profileData.last_name} <br />
          ${profileData.phone_number}
        </div>
        <div class="col-9">${profileData.address}</div>
      </div>`;
}

function getItemHTML(item, productsData) {
    const product = productsData.find(p => p.product_id === item.product_id);

    return `
    <div class="col-6 text-start mt-2">
        <img
          class="border-violet-nohover me-2"
          src="${product.image_path ? `${backendURL}/storage/${product.image_path}` : `src/imgs/clark.jpg`}"
          alt="${product.product_name}"
          width="80px"
          style="aspect-ratio: 1/1 !important"
        />
        <span>${product.product_name}</span>
    </div>
    <div class="col-2 mt-4">Php ${item.price}</div>
    <div class="col-2 mt-4">${item.quantity}</div>
    <div class="col-2 mt-4 text-end">Php ${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</div>`;
}

getCheckoutItems();
