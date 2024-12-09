import { backendURL, headers } from '../utils/utils.js';
async function getProducts (url=""){
    const getListOfProducts = document.getElementById('getListOfProducts');

    const productsResponse = await fetch (url || backendURL + "/api/product/shop/all", { headers });
    const inventoryResponse = await fetch (backendURL + "/api/inventory/all", { headers });
    const storeResponse = await fetch (backendURL + "/api/user", { headers });
    if (!productsResponse.ok) {
        throw new Error("Can't fetch product data");
    }
    if (!inventoryResponse.ok) {
        throw new Error("Can't fetch inventory data");
    }
    if (!storeResponse.ok) {
        throw new Error("Can't fetch store data");
    }
    const inventoryData = await inventoryResponse.json();
    const productsData = await productsResponse.json();
    const storeData = await storeResponse.json();

    let i = 0;
    productsData.data.forEach(product => {
        if(product.product_id === inventoryData[i].product_id){
            const inventory = inventoryData.find(item => item.product_id === product.product_id);
            const store = storeData.find(item => item.id === inventory.store_id);
            console.log(store, inventory);
            getListOfProducts.innerHTML += getProductsHTML(product, store, inventory);
        }
        i++;
    });

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

function getProductsHTML(product, store, inventory){
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
              <p class="card-text color">[${store.business_name}]</p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="color fw-bold">Php ${inventory.new_price}</span>
                <button class="btn btn-sm bg text-white">Buy Now</button>
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

getProducts();
