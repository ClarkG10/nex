import { backendURL, headers, logout, userlogged } from "../utils/utils.js";

userlogged();
logout();
async function getCheckoutItems() {
    const getCartItems = document.getElementById("getCartItems");
    const getInformation = document.getElementById("getInformation");
    const totalElement = document.getElementById("total");
    const placeOrder = document.getElementById("placeOrder");
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
    let total = 0;

    cart.items.forEach(item => {
        cartItemHTML += getItemHTML(item, productsData);
        total += parseFloat(item.price) * parseInt(item.quantity);
    });

    finalTotal = parseFloat(total.toFixed(2)) + parseInt(15)

    getCartItems.innerHTML = cartItemHTML;

    totalElement.innerHTML = `Php ${finalTotal}`;

    placeOrder.innerHTML = `<div class="d-flex justify-content-end align-items-end">
    <button type="submit" class="btn bg text-white placeOrderButton" cart-id="${cartId}" customer-id="${cart.customer_id}" total-amount="${finalTotal}" store-id="${cart.store_id}" customer-address="${profileData.address}" ship-cost="${15}">Place Order</button>
        </div>`

    getInformation.innerHTML = `
      <div class="row">
        <div class="col-2 fw-bold">
          ${profileData.first_name} ${profileData.last_name} <br />
          ${profileData.phone_number}
        </div>
        <div class="col-9">${profileData.address}</div>
      </div>`;

      document.querySelectorAll(".placeOrderButton").forEach(button => {
        button.addEventListener("click", placeOrderButtonClick);
    });

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

function placeOrderButtonClick(e){
  const data = {
    cart_id: e.target.getAttribute("cart-id"),
    customer_id: e.target.getAttribute("customer-id"),
    total_amount: e.target.getAttribute("total-amount"),
    store_id: e.target.getAttribute("store-id"),
    shipping_address: e.target.getAttribute("customer-address"),
    shipping_cost: e.target.getAttribute("ship-cost")
  }
  console.log(data);
  placeOrder(data);
  }

  async function placeOrder(data) {

    const orderResponse = await fetch(backendURL + "/api/order", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      }  ,
      body: JSON.stringify(data),
    });

    if (!orderResponse.ok) throw new Error("Failed to place order");

    if(orderResponse.ok){
      updateCartStatus(data.cart_id);
      console.log("Order placed successfully");
    }
  }

  async function updateCartStatus(cartId){
    const updateCartResponse = await fetch(backendURL + `/api/carts/${cartId}/update-status`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      }
    });

    if (!updateCartResponse.ok) throw new Error("Failed to update cart status");

    console.log("Cart status updated successfully");
  }

getCheckoutItems();
