 import { backendURL, headers, logout, userlogged } from '../utils/utils.js';

 userlogged()
 async function getAllStores() {
  try {
      const getStoreList = document.getElementById("getStoreList");

      // Fetch data
      const storeResponse = await fetch(backendURL + '/api/user', { headers });
      const inventoryResponse = await fetch(backendURL + '/api/inventory/all', { headers });
      const productsResponse = await fetch(backendURL + '/api/product/all', { headers });

      if (!storeResponse.ok) throw new Error("Store fetch failed");
      if (!inventoryResponse.ok) throw new Error("Inventory fetch failed");
      if (!productsResponse.ok) throw new Error("Products fetch failed");

      const storeData = await storeResponse.json();
      const storeInventory = await inventoryResponse.json();
      const productData = await productsResponse.json();

      let profileData = null, frequentShopperData = null;
      const token = localStorage.getItem("token");

      if (token) {
          const profileResponse = await fetch(backendURL + '/api/profile/show', { headers });
          const frequentShopperResponse = await fetch(backendURL + '/api/frequent-shopper', { headers });

          if (!profileResponse.ok) throw new Error("Profile fetch failed");
          if (!frequentShopperResponse.ok) throw new Error("Frequent shopper fetch failed");

          profileData = await profileResponse.json();
          frequentShopperData = await frequentShopperResponse.json();
          console.log(frequentShopperData)
      }

      // Shuffle and render stores
      const shuffledStores = storeData.sort(() => Math.random() - 0.5);
      let storeHTML = "";

      shuffledStores.forEach(store => {
          if (store.business_type === "Retail") {
              const inventory = storeInventory.filter(item => item.store_id === store.id);
              storeHTML += `
                  <div class="col">
                      <div class="card border-violet-nohover shadow-sm text-center rounded-4" style="min-height: 150px" data-bs-toggle="modal" data-bs-target="#exampleModal${store.id}">
                          <div class="card-body py-3">
                              <img src="${backendURL}/storage/${store.image_path}" alt="${store.business_name} Logo" class="mb-2 rounded-circle" style="width: 120px; height: 120px; object-fit: cover" />
                              <h6 class="fw-bold mb-2 color">${store.business_name}</h6>
                              <a href="#" class="btn btn-sm btn-outline-violet bg text-white rounded-3" data-bs-toggle="modal" data-bs-target="#exampleModal${store.id}">Visit</a>
                          </div>
                      </div>
                  </div>
                  ${openStoreModal(store, inventory, productData, profileData?.customer_id, frequentShopperData)}`;
          }
      });

      getStoreList.innerHTML = storeHTML;
  } catch (error) {
      console.error("Error:", error.message);
  }
}

function openStoreModal(store, inventory, products, customerId, frequentShopperData) {
  // Check if the user is a frequent shopper for this store
  const frequentShopperEntry = frequentShopperData?.find(
    data => data.customer_id === customerId && data.store_id === store.id
  );

  const isFrequentShopper = frequentShopperEntry?.is_frequent_shopper === true || frequentShopperEntry?.is_frequent_shopper === 1;

  return `
    <!-- Modal -->
    <div class="modal fade" id="exampleModal${store.id}" tabindex="-1" aria-labelledby="modalLabel${store.id}" aria-hidden="true">
      <div class="modal-dialog modal-dialog-scrollable modal-xl">
        <div class="modal-content">
          <div class="modal-header bg d-flex align-items-center justify-content-between">
            <h5 class="modal-title fw-bold text-white" id="modalLabel${store.id}">${store.business_name}</h5>
            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="frequentShopperToggle${store.id}" 
                ${isFrequentShopper ? "checked" : ""}
                onchange="handleFrequentShopperToggle(${store.id}, ${customerId})">
              <label class="form-check-label text-white" for="frequentShopperToggle${store.id}">
                Frequent Shopper?
              </label>
            </div>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-4 mt-4 text-center">
                <img
                  src="${backendURL}/storage/${store.image_path}"
                  alt="${store.business_name} Logo"
                  class="rounded-circle mb-3"
                  style="width: 150px; height: 150px; object-fit: cover;"
                />
              </div>
              <div class="col-md-8 mt-5">
                <div class="row">
                  <div class="col">
                      <p><strong class="opacity-75">Address</strong> <br> ${store.business_address}</p>
                      <p><strong class="opacity-75">Phone</strong><br> ${store.phone_number}</p>
                  </div>
                  <div class="col">
                      <p><strong class="opacity-75">Email</strong> <br>${store.email}</p>
                      <p><strong class="opacity-75">Country</strong> <br>${store.country}</p>
                  </div>
                  <div class="col">
                      <p><strong class="opacity-75">City</strong> <br>${store.city} ${store.zipcode}</p>
                      <p><strong class="opacity-75">Operating Hour</strong> <br>${store.operating_hours}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="fs-5">
              <div class="mt-5 ms-1 mb-2 fw-bold">Products</div>
            </div>
            <div class="row" id="getstoreproducts${store.id}">
              ${getStoreProducts(inventory, products)}
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function getStoreProducts(inventory, products) {
    let storeProductsHTML = "";

    inventory.forEach(item => {
        const product = products.find(product => product.product_id === item.product_id);

        if (product) {
            storeProductsHTML += `
            <div class="col-md-2">
              <div class="card storeProductCard text-center border-0">
                <img
                  src="${backendURL}/storage/${product.image_path}"
                  alt="${product.product_name} Image"
                  class="card-img-top shadow-sm rounded-3"
                />
                <div class="card-body py-3">
                  <h6 class="fw-bold mb-2">${product.product_name}</h6>
                  <p class="mb-1 text-secondary">Price: Php ${item.new_price}</p>
                </div>
              </div>
            </div>`;
        }
    });

    return storeProductsHTML;
}




logout();
 getAllStores();