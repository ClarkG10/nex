import { backendURL, headers, logout, userlogged } from "../utils/utils.js";

userlogged();
logout();

async function getCheckoutItems() {
  const getCartItems = document.getElementById("getCartItems");
  const getInformation = document.getElementById("getInformation");
  const totalElement = document.getElementById("total");
  const placeOrder = document.getElementById("placeOrder");
  const paymentElementContainer = document.getElementById("payment-element");
  const urlParams = new URLSearchParams(window.location.search);
  const cartId = urlParams.get("cart_id");

  try {
    const [cartResponse, productsResponse, profileResponse] = await Promise.all([
      fetch(`${backendURL}/api/carts/by-store`, { headers }),
      fetch(`${backendURL}/api/product/all`, { headers }),
      fetch(`${backendURL}/api/profile/show`, { headers }),
    ]);

    if (!cartResponse.ok) throw new Error("Can't fetch cart data");
    if (!productsResponse.ok) throw new Error("Can't fetch product data");
    if (!profileResponse.ok) throw new Error("Can't fetch profile data");

    const [cartData, productsData, profileData] = await Promise.all([
      cartResponse.json(),
      productsResponse.json(),
      profileResponse.json(),
    ]);

    const cart = cartData.find((item) => item.id == cartId);
    let cartItemHTML = "";
    let total = 0;

    cart.items.forEach((item) => {
      cartItemHTML += getItemHTML(item, productsData);
      total += parseFloat(item.price) * parseInt(item.quantity);
    });

    const finalTotal = parseFloat(total.toFixed(2)) + 15; // Add fixed shipping cost
    getCartItems.innerHTML = cartItemHTML;
    totalElement.innerHTML = `Php ${finalTotal}`;

    placeOrder.innerHTML = `
        <div class="d-flex justify-content-end align-items-end">
          <button type="submit" class="btn bg text-white placeOrderButton" 
            cart-id="${cartId}" 
            customer-id="${cart.customer_id}" 
            total-amount="${finalTotal}" 
            store-id="${cart.store_id}" 
            customer-address="${profileData.address}" 
            ship-cost="15">
            Place Order
          </button>
        </div>
      `;

    getInformation.innerHTML = `
      <div class="row">
        <div class="col-2 fw-bold">
          ${profileData.first_name} ${profileData.last_name} <br />
          ${profileData.phone_number}
        </div>
        <div class="col-9">${profileData.address}</div>
      </div>
    `;

    document.getElementById("paymentMethod").addEventListener("change", (e) => {
      if (e.target.value === "Online Payment") {
        initializeStripeElements(paymentElementContainer, cartId, cart.customer_id, finalTotal, cart.store_id, profileData.address);
      } else {
        paymentElementContainer.innerHTML = ""; // Clear Stripe elements if not selected
      }
    });

    document.querySelectorAll(".placeOrderButton").forEach((button) => {
      button.addEventListener("click", placeOrderButtonClick);
    });
  } catch (error) {
    console.error(error.message);
  }
}

