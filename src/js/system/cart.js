import { backendURL, userlogged, headers, logout } from "../utils/utils.js";

userlogged();
logout();

async function getCart(){
    // const getCartByStore = document.getElementById('getByStoreItemsCart');

    const cartResponse = await fetch(backendURL + '/api/carts/by-store', { headers });
    const productsResponse = await fetch(backendURL + '/api/product/all', { headers });
    const storeResponse = await fetch(backendURL + '/api/user', { headers });

    const carts = await cartResponse.json();
    const products = await productsResponse.json();
    const stores = await storeResponse.json();

    if(!cartResponse.ok ||!productsResponse.ok ||!storeResponse.ok) throw new Error ("Request fetch failed");

    console.log(carts)

    let cartHTML = "", hasCart = false;
    carts.forEach(cart => {
        hasCart = true;
        const store = stores.find(store => store.id === cart.store_id);

        cartHTML += getCartHTML(cart, store, products);
    });

    if(!hasCart){
        cartHTML = `<div class="text-center bg-white rounded-2 p-4 mt-2"><p class="text-center">No items in your cart.</p></div>`;
    }

    getByStoreItemsCart.innerHTML = cartHTML;

    document.querySelectorAll(".subtractQuantity").forEach(button => {
        button.addEventListener("click", updateQuantityClick);
    });

    document.querySelectorAll(".addQuantity").forEach(button => {
        button.addEventListener("click", updateQuantityClick);
    });

    document.querySelectorAll(".deleteButton").forEach(button => {
        button.addEventListener("click", deleleClick);
    });
}

function getCartHTML(cart, store, products) {
    return `<div class="text-center bg-white rounded-2 p-3 mt-2">
            <div class="mb-2 p-2 rounded-1 text-start d-flex">
              <img
                src="src/icon/shop-v.png"
                alt=""
                width="20px"
                height="20px"
                class="me-2"
              />${store.business_name}
            </div>
            <!-- list of products by store -->
            <div class="row">
              ${getCartItems(cart.items, products)}
            </div>
            <!-- end product -->
            <div class="mt-2 d-flex justify-content-end align-items-end">
            <a href="checkout.html?cart_id=${encodeURIComponent(cart.id)}" class="text-decoration-none">
              <button class="btn bg text-white px-4">Checkout</button>
              </a>
            </div>
          </div>`;
  }
  

function getCartItems(cartItems, products) {
    let cartItemsHTML = "";
  
    for (let i = 0; i < cartItems.length; i++) {
      const cartItem = cartItems[i];
      const product = products.find(product => product.product_id === cartItem.product_id);
  
      // Handle case where product is not found
      if (!product) {
        console.error(`Product with ID ${cartItem.product_id} not found`);
        continue;
      }
  
      cartItemsHTML += `
        <div class="col-5 text-start mt-2">
          <img
            class="border-violet-nohover me-2"
            src="${product.image_path ? `${backendURL}/storage/${product.image_path}` : `src/imgs/clark.jpg`}"
            alt="${product.product_name}"
            width="80px"
            style="aspect-ratio: 1/1 !important"
          />
          <span>${product.product_name}</span>
        </div>
        <div class="col-1 mt-4">Php ${cartItem.price}</div>
        <div class="col-2 mt-4">
          <div id="updateQuantity${cartItem.id}">
            <button class="btn btn-sm bg text-white me-3 px-2 fw-bold subtractQuantity" data-id="${cartItem.id}" data-action="subtract">-</button>
            ${cartItem.quantity}
            <button class="btn btn-sm bg text-white ms-3 px-2 fw-bold addQuantity" data-id="${cartItem.id}" data-action="add">+</button>
          </div>
        </div>
        <div class="col-2 mt-4">Php ${(parseFloat(cartItem.price) * parseInt(cartItem.quantity)).toFixed(2)}</div>
        <div class="col-2 mt-4">
          <button class="text-danger border-0 bg-white deleteButton" data-id="${cartItem.id}">Delete</button>
        </div>`;
    }
  
    return cartItemsHTML;
  }

  function deleleClick(e) {
    const id = e.target.getAttribute("data-id");
    console.log(id);
    deleteItem(id);
}

  function updateQuantityClick(e) {
    const id = e.target.getAttribute("data-id");
    const action = e.target.getAttribute("data-action");
    console.log(id, action);
    updateQuantity(id, action);
}

async function updateQuantity(id, action) {
    try {
        const update = document.querySelectorAll(`#updateQuantity${id} button`);
        console.log(update);
        update[0].disabled = true;
        update[1].disabled = true;


        const response = await fetch(`${backendURL}/api/carts/${action}/${id}`, {
            method: "POST",
            headers: headers,
        });

        if (!response.ok) {
            const errorData = await response.json();
            await getCart();
            throw new Error(errorData.error || "Failed to update quantity");
        }

        await getCart();
        update.disabled = false;

    } catch (error) {
        console.error("Error updating quantity:", error.message);
        alert(error.message);
    }
}

async function deleteItem(id) {
    try {
        const response = await fetch(`${backendURL}/api/carts/item/${id}`, {
            method: "DELETE",
            headers: headers,
        });

        if (!response.ok) {
            const errorData = await response.json();
            await getCart();
            throw new Error(errorData.error || "Failed to delete item");
        }
        await getCart();
    }catch (error){
        console.error("Error deleting item:", error.message);
        alert(error.message);
    }
}


getCart();