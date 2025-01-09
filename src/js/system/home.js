import { backendURL, headers, logout, userlogged } from "../utils/utils.js";

userlogged();
logout();

async function getPopularProduct() {
    const getPopularProducts = document.getElementById('getPopularProducts');
  
      const [productsResponse, salesResponse, storeResponse, inventoryResponse] = await Promise.all([
        fetch(backendURL + '/api/product/all', { headers }),
        fetch(backendURL + '/api/sales', { headers }),
        fetch(backendURL + '/api/user', { headers }),
        fetch(backendURL + '/api/inventory/all', { headers }),
      ]);
  
      if (!productsResponse.ok || !salesResponse.ok || !storeResponse.ok || !inventoryResponse.ok) {
        throw new Error("Failed to fetch data");
      }
  
      const [productsData, salesData, storesData, inventoryData] = await Promise.all([
        productsResponse.json(),
        salesResponse.json(),
        storeResponse.json(),
        inventoryResponse.json(),
      ]);

      let profileData = null;
      const token = localStorage.getItem('token');

      if(token){
        const profileResponse = await fetch(backendURL + '/api/profile/show', { headers });
        if(!profileResponse.ok) throw new Error ("Failed to fetch profile");
        profileData = await profileResponse.json();
      }
  
      const productQuantities = {};
      salesData.forEach(sale => {
        const productId = sale.product_id;
        if (!productQuantities[productId]) {
          productQuantities[productId] = { ...sale, totalQuantity: 0 };
        }
        productQuantities[productId].totalQuantity += sale.quantity;
      });
  
      const sortedProducts = Object.values(productQuantities)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 6);
  
      getPopularProducts.innerHTML = "";
  
      if (sortedProducts.length === 0) {
        getPopularProducts.innerHTML = "<p>No popular products found.</p>";
        return;
      }
  
      // Display top 6 popular products
      sortedProducts.forEach(product => {
        const productDetails = productsData.find(p => p.product_id === product.product_id);
        const storeDetails = storesData.find(s => s.id === product.store_id);
        const inventoryDetails = inventoryData.find(i => i.product_id === product.product_id);
  
        if (productDetails) {
          getPopularProducts.innerHTML += `
            <div class="col">
              <div class="card">
                <img
                  src="${backendURL}/storage/${productDetails.image_path}"
                  class="card-img-top"
                  alt="Product Image"
                />
                <div class="card-body pt-2">
                  <h5 class="card-title fw-bold color">${productDetails.product_name || 'Loading...'}</h5>
                  <p class="card-text color">${storeDetails?.business_name || 'Loading...'}</p>
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="color fw-bold">Php ${inventoryDetails?.new_price || 'Loading...'}</span>
                    <button class="btn btn-sm bg text-white" onclick="addItemToCart({ storeId: ${storeDetails?.id}, productId: ${productDetails.product_id}, customerId: ${profileData?.customer_id}, quantity: 1 })">
                      Add to Basket
                    </button>
                  </div>
                </div>
              </div>
            </div>`;
        }
      });
  }
  

getPopularProduct();