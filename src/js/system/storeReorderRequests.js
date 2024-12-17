import { backendURL, headers, logout } from '../utils/utils.js';

logout();

async function getRequests(url='', keyword) {
    const getRequests = document.getElementById('getRequests');

    let queryParams = 
    "?" + 
    (url ? new URL(url).searchParams + "&" : "") + 
    (keyword ? "keyword=" + encodeURIComponent(keyword) : "");
    
    const reorderResponse = await fetch (url || backendURL + "/api/reorder-request/user" + queryParams, { headers, });
    const vendorResponse = await fetch (backendURL + "/api/user", { headers, });
    const productResponse = await fetch (backendURL + "/api/product/all", { headers, });

    const reorderData = await reorderResponse.json();
    const vendorData = await vendorResponse.json();
    const productData = await productResponse.json();

    console.log(reorderData, vendorData, productData);

    if(!reorderResponse.ok) throw new Error ("Request fetch failed");
    if(!vendorResponse.ok) throw new Error ("Vendor Data fetch failed");
    if(!productResponse.ok) throw new Error ("Product Data fetch failed");

    if(reorderResponse.ok){
    let requestHTML = "", hasRequest = false, index = 0;

    reorderData.data.forEach(request => {
        const vendor = vendorData.find(vendor => vendor.id == request.vendor_id);
        const productRequestData = productData.find(product => product.product_id == request.product_id);
        index++;
        hasRequest = true;
        requestHTML += getRequestHTML(request, vendor, productRequestData, index);
    });

    getRequests.innerHTML = requestHTML;

    if(!hasRequest){
        document.getElementById("noRequestFound").innerHTML = 
        `<div class="text-center my-4">No Request found.</div>`;
    }

    let pagination = "";
            if (reorderData.links) {
                reorderData.links.forEach((link) => {
                    pagination += `
                        <li class="page-item" >
                            <a class="page-link ${link.url == null ? " disabled" : ""}${link.active ? " active" : ""}" href="#" data-url="${link.url}">
                                ${link.label}
                            </a>
                        </li>`;
                });
            }

    document.querySelectorAll(".deleteButton").forEach(button => {
        button.addEventListener("click", deleteClick);
    });

    document.querySelectorAll(".updateReorderButton").forEach(button => {
        button.addEventListener("click", updateReorderClick);
    });

    document.getElementById("pages").innerHTML = pagination;

    document.querySelectorAll("#pages .page-link").forEach((link) => {
        link.addEventListener("click", pageAction);
    });
    
    }
}

function getRequestHTML(request, vendor, product, index){

    return `<tr>
                    <td class="fw-bold">${index}</td>
                    <td>${product.product_name}</td>
                    <td>${product.product_type}</td>
                    <td>${product.brand}</td>
                    <td>${vendor.business_name}</td>
                    <td>${request.order_type}</td>
                    <td>${request.quantity}</td>
                    <td class="${request.status === "Approved" 
                    ? `text-success` 
                    : request.status === "Declined" 
                    ? `text-danger` 
                    : request.status === "Shipped" 
                    ? `text-primary` 
                    : request.status === "Delivered" 
                    ? `text-success` 
                    : ``
                    }">
                    ${request.status}
                    </td>          
                    <td>${request.shipped_date === null ? `Waiting...` : request.shipped_date}</td>
                    <td>${request.delivered_date === null ? `Waiting...` : request.delivered_date}</td>
                    <td style="width: 100px">
                      <div class="d-flex">
                        ${request.status !== "Shipped" && request.status !== "Delivered" && request.status !== "Declined" ? `<div class="me-1">
                          <button
                            type="button"
                            class="btn btn-sm text-white"
                            style="background-color: #9b4dca"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#updateQuantityRequest${request.reorder_id}"
                            aria-controls="updateQuantityRequest"
                          >
                            Edit
                          </button>
                        </div>`:``}
                        <div>
                          <button
                            type="button"
                            class="btn btn-sm bg-secondary-subtle border-violet deleteButton"
                            data-id="${request.reorder_id}"
                          >
                            <img
                              src="src/icon/trash (1).png"
                              alt=""
                              width="12px"
                              data-id="${request.reorder_id}"
                            />
                          </button>
                        </div>
                      </div>
                      ${getUpdateRequest(request, vendor, product)}
                    </td>
                  </tr>`;
}

function getUpdateRequest(request, vendor, product){
    return `
    <!-- Update -->
       <div
      class="offcanvas offcanvas-end"
      style="
        height: fit-content;
        border-radius: 20px;
        margin-top: 15px !important;
      "
      tabindex="-1"
      id="updateQuantityRequest${request.reorder_id}"
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
      <div class="col-6"><small class="color">Product Name</small>
        <div class="mb-2">${product.product_name}</div>
        <small class="color">Product Type</small>
        <div class="mb-2">${product.product_type}</div>
        </div>
      <div class="col-6"><small class="color">Brand</small>
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

        <form id="update_form${request.reorder_id}">
         <div class="form-floating mb-3">
            <input
              type="text"
              class="form-control"
              id="order_type"
              placeholder="order_type"
              name="order_type"
              required
            />
            <label for="quantity">Order Type (Wholesale or Per unit)</label>
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
            <label for="quantity">Input quantity to reorder</label>
          </div>
          <div>
            <button type="submit" class="btn bg w-100 text-white updateReorderButton" data-id="${request.reorder_id}" id="updateReorder${request.reorder_id}">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
    `
}

const search_form = document.getElementById("search_form");
search_form.onsubmit = async (e) => {
    e.preventDefault(); 

    const formData = new FormData(search_form); 
    const keyword = formData.get("keyword");
    console.log(keyword); 
    getRequests("", keyword);
}

const pageAction = async (e) => {
  e.preventDefault();
  const url = e.target.getAttribute("data-url");
  await getRequests(url);
}

function updateReorderClick(e) {
    const id = e.target.getAttribute("data-id");
    console.log(id);
    reorderInfo(id);
}

function deleteClick(e) {
    const id = e.target.getAttribute("data-id");
    console.log(id);
    deleteInfo(id);
}


async function reorderInfo(id) {
    const reorder_form = document.getElementById("update_form" + id);

    if (!reorder_form) return;

      reorder_form.onsubmit = async (e) => {
          e.preventDefault();

          const reorderButton = document.querySelector("#updateReorder" + id);
          reorderButton.disabled = true;
          reorderButton.innerHTML = `Updating...`;

          const formData = new FormData(reorder_form);

          for (let [key, value] of formData.entries()) {
              console.log(key, value);
          }
          
          formData.append('_method', 'PUT');
          const reorderResponse = await fetch(backendURL + "/api/reorder-quantity/" + id, {
              method: "POST",
              headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: formData,
          });

          if(!reorderResponse.ok) throw new Error ("Error updating request")

          else if(reorderResponse.ok) {
              alert("Reorder Request updated successfully")
              await getRequests();
          }

          reorderButton.disabled = false;
          reorderButton.innerHTML = `Update`;
      }
  }

  async function deleteInfo(id) {
    if (confirm("Are you sure you want to delete this event item?")) {
        const inventoryResponse = await fetch(backendURL + "/api/reorder-request/" + id, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
        });
            
        if(!inventoryResponse.ok) throw new Error ("Error deleting product")

        else if(inventoryResponse.ok) {
          alert("Inventory Delete Success")
            await getRequests();
        }
    }
  }

getRequests();