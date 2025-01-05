import { backendURL, headers, userlogged } from '../utils/utils.js';

userlogged();
async function getProducts(url="", keyword){
  
    const getListOfProducts = document.getElementById('getListOfProducts');

    let queryParams = 
    "?" + 
    (url ? new URL(url).searchParams + "&" : "") + 
    (keyword ? "keyword=" + encodeURIComponent(keyword) : "");

    const productsResponse = await fetch (url || backendURL + "/api/product/shop/all" + queryParams, { headers });
    const inventoryResponse = await fetch (backendURL + "/api/inventory/all", { headers });
    const storeResponse = await fetch (backendURL + "/api/user", { headers });
    const profileResponse = await fetch (backendURL + "/api/profile/show", { headers });

    if (!productsResponse.ok) {
        throw new Error("Can't fetch product data");
    }
    if (!inventoryResponse.ok) {
        throw new Error("Can't fetch inventory data");
    }
    if (!storeResponse.ok) {
        throw new Error("Can't fetch store data");
    }
    if(localStorage.getItem("token") !== null){
    if (!profileResponse.ok) {
        throw new Error("Can't fetch profile data");
    }
  }
    const profileData = await profileResponse.json();
    const inventoryData = await inventoryResponse.json();
    const productsData = await productsResponse.json();
    const storeData = await storeResponse.json();

    const shuffledProducts = productsData.data.sort(() => Math.random() - 0.5);

    let productHTML = '';

    shuffledProducts.forEach(product => {
      const specificProducts = inventoryData.filter(item => item.product_id === product.product_id);
      
      specificProducts.forEach(inventory => {
        const store = storeData.find(item => item.id === inventory.store_id);
        productHTML += getProductsHTML(product, store, inventory, profileData);
      });
    });
    
    getListOfProducts.innerHTML = productHTML;
    
    let pagination = "";
    if (productsData.links) {
        productsData.links.forEach((link) => {
            pagination += `
                <li class="page-item" >
                    <a class="page-link ${link.url == null ? " disabled" : ""}${link.active ? " active" : ""}" href="#" data-url="${link.url}">
                        ${link.label}
                    </a>
                </li>`;
        });
    }
    
    document.getElementById("pages").innerHTML = pagination;

    document.querySelectorAll("#pages .page-link").forEach((link) => {
    link.addEventListener("click", pageAction);
});
}

function getProductsHTML(product, store, inventory, customer){
    return `        <!-- Product Card -->
        <div class="col">
          <div class="card">
            <img
              src="${backendURL}/storage/${product.image_path}"
              class="card-img-top"
              alt="Product Image"
            />
            <div class="card-body pt-2">
              <h5 class="card-title fw-bold color">${product.product_name}</h5>
              <p class="card-text color">${store.business_name}</p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="color fw-bold">Php ${inventory.new_price}</span>
                <span class="d-flex">
                <button 
                    class="btn border-violet color btn-sm me-1" 
                    onclick="addItemToCart({ storeId: ${store.id}, productId: ${product.product_id}, customerId: ${customer.customer_id}, quantity: 1, action: 'addToCart' })"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bag-plus" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M8 7.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0v-1.5H6a.5.5 0 0 1 0-1h1.5V8a.5.5 0 0 1 .5-.5"/>
                      <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
                    </svg>
                  </button>
                <button class="btn btn-sm bg text-white" onclick="addItemToCart({ storeId: ${store.id}, productId: ${product.product_id}, customerId: ${customer.customer_id}, quantity: 1, action: 'buyNow' })">Buy Now</button>
                </span>
              </div>
            </div>
          </div>
        </div>`
}

const pageAction = async (e) => {
    e.preventDefault();
    const url = e.target.getAttribute("data-url");
    await getProducts(url);
  }

  const search_form = document.getElementById("search_form");
search_form.onsubmit = async (e) => {
    e.preventDefault(); 

    const formData = new FormData(search_form); 
    const keyword = formData.get("keyword");
    console.log(keyword); 
    getProducts("", keyword);
}

getProducts();

