import { backendURL, headers, logout } from '../utils/utils.js';

logout();
async function getOrders(url="", keyword){
    const getOrdersList = document.getElementById('getOrdersList');

    let queryParams = 
    "?" + 
    (url ? new URL(url).searchParams + "&" : "") + 
    (keyword ? "keyword=" + encodeURIComponent(keyword) : "");

    const orderResponse = await fetch(url || backendURL + '/api/order/user' + queryParams, { headers });
    const customerResponse = await fetch(backendURL + '/api/customer', { headers });
    const productResponse = await fetch(backendURL + '/api/product/all', { headers });

    if(!orderResponse.ok) {
        throw new Error("Can't fetch order data");
    }
    if(!customerResponse.ok) {
        throw new Error("Can't fetch customer data");
    }
    if(!productResponse.ok) {
        throw new Error("Can't fetch product data");
    }

    const orderData = await orderResponse.json();
    const customerData = await customerResponse.json();
    const productData = await productResponse.json();

    if(orderResponse.ok){
        let hasOrder = false, orderHTML = "", i = 0;

       const orders = orderData?.data;

        orders?.forEach(order => {
            const customer = customerData.find(c => c.customer_id === order.customer_id);
            const product = productData.find(p => p.product_id === order.product_id);
            hasOrder = true;
            i++;

            orderHTML += getOrderHTML(order, customer, product, i);
        });
        getOrdersList.innerHTML = orderHTML;

        if(!hasOrder){
            document.getElementById("noOrderFound").innerHTML = 
            `<div class="text-center my-4">No order found.</div>`;
        }

        let pagination = "";
        if (orderData.links) {
            orderData.links.forEach((link) => {
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

function getOrderHTML(order, customer, product, index) {
    return`<tr>
                    <td class="fw-bold">${index}</td>
                    <td>${product.product_name}</td>
                    <td>${customer.is_frequent_shopper ? `${customer.first_name} ${customer.last_name}` : `Anonymous`}</td>
                    <td>${customer.is_frequent_shopper ? customer.address : `Anonymous`}</td>
                    <td>${customer.is_frequent_shopper ? customer.phone_number : `Anonymous`}</td>
                    <td>${order.quantity}</td>
                    <td>${order.price}</td>
                    <td>${order.shipping_cost}</td>
                    <td>${order.total_amount}</td>
                    <td>${order.payment_method}</td>
                    <td class="${order.status === "Accepted" 
                        ? `text-success` 
                        : order.status === "Declined" 
                        ? `text-danger` 
                        : order.status === "Shipped" 
                        ? `text-primary` 
                        : order.status === "Delivered" 
                        ? `text-success` 
                        : ``
                    }">  ${order.status}
                    </td>  
                    <td>${order.shipped_date === null ? `Waiting...` : order.shipped_date}</td>
                    <td>${order.delivered_date === null ? `Waiting...` : order.delivered_date}</td>
                    <td>
                      ${order.status ==="Pending" ? `<div>
                        <button
                          class="btn btn-sm btn-outline-success updateStatusButton"
                          data-id="${order.order_id}"
                          data-status="Accepted"
                        >
                          Accept
                        </button>
                        <button
                          class="btn btn-sm btn-outline-danger updateStatusButton"
                          data-id="${order.order_id}"
                          data-status="Declined"
                        >
                          decline
                        </button>
                      </div>` : ``}
                      <div>
                       ${order.status === "Shipped" ? ` <button
                          class="btn btn-sm btn-outline-success updateStatusButton"
                          data-id="${order.order_id}"
                          data-status="Delivered"
                        >
                          Mark as Delivered
                        </button>` : ``}
                        ${order.status === "Accepted" ? `<button
                          class="btn btn-sm btn-outline-primary updateStatusButton"
                          data-id="${order.order_id}"
                          data-status="Shipped"
                        >
                          Mark as Shipped
                        </button>` : ``}
                      </div>
                    </td>
                  </tr>`
}

const search_form = document.getElementById("search_form");
search_form.onsubmit = async (e) => {
    e.preventDefault(); 

    const formData = new FormData(search_form); 
    const keyword = formData.get("keyword");
    console.log(keyword); 
    getOrders("", keyword);
}

const pageAction = async (e) => {
  e.preventDefault();
  const url = e.target.getAttribute("data-url");
  await getOrders(url);
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
        }

        formData.append("_method", "PUT");

            const reorderResponse = await fetch(backendURL + "/api/order-status/" + id, {
                method: "POST", headers, body: formData,
            });
              
            if (!reorderResponse.ok) throw new Error ("Failed to update order status");

            if (reorderResponse.ok) {
                await getOrders(); 
            }
        }
    }

getOrders();