function getItemHTML(item, productsData) {
  const product = productsData.find((p) => p.product_id === item.product_id);

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

async function initializeStripeElements(paymentElementContainer, cartId, customerId, finalTotal, storeId, address) {
  const stripe = Stripe("pk_test_51Qf3X1C2eei2IPwutJI91DZYLOra2Rug6RlP76lahOrr5VgItHnUYXtRCM8RfEYMOlEHT3zkGPhRi0my99dPfiHL00ESS9gq8u");

  const totalAmount = document.getElementById("total").innerText.replace("Php ", "").replace(",", "");

  try {
    const response = await fetch(`${backendURL}/api/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: totalAmount }),
    });

    const { clientSecret } = await response.json();
    if (!clientSecret) throw new Error("Failed to fetch client secret");

    const elements = stripe.elements({ clientSecret });
    const paymentElement = elements.create("payment");
    paymentElement.mount(paymentElementContainer);

    document.getElementById("paymentHeader").textContent = "Payment Details";
    document.getElementById("paymentHeader").classList.add("text-center", "bg-white", "rounded-2", "p-3", "mt-2", "fw-bold");

    document.getElementById("confirmPayment").classList.add("bg-white", "p-3", "mt-2");

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Confirm Payment";
    submitButton.classList.add("btn", "bg", "text-white", "placeOrderButton", "mt-3");
    submitButton.setAttribute("cart-id", cartId);
    submitButton.setAttribute("customer-id", customerId);
    submitButton.setAttribute("total-amount", finalTotal);
    submitButton.setAttribute("store-id", storeId);
    submitButton.setAttribute("customer-address", address);
    submitButton.setAttribute("ship-cost", "15");

    document.getElementById("placeOrder").classList.add("d-none");
    paymentElementContainer.appendChild(submitButton);

    submitButton.addEventListener("click", async (e) => {
      e.preventDefault();

      submitButton.textContent = "Processing...";
      submitButton.disabled = true;

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/cart.html",
        },
        redirect: "if_required",
      });

      if (error) {
        console.error(error.message);
        alert("Payment failed: " + error.message);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        alert("Payment successful!");
        submitButton.disabled = false;
        placeOrderButtonClick({ target: submitButton }, );
      } else {
        alert("Payment could not be completed. Please try again.");
      }
    });
  } catch (error) {
    console.error("Failed to initialize Stripe:", error.message);
  }
}

async function placeOrderButtonClick(e) {
  const paymentMethod = document.getElementById("paymentMethod").value;

  if (!paymentMethod) {
    alert("Please select a payment method");
    return;
  }

  const data = {
    cart_id: e.target.getAttribute("cart-id"),
    customer_id: e.target.getAttribute("customer-id"),
    total_amount: e.target.getAttribute("total-amount"),
    store_id: e.target.getAttribute("store-id"),
    shipping_address: e.target.getAttribute("customer-address"),
    shipping_cost: e.target.getAttribute("ship-cost"),
    payment_method: paymentMethod,
  };

  const orderConfirmationModal = new bootstrap.Modal(document.getElementById("orderConfirmationModal"));
  orderConfirmationModal.show();

    orderConfirmationModal.hide();
    await completeOrder(data);
}

async function completeOrder(data) {
  try {

    if(data.payment_method === "Online Payment"){
      data.status = "Accepted";
      storeAsSale(data.cart_id, data.payment_method)
    }

    const response = await fetch(`${backendURL}/api/order`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to place order");

    updateCartStatus(data.cart_id);

    } catch (error) {
    console.error(error.message);
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

async function storeAsSale(cartId, paymentMethod) {
  const cartResponse = await fetch(`${backendURL}/api/carts/show/${cartId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!cartResponse.ok) {
    const errorDetails = await cartResponse.text();
    throw new Error(`Failed to fetch cart data: ${errorDetails}`);
  }

  const cartData = await cartResponse.json();

  // console.log("Fetched Cart Data:", cartData);
  console.log("Fetched Cart Items:", cartData.items);

  const items = cartData.items;

  for (const item of items) {
    const saleData = {
      customer_id: cartData.customer_id,
      store_id: cartData.store_id,
      price: Number(item.price),
      product_id: item.product_id,
      quantity: Number(item.quantity),
      total_amount: Number(item.price) * Number(item.quantity),
      payment_method: paymentMethod,
    };

    console.log("Sending Sale Data:", saleData);

    const saleResponse = await fetch(`${backendURL}/api/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(saleData),
    });

    if (!saleResponse.ok) {
      const errorDetails = await saleResponse.text();
      throw new Error(`Failed to create sale data: ${errorDetails}`);
    }

    console.log("Sale data created successfully for product:", item.product_id);
  }
}


getCheckoutItems();
