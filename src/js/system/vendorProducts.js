import { backendURL, logout, userlogged  } from '../utils/utils.js';

userlogged();
logout();

const createProductForm = document.getElementById("create_product_form");

createProductForm.onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(createProductForm);

    formData.append("UPC", generateUPC())

    for (let [key, value] of formData.entries()) {
        console.log(key, value);
    }

    const createProductButton = document.querySelector('#create_product_form button');
    createProductButton.disabled = true;
    createProductButton.innerHTML = 'Creating...';

    const productResponse = await fetch (backendURL + '/api/product', {
        method: 'POST', 
        headers:{
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
    })

    if(!productResponse.ok){
        createProductForm.reset()
        throw new Error ("Can't create product")
    }
    else{
        alert("Successfully created product")
        createProductForm.reset();
        await getVendorProduct();
    }
    createProductButton.disabled = false;
    createProductButton.innerHTML = 'Create';
}

async function getVendorProduct(url = "", keyword){
    const getProductsData = document.getElementById('getProductsData');
    let queryParams = 
    "?" + 
    (url ? new URL(url).searchParams + "&" : "") + 
    (keyword ? "keyword=" + encodeURIComponent(keyword) : "");

    try {
        const productResponse = await fetch(url ||`${backendURL}/api/vendor/product` + queryParams,{
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        
        const productData = await productResponse.json();

        console.log(productData);

        if(!productResponse.ok) throw new Error ("Can't fetch product");
        else{
            let productHTML = "";
            let hasProduct = false;

            productData.data.forEach(product => {
                hasProduct = true;
                productHTML += getVendorProductHTML(product);
            });
            getProductsData.innerHTML = productHTML;

            let pagination = "";
            if (productData.links) {
                productData.links.forEach((link) => {
                    pagination += `
                        <li class="page-item" >
                            <a class="page-link ${link.url == null ? " disabled" : ""}${link.active ? " active" : ""}" href="#" data-url="${link.url}">
                                ${link.label}
                            </a>
                        </li>`;
                });
            }

            // for steff designed
            // let pagination = "";
            // if (productData.links) {
            //     productData.links.forEach((link) => {
            //         pagination += `
            //             <li class="page-item" >
            //                 <a class="page-link ${link.url == null ? " disabled" : ""}${link.active ? " active" : ""}" href="#" data-url="${link.url}">
            //                     ${link.label == "&laquo; Previous" ? `<<` : link.label && link.label == "Next &raquo;" ? `>>` : link.label}
            //                 </a>
            //             </li>`;
            //     });
            // }

            if(!hasProduct){
                document.getElementById("noProductFound").innerHTML = ` 
               <div class="text-center my-4">No product found.</div>`;
            }

            document.querySelectorAll(".updateButton").forEach(button => {
                button.addEventListener("click", updateClickInfo);
            });

            document.querySelectorAll(".deleteButton").forEach(button => {
                button.addEventListener("click", deleteClick);
            });

            document.getElementById("pages").innerHTML = pagination;

            document.querySelectorAll("#pages .page-link").forEach((link) => {
                link.addEventListener("click", pageAction);
            });
        }
        
    } catch (error) {
        console.error('Error fetching vendor products:', error);
    }
}

function getVendorProductHTML(product){
    return `<tr>
                    <td>${product.UPC}</td>
                    <td>${product.product_name}</td>
                    <td>${product.product_type}</td>
                    <td>${product.brand}</td>
                    <td>${product.selling_price}</td>
                    <td>${product.wholesale_price}</td>
                    <td>${product.cost_price}</td>
                    <td>${product.stock_quantity}</td>
                    <td>${product.status}</td>
                    <td>
                      <a href="${backendURL}/storage/${product.image_path}"
                        >View</a
                      >
                    </td>
                    <td style="width: 100px">
                      <div class="d-flex">
                        <div class="me-1">
                          <button
                            type="button"
                            class="btn btn-sm text-white"
                            style="background-color: #9b4dca"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#updateInventoryItem_${product.product_id}"
                            aria-controls="updateInventoryItem"
                          >
                            Edit
                          </button>
                        </div>
                        <div>
                          <button
                            type="button"
                            class="btn btn-sm bg-secondary-subtle border-violet deleteButton"
                            data-id="${product.product_id}"
                          >
                            <img
                              src="src/icon/trash (1).png"
                              alt=""
                              width="12px"
                              data-id="${product.product_id}"
                            />
                          </button>
                        </div>
                      </div>
                      ${getUpdateHTML(product)}
                    </td>
                  </tr>`
}

function getUpdateHTML(product){
    return `    <!-- Update -->
    <div
      class="offcanvas offcanvas-end"
      style="
        height: fit-content !important;
        border-radius: 20px;
        margin-top: 15px !important;
      "
      tabindex="-1"
      id="updateInventoryItem_${product.product_id}"
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
        <h5 class="offcanvas-title" id="offcanvasRightLabel">Update Product</h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        ></button>
      </div>
      <div class="offcanvas-body">
        <form id="update_form${product.product_id}">
          <!-- Product Name -->
          <div class="form-floating mb-3">
            <input
              type="text"
              class="form-control"
              id="productName"
              placeholder="Product Name"
              value="${product.product_name}"
              name="product_name"
              required
            />
            <label for="productName">Product Name</label>
          </div>
          <!-- Product Type -->
          <div class="form-floating mb-3">
            <input
              type="text"
              class="form-control"
              id="productType"
              placeholder="Product Type"
              value="${product.product_type}"
              name="product_type"
              required
            />
            <label for="productType">Product Type</label>
          </div>
          <!-- Brand -->
          <div class="form-floating mb-3">
            <input
              type="text"
              class="form-control"
              id="brand"
              placeholder="Brand"
              value="${product.brand}"
              name="brand"
              required
            />
            <label for="brand">Brand</label>
          </div>
          <div class="d-flex">
  <!-- Selling Price -->
  <div class="form-floating mb-3 me-2">
    <input
      type="number"
      class="form-control"
      id="sellingPrice"
      placeholder="Selling Price"
      value="${product.selling_price}"
      name="selling_price"
      step="0.01" 
      required
    />
    <label for="sellingPrice">Selling Price</label>
  </div>
  <!-- Cost Price -->
  <div class="form-floating mb-3">
    <input
      type="number"
      class="form-control"
      id="costPrice"
      placeholder="Cost Price"
      value="${product.cost_price}"
      name="cost_price"
      step="0.01"
      required
    />
    <label for="costPrice">Cost Price</label>
  </div>
</div>
  <div class="d-flex">
  <!-- Cost Price -->
  <div class="form-floating mb-3 me-2">
    <input
      type="number"
      class="form-control"
      id="wholesaleprice"
      placeholder="wholesale_price1"
      value="${product.wholesale_price}"
      name="wholesale_price"
      step="0.01"
      required
    />
    <label for="wholesaleprice">Wholesale Price</label>
  </div>
  <!-- Quantity -->
          <div class="form-floating mb-3">
            <input
              type="number"
              class="form-control"
              id="quantity"
              placeholder="Quantity"
              value="${product.stock_quantity}"
              name="stock_quantity"
              required
            />
            <label for="quantity">Quantity</label>
          </div>
  </div>
          <!-- Image -->
          <div class="form-floating mb-3">
            <input
              type="file"
              class="form-control"
              id="Image"
              placeholder="Image"
              accept="image/*"
              name="image_path"
            />
            <label for="Image">Image</label>
          </div>
          <!-- Status -->
          <div class="form-floating mb-3">
            <select
              class="form-select"
              id="status"
              aria-label="Product Status"
              name="status"
              required
            >
              <option value="" disabled selected>Select Status</option>
              <option value="Available" ${product.status == "Available" ? `selected` : ``}>Available</option>
              <option value="Out of stock" ${product.status == "Out of stock" ? `selected` : ``}>Out of stock</option>
              <option value="Discontinued" ${product.status == "Discontinued" ? `selected` : ``}>Discontinued</option>
            </select>
            <label for="status">Product Status</label>
          </div>

          <!-- Create Button -->
          <div>
            <button type="submit" class="btn bg w-100 text-white updateButton" data-id="${product.product_id}">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>`
}

function generateUPC() {
    // Generate the first 11 random digits
    let upc = '';
    for (let i = 0; i < 11; i++) {
        upc += Math.floor(Math.random() * 10);
    }

    // Calculate the check digit
    const checkDigit = calculateCheckDigit(upc);
    upc += checkDigit;

    return upc;
}

function calculateCheckDigit(upc) {
    if (upc.length !== 11) {
        throw new Error("UPC must have 11 digits for check digit calculation.");
    }

    let oddSum = 0;
    let evenSum = 0;

    for (let i = 0; i < upc.length; i++) {
        const digit = parseInt(upc[i]);
        if (i % 2 === 0) {
            oddSum += digit; 
        } else {
            evenSum += digit; 
        }
    }

    const total = (oddSum * 3) + evenSum;
    const checkDigit = (10 - (total % 10)) % 10; 
    return checkDigit;
}

const search_form = document.getElementById("search_form");
search_form.onsubmit = async (e) => {
    e.preventDefault(); 

    const formData = new FormData(search_form); 
    const keyword = formData.get("keyword");
    
    getVendorProduct("", keyword);
}

const pageAction = async (e) => {
  e.preventDefault();
  const url = e.target.getAttribute("data-url");
  await getVendorProduct(url);
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

  async function updateInfo(id) {
    const update_form = document.getElementById("update_form" + id);

    if (!update_form) return;

    update_form.onsubmit = async (e) => {
        e.preventDefault();

        const updateButton = document.querySelector(".updateButton");
        updateButton.disabled = true;
        updateButton.innerHTML = `Updating...`;

        const formData = new FormData(update_form);

        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        formData.append("_method", "PUT");
        const productResponse = await fetch(backendURL + "/api/product/details/" + id, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: formData,
        });

        if(!productResponse.ok){
        updateButton.disabled = false;
        updateButton.innerHTML = `Update`; 
        throw new Error ("Product Update Failed");
        }

        else if (productResponse.ok) {
            await getVendorProduct();
        }

        updateButton.disabled = false;
        updateButton.innerHTML = `Update`;
    }
}


  async function deleteInfo(id) {
    if (confirm("Are you sure you want to delete this event item?")) {
        const productResponse = await fetch(backendURL + "/api/product/" + id, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
        });
          
        if(!productResponse.ok) throw new Error ("Error deleting product")

        else if(productResponse.ok) {
            await getVendorProduct();
        }
    }
  }

getVendorProduct();