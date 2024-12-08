import { backendURL, headers, logout } from '../utils/utils.js';

logout();

async function getRequests(url='', keyword) {
    const getRequests = document.getElementById('getRequests');

    let queryParams = 
    "?" + 
    (url ? new URL(url).searchParams + "&" : "") + 
    (keyword ? "keyword=" + encodeURIComponent(keyword) : "");
    
    const reorderResponse = await fetch (url || backendURL + "/api/reorder-request/user" + queryParams, { headers, });
    const storeResponse = await fetch (backendURL + "/api/user", { headers, });
    const productResponse = await fetch (backendURL + "/api/product/all", { headers, });

    const reorderData = await reorderResponse.json();
    const storeData = await storeResponse.json();
    const productData = await productResponse.json();

    if(!reorderResponse.ok) throw new Error ("Request fetch failed");
    if(!storeResponse.ok) throw new Error ("Store Data fetch failed");
    if(!productResponse.ok) throw new Error ("Product Data fetch failed");

    if(reorderResponse.ok){
    let requestHTML = "", hasRequest = false;

    reorderData.data.forEach(storeOrder => {
        const storeRequestData = storeData.find(store => store.id == storeOrder.store_id);
        const productRequestData = productData.find(product => product.product_id == storeOrder.product_id);

        hasRequest = true;
        requestHTML += getRequestHTML(storeOrder, storeRequestData, productRequestData);
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

    document.querySelectorAll(".updateStatusButton").forEach(button => {
        button.addEventListener("click", updateClickStatus);
    });

    document.getElementById("pages").innerHTML = pagination;

    document.querySelectorAll("#pages .page-link").forEach((link) => {
        link.addEventListener("click", pageAction);
    });
    
    }
}

function getRequestHTML(storeOrder, store, product){
    return `<tr>
          <td>${store.business_name}</td>
          <td>${product.product_name}</td>
          <td>${product.brand}</td>
          <td>${product.product_type}</td>
          <td>${storeOrder.order_type}</td>
          <td>${storeOrder.quantity}</td>
          <td class="${
              storeOrder.status === "Approved" 
                  ? `text-success` 
                  : storeOrder.status === "Declined" 
                  ? `text-danger` 
                  : storeOrder.status === "Shipped" 
                  ? `text-primary` 
                  : storeOrder.status === "Delivered" 
                  ? `text-success` 
                  : ``
          }">
              ${storeOrder.status}
          </td>          
          <td>${storeOrder.shipped_date == null ? `Waiting...` : storeOrder.shipped_date}</td>
          <td>${storeOrder.delivered_date == null ? `Waiting...` : storeOrder.delivered_date}</td>
          <td style="width: 190px">
            <div class="d-flex">
             ${storeOrder.status == "Pending" ? ` 
            <!-- approve button -->
              <div class="me-1">
                <button type="button" class="btn btn-sm btn-outline-success updateStatusButton" data-status="Approved" data-id="${storeOrder.reorder_id}">
                  Approve
                </button>
              </div>
              <!-- approve button -->
              <!-- decline button -->
              <div>
                <button type="button" class="btn btn-sm btn-outline-danger updateStatusButton" data-status="Declined" data-id="${storeOrder.reorder_id}">
                  Decline
                </button>
              </div>
              <!-- decline button -->`: ``}
            </div>

            ${storeOrder.status == "Approved" ? `      
            <div class="d-flex">
            <!-- shipped button -->
           <div class="me-1">
              <button type="button" class="btn btn-sm btn-outline-primary updateStatusButton" data-status="Shipped" data-id="${storeOrder.reorder_id}">
                Mark as Shipped
              </button>
            </div> 
            <!-- shipped button -->
            <!-- undo button -->
            <div>
              <button type="button" class="btn btn-sm btn-outline-secondary updateStatusButton" data-status="Undo" data-id="${storeOrder.reorder_id}">
                Undo
              </button>
            </div>
            <!-- undo button -->
            </div>
            ` : ``}

             ${storeOrder.status == "Shipped" ? `
            <!-- delivered button -->
            <div class="me-1">
              <button type="button" class="btn btn-sm btn-outline-success updateStatusButton" data-status="Delivered" data-id="${storeOrder.reorder_id}">
                Mark as Delivered
              </button>
            </div> 
            <!-- delivered button -->
            ` : ``}
                ${storeOrder.status == "Declined" ? ` <!-- undo button -->
            <div>
              <button type="button" class="btn btn-sm btn-outline-secondary updateStatusButton" data-status="Undo" data-id="${storeOrder.reorder_id}">
                Undo
              </button>
            </div>
            <!-- undo button -->` : `` }
          </td>
        </tr>`;
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

function updateClickStatus(e) {
    const id = e.target.getAttribute("data-id");
    const status = e.target.getAttribute("data-status");
    console.log(id, status);
    updateRequestStatus(id, status);
}


async function updateRequestStatus(id, status) {
    if (confirm(`Are you sure you want to this?`)) {
        const formData = new FormData();
        formData.append("status", status);
        const currentDate = new Date().toISOString().split("T")[0];

        if (status === "Shipped") {
            formData.append("shipped_date", currentDate);
        } else if (status === "Delivered") {
            formData.append("delivered_date", currentDate);
        } else if (status === "Undo") {
            formData.set("status", "Pending"); 
        }

  
        formData.append("_method", "PUT");

            const reorderResponse = await fetch(backendURL + "/api/reorder-request/" + id, {
                method: "POST", headers, body: formData,
            });
              
            if (!reorderResponse.ok) throw new Error ("Failed to update request status");

            if (reorderResponse.ok) {
                await getRequests(); 
            }
        }
    }

getRequests();