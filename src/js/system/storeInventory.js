import { backendURL, headers, logout, userlogged } from "../utils/utils.js";

userlogged();
logout();

const createInventoryForm = document.getElementById("create_form");

createInventoryForm.onsubmit = async (e) => {
    e.preventDefault();

    const storeInventoryResponse = await fetch (backendURL + '/api/store/inventory', { headers });

    if (!storeInventoryResponse.ok) {
        throw new Error("Can't fetch product data");
    }
    const inventoryData = await storeInventoryResponse.json();

    const formData = new FormData(createInventoryForm);

    for (let [key, value] of formData.entries()) {
        console.log(key, value);
    }

    const createProductButton = document.querySelector('#create_form button');
    createProductButton.disabled = true;
    createProductButton.innerHTML = 'Creating...';

    if (inventoryData.length > 0) {
      const isInventoryExist = inventoryData.map(
        (product) => product.product_id === parseInt(formData.get("product_id"))
      );
  
      console.log(isInventoryExist);
  
      const isTrue = isInventoryExist.find((isExist) => isExist === true);
  
      if (isTrue) {
        alert("Inventory already exists.");
        createProductButton.disabled = false;
        createProductButton.innerHTML = "Create";
        return;
      }
    }

    const inventoryResponse = await fetch (backendURL + '/api/inventory', {
        method: 'POST', 
        headers:{
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
    })

    if(!inventoryResponse.ok){
        createInventoryForm.reset()
        throw new Error ("Can't create product")
    }else{

        alert("Successfully created inventory.")
        createInventoryForm.reset();
        await getInventoryDatas();
    }

    createProductButton.disabled = false;
    createProductButton.innerHTML = 'Create';
}

async function getInventoryDatas(url = "") {
    const getInventoryDatas = document.getElementById("getInventoryDatas");
    const getLowQuantityAlert = document.getElementById("lowQuantityAlert");
    const getProductList = document.getElementById("getProductList");

        const [inventoryResponse, vendorResponse, productResponse, profileResponse] = await Promise.all([
            fetch(url || backendURL + `/api/store/inventory`, { headers }),
            fetch(backendURL + `/api/user`, { headers }),
            fetch(backendURL + "/api/product/all", { headers }),
            fetch(backendURL + "/api/profile/show", { headers }),
        ]);

        if (!inventoryResponse.ok || !vendorResponse.ok || !productResponse.ok || !profileResponse.ok) {
            throw new Error("Failed to fetch required data.");
        }

        const [inventoryDatas, vendorDatas, productDatas, profileData] = await Promise.all([
            inventoryResponse.json(),
            vendorResponse.json(),
            productResponse.json(),
            profileResponse.json(),
        ]);

        let inventoryHTML = "", hasInventory = false, index = 0, hasLowQuantity = false, lowQuantityHTML = "", productHTML = "";

        // if(inventoryDatas.length > 0){
          for (const inventory of inventoryDatas.data) {
            const productData = productDatas.find(product => product?.product_id === inventory?.product_id);
            const vendorName = vendorDatas.find(vendor => vendor?.id === productData?.vendor_id);
            hasInventory = true;
            index++;

            inventoryHTML += getInventoryHTML(inventory, vendorName, productData, index);

            if (parseInt(inventory.quantity) < parseInt(inventory.reorder_quantity)) {
                hasLowQuantity = true;
                lowQuantityHTML += getlowQuantityHTML(inventory, productData, vendorName);
            }

            if (parseInt(inventory.quantity) >= parseInt(inventory.reorder_quantity) && inventory.is_reordered) {
                await updateInventoryStatus(inventory.inventory_id, false);
            }

            if (parseInt(inventory.quantity) < parseInt(inventory.reorder_level) && !inventory.is_reordered) {
                await updateInventoryStatus(inventory.inventory_id, true);

                const formData = {
                    quantity: inventory.auto_order_quantity, 
                    store_id: profileData.id,
                    vendor_id: productData.vendor_id,
                    product_id: inventory.product_id,
                    order_type: inventory.order_type,
                };

                const reorderResponse = await fetch(backendURL + '/api/reorder-request', {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                if (!reorderResponse.ok) {
                    throw new Error(`Failed to create reorder request for product ID: ${inventory.product_id}`);
                }
                console.log(`Reorder request created successfully for product ID: ${inventory.product_id}`);
            }
        }
        // }

        // productHTML = `<option selected disabled>Select product</option>`
        // productDatas.forEach(product => {
        //     const vendor = vendorDatas.find(vendor => vendor?.id === product?.vendor_id);
            
        //     productHTML += `<option value="${product.product_id}">
        //     ${product.product_name} - ${product.product_type} - ${vendor.business_name}</option>`;
        // })

        getInventoryDatas.innerHTML = inventoryHTML;
        getLowQuantityAlert.innerHTML = lowQuantityHTML;
        // getProductList.innerHTML = productHTML;

        let pagination = "";
        if (inventoryDatas.links) {
            inventoryDatas.links.forEach((link) => {
                pagination += `
                    <li class="page-item" >
                        <a class="page-link ${link.url == null ? " disabled" : ""}${link.active ? " active" : ""}" href="#" data-url="${link.url}">
                            ${link.label}
                        </a>
                    </li>`;
            });
        }

        if(!hasInventory){
            document.getElementById("noInventoryData").innerHTML = `              
            <div class="text-center my-4">No inventory product.</div>`
        }

        if(!hasLowQuantity){
            document.getElementById("lowQuantityAlert").innerHTML = `              
             <div class="text-center mt-4 mb-3">
              <img src="src/icon/check-circle.png" alt="" width="50px" />
              <div class="mt-3">No Restock Needed</div>
            </div>`
        }

        document.querySelectorAll(".updateButton").forEach(button => {
            button.addEventListener("click", updateClickInfo);
        });

        document.querySelectorAll(".deleteButton").forEach(button => {
            button.addEventListener("click", deleteClick);
        });
        
        document.querySelectorAll(".reorderButton").forEach(button => {
            button.addEventListener("click", reorderClick);
        });

        document.getElementById("pages").innerHTML = pagination;

        document.querySelectorAll("#pages .page-link").forEach((link) => {
            link.addEventListener("click", pageAction);
        });
    }


async function updateInventoryStatus(inventoryId, isReordered) {
    const updateData = { is_reordered: isReordered };

    const response = await fetch(backendURL + '/api/inventory/status/'+ inventoryId, {
        method: "PUT",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
    });

    if (!response.ok) {
        throw new Error(`Failed to update inventory status for ID: ${inventoryId}`);
    }
}

function getInventoryHTML(inventory, vendor, product, index) {
    return `<tr>
                    <td class="fw-bold">${index}</td>
                    <td>${product.UPC}</td>
                    <td>${product.product_name}</td>
                    <td>${product.product_type}</td>
                    <td>${product.brand}</td>
                    <td>${vendor.business_name}</td>
                    <td>${inventory.quantity}</td>
                    <td>${inventory.new_price}</td>
                    <td style="width: 100px">
                      <div class="d-flex">
                        <div class="me-1">
                          <button
                            type="button"
                            class="btn text-white btn-sm"
                            style="background-color: #9b4dca"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#updateInventoryItem${inventory.inventory_id}"
                            aria-controls="updateInventoryItem"
                          >
                            Edit
                          </button>
                        </div>
                        <div>
                          <button
                            type="button"
                            class="btn btn-sm bg-secondary-subtle border-violet deleteButton" 
                            data-id="${inventory.inventory_id}"
                          >
                            <img
                              src="src/icon/trash (1).png"
                              alt=""
                              width="12px"
                              data-id="${inventory.inventory_id}"
                            />
                          </button>
                        </div>
                      </div>
                      <!-- Update inventory item -->
                      ${updateInventory(inventory, product)}
                    </td>
                  </tr>`
};

function getlowQuantityHTML(inventory, product, vendor) {
    return `<!-- Alert reorder card -->
            <div class="p-2" >
              <div class="row d-flex">
                <div class="col-2 position-relative">
                  <div class="center-card1">
                    <img src="src/icon/exclamation-v.png" alt="" width="40px" />
                  </div>
                </div>
                <div class="col-10">
                  <div style="font-size: 16px !important">${product.product_name} - ${product.product_type}</div>
                  <div class="d-flex justify-content-between">
                    <div class="mb-1">
                      <small class="color">${inventory.quantity} quantity left</small>
                    </div>
                    <div>
                      <button
                        class="text-white border-0 rounded-1 reorderButton btn-sm"
                        type="button"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#reorderRequest"
                        aria-controls="reorderRequest"
                        data-id="${inventory.inventory_id}"
                      >
                        Reorder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Alert reorder card -->
            
            ${getReorderRequestHTML(inventory, product, vendor)}
            `
}

function updateInventory(inventory, product) {
    return` <div
      class="offcanvas offcanvas-end"
      style="
        height: fit-content !important;
        border-radius: 20px;
        margin-top: 15px !important;
      "
      tabindex="-1"
      id="updateInventoryItem${inventory.inventory_id}"
      aria-labelledby="offcanvasRightLabel"
    >
      <div
        class="offcanvas-header text-white"
        style="
          background-color: #9b4dca !important;
          border-top-right-radius: 20px;
          border-top-left-radius: 20px;
        "
      >
        <h5 class="offcanvas-title" id="offcanvasRightLabel">Update - ${product.product_name}</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        ></button>
      </div>
      <div class="offcanvas-body">
        <form id="update_form${inventory.inventory_id}">
          <div class="form-floating mb-3">
            <input
              type="number"
              class="form-control"
              id="Quantity"
              placeholder="Quantity"
              value=${inventory.quantity}
              name="quantity"
              required
            />
            <label for="Quantity">Quantity</label>
          </div>
          <div class="form-floating mb-3">
            <input
              type="number"
              class="form-control"
              id="Price"
              placeholder="Price"
              step="0.01"
              value=${inventory.new_price}
              name="new_price"
              required
            />
            <label for="Price">Price</label>
          </div>
          <strong>Reorder Details</strong>
          <div class="form-floating mb-3 mt-2">
            <input
              type="number"
              class="form-control"
              id="Reorder"
              placeholder="Reorder Quantity"
              value=${inventory.reorder_quantity}
              name="reorder_quantity"
              data-bs-toggle="tooltip"
              data-bs-placement="left"
              data-bs-title="Level to alert if the product is in low quantity"
          
              required
            />
            <label for="Reorder">Reorder Alert Quantity</label>
          </div>
          <div class="form-floating mb-3">
            <input
              type="number"
              class="form-control"
              id="Reorder Leve"
              placeholder="Reorder Level"
              data-bs-toggle="tooltip"
              data-bs-placement="left"
              data-bs-title="Level to automatically reorder product"
              value=${inventory.reorder_level}
              name="reorder_level"
              required
            />
            <label for="Reorder Level">Reorder Level</label>
          </div>
           <div class="form-floating mb-3">
            <input
              type="text"
              class="form-control"
              id="orderType"
              placeholder="Order Type"
              data-bs-toggle="tooltip"
              data-bs-placement="left"
              data-bs-title="Specify the type of order when automatically ordering from the vendor"
              value=${inventory.order_type}
              name="order_type"
              required
            />
            <label for="orderType">Order Type</label>
          </div>
          <div class="form-floating mb-3">
            <input
              type="number"
              class="form-control"
              id="autoOrderQuantity"
              placeholder="Auto Order Quantity"
              data-bs-toggle="tooltip"
              data-bs-placement="left"
              data-bs-title="Specify the quantity to reorder automatically when the reorder level is reached"
              value=${inventory.auto_order_quantity}
              name="auto_order_quantity"
              required
            />
            <label for="autoOrderQuantity">Auto Order Quantity</label>
          </div>
          <div>
            <button type="submit" class="btn bg w-100 text-white updateButton" id="button${inventory.inventory_id}" data-id="${inventory.inventory_id}">
              Update Product
            </button>
          </div>
        </form>
      </div>
    </div>`
}
function getReorderRequestHTML(inventory, product, vendor){
    return `  <!-- Reorder -->
    <div
      class="offcanvas offcanvas-end"
      style="
        height: fit-content;
        border-radius: 20px;
        margin-top: 15px !important;
      "
      tabindex="-1"
      id="reorderRequest"
      aria-labelledby="offcanvasRightLabel"
    >
      <div
        class="offcanvas-header text-white"
        style="
          background-color: #9b4dca !important;
          border-top-right-radius: 20px;
          border-top-left-radius: 20px;
        "
      >
        <h5 class="offcanvas-title" id="offcanvasRightLabel">Reorder</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        ></button>
      </div>
      <div class="offcanvas-body">
      <div class="row">
        <div class="col-6">
          <small class="color">Product Name</small>
          <div class="mb-2">${product.product_name}</div>
          <small small class="color">Product Type</small>
          <div class="mb-2">${product.product_type}</div>
        </div>
        <div class="col-6">
          <small class="color">Brand</small>
          <div class="mb-2">${product.brand}</div>
          <small class="color">Vendor</small>
          <div class="mb-3">${vendor.business_name}</div>
        </div>
        <div class="col-6">
          <small class="color">Selling Price (per item)</small>
          <div class="mb-2">${product.selling_price}</div>
        </div>
        <div class="col-6">
          <small class="color">Wholesale Price</small>
          <div class="mb-3">${product.wholesale_price}</div>
        </div>
        </div>
        
        <form id="reorder_form${inventory.inventory_id}">
        <input type="hidden" name="vendor_id" value="${product.vendor_id}">
        <input type="hidden" name="store_id" value="${inventory.store_id}">
        <input type="hidden" name="product_id" value="${product.product_id}">
        <div class="form-floating mb-3">
            <input
              type="text"
              class="form-control"
              id="quantity"
              placeholder="Quantity"
              name="order_type"
              required
            />
            <label for="floatingInput">Input type of order</label>
          </div>
          <div class="form-floating mb-3">
            <input
              type="number"
              class="form-control"
              id="quantity"
              placeholder="Quantity"
              name="quantity"
              required
            />
            <label for="floatingInput">Input quantity to reorder</label>
          </div>
          <div>
            <button type="submit" class="btn bg w-100 text-white reorderButton" data-id="${inventory.inventory_id}" id="reorder${inventory.inventory_id}">
              Reorder
            </button>
          </div>
        </form>
      </div>
    </div>`
}

async function populateVendorAndProductLists() {
    const vendorResponse = await fetch(backendURL + '/api/user', { headers });
    const productResponse = await fetch(backendURL + '/api/product/all', { headers });

    if (!vendorResponse.ok || !productResponse.ok) {
      throw new Error("Failed to fetch data");
    }

    const vendorDatas = await vendorResponse.json();
    const productDatas = await productResponse.json();

    const getVendorList = document.getElementById('getVendorList');
    const getProductList = document.getElementById('getProductList');

    getVendorList.innerHTML = `<option selected disabled>Select Vendor</option>`;
    getProductList.innerHTML = `<option selected disabled>Select Product</option>`;

    vendorDatas.filter(v => v.business_type === "Vendor").forEach(vendor => {
      const vendorOption = document.createElement('option');
      vendorOption.value = vendor.id;
      vendorOption.textContent = vendor.business_name;
      getVendorList.appendChild(vendorOption);
    });

    // Event listener for Vendor selection change
    getVendorList.addEventListener('change', function() {
      const selectedVendorId = this.value;
      updateProductList(selectedVendorId, productDatas, getProductList);
    });

    function updateProductList(vendorId, productDatas, productList) {
      productList.innerHTML = `<option selected disabled>Select Product</option>`;

      const filteredProducts = productDatas.filter(product => product.vendor_id === parseInt(vendorId));
      
      filteredProducts.forEach(product => {
        const productOption = document.createElement('option');
        productOption.value = product.product_id;
        productOption.textContent = `${product.product_name} - ${product.product_type}`;
        productList.appendChild(productOption);
      });
    }
}

// Initialize the vendor and product lists
populateVendorAndProductLists();

const pageAction = async (e) => {
    e.preventDefault();
    const url = e.target.getAttribute("data-url");
    await getInventoryDatas(url);
  }
  
  function updateClickInfo(e) {
      const id = e.target.getAttribute("data-id");
      console.log(id)
      updateInfo(id);
    }
  
    function deleteClick(e) {
      const id = e.target.getAttribute("data-id");
      console.log(id)
      deleteInfo(id);
    }

    function reorderClick(e) {
      const id = e.target.getAttribute("data-id");
      console.log(id)
      reorderInfo(id);
    }
  
    async function updateInfo(id) {
      const update_form = document.getElementById("update_form" + id);
  
      if (!update_form) return;
  
      update_form.onsubmit = async (e) => {
          e.preventDefault();
  
          const updateButton = document.querySelector("#button" + id);
          updateButton.disabled = true;
          updateButton.innerHTML = `Updating...`;
  
          const formData = new FormData(update_form);
  
          for (let [key, value] of formData.entries()) {
              console.log(key, value);
          }
  
          formData.append("_method", "PUT");
  
          const inventoryResponse = await fetch(backendURL + "/api/inventory/" + id, {
              method: "POST",
              headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`
              },
              body: formData,
          });
  
          if(!inventoryResponse.ok){
          updateButton.disabled = false;
          updateButton.innerHTML = `Update`; 
          throw new Error ("Inventory Update Failed");
          }
  
          else if (inventoryResponse.ok) {
            alert("Inventory Update Success")
              await getInventoryDatas();
          }
  
          updateButton.disabled = false;
          updateButton.innerHTML = `Update`;
      }
  }
  
  
    async function deleteInfo(id) {
      if (confirm("Are you sure you want to delete this event item?")) {
          const inventoryResponse = await fetch(backendURL + "/api/inventory/" + id, {
              method: "DELETE",
              headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`
              },
          });
              
          if(!inventoryResponse.ok) throw new Error ("Error deleting product")
  
          else if(inventoryResponse.ok) {
            alert("Inventory Delete Success")
              await getInventoryDatas();
          }
      }
    }

    async function reorderInfo(id) {
      const reorder_form = document.getElementById("reorder_form" + id);

      if (!reorder_form) return;

        reorder_form.onsubmit = async (e) => {
            e.preventDefault();

            const reorderButton = document.querySelector("#reorder" + id);
            reorderButton.disabled = true;
            reorderButton.innerHTML = `Reordering...`;

            const formData = new FormData(reorder_form);

            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            const reorderResponse = await fetch(backendURL + "/api/reorder-request", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: formData,
            });

            if(!reorderResponse.ok) throw new Error ("Error reordering product")

            else if(reorderResponse.ok) {
                alert("Reorder Request Sent")
                await updateInventoryStatus(id, true);
                await getInventoryDatas();
            }

            reorderButton.disabled = false;
            reorderButton.innerHTML = `Reorder`;
        }
    }

getInventoryDatas();