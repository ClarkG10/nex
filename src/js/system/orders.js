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
    const cartResponse = await fetch(backendURL + '/api/carts/storeIndex', { headers });

    if(!orderResponse.ok) {
        throw new Error("Can't fetch order data");
    }
    if(!customerResponse.ok) {
        throw new Error("Can't fetch customer data");
    }
    if(!productResponse.ok) {
        throw new Error("Can't fetch product data");
    }
    if(!cartResponse.ok) {
        throw new Error("Can't fetch cart data");
    }

    const orderData = await orderResponse.json();
    const customerData = await customerResponse.json();
    const productData = await productResponse.json();
    const cartData = await cartResponse.json();

    if(orderResponse.ok){
        let hasOrder = false, orderHTML = "", i = 0;

       const orders = orderData?.data;

        orders?.forEach(order => {
            const customer = customerData.find(c => c.customer_id === order.customer_id);
            const cart = cartData.find(c => c.id === order.cart_id);
            let orderedProduct = "";

            cart.items.forEach(c => {
                const product = productData.find(p => p.product_id === c.product_id);

                orderedProduct += `${product.product_name}(qty:${c.quantity}) `
            })

            hasOrder = true;
            i++;

            orderHTML += getOrderHTML(order, customer, orderedProduct, i);
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

function getOrderHTML(order, customer, products, index) {
    return`<tr>
                    <td class="fw-bold">${index}</td>
                    <td>${products}</td>
                    <td>${customer.first_name} ${customer.last_name}</td>
                    <td>${customer.address}</td>
                    <td>${customer.phone_number}</td>
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
                          Decline
                        </button>
                      </div>` : ``}
                      <div>
                       ${order.status === "Shipped" ? ` <button
                          class="btn btn-sm btn-outline-success updateStatusButton"
                          data-id="${order.order_id}" 
                          cart-id="${order.cart_id}"  
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
    const cartId = e.target.getAttribute("cart-id");
    console.log(id, status, cartId);
    updateRequestStatus(id, status, cartId);
}


async function updateRequestStatus(id, status, cartId) {
    if (confirm(`Are you sure you want to this?`)) {
        const formData = new FormData();
        formData.append("status", status);
        const currentDate = new Date().toISOString().split("T")[0];

        if (status === "Shipped") {
            formData.append("shipped_date", currentDate);
        } else if (status === "Delivered") {
            storeAsSale(cartId);
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

    async function storeAsSale(cartId) {
          const cartResponse = await fetch(`${backendURL}/api/carts/show/${cartId}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
      
          if (!cartResponse.ok) {
            const errorDetails = await cartResponse.text();
            throw new Error(`Failed to fetch cart data: ${errorDetails}`);
          }
      
          const cartData = await cartResponse.json();
      
          // console.log("Fetched Cart Data:", cartData);
          console.log("Fetched Cart Items:", cartData.items);
      
          const items = cartData.items;

          for (const item of items) {
            const saleData = {
              customer_id: cartData.customer_id,
              store_id: cartData.store_id,
              price: Number(item.price),
              product_id: item.product_id,
              quantity: Number(item.quantity),
              total_amount: Number(item.price) * Number(item.quantity),
            };
      
            console.log("Sending Sale Data:", saleData);
      
            const saleResponse = await fetch(`${backendURL}/api/sales`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify(saleData),
            });
      
            if (!saleResponse.ok) {
              const errorDetails = await saleResponse.text();
              throw new Error(`Failed to create sale data: ${errorDetails}`);
            }
      
            console.log("Sale data created successfully for product:", item.product_id);
          }
      }

getOrders();