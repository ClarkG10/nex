import { backendURL, headers, logout } from '../utils/utils.js';

logout()

async function getSalesData(url ="", keyword){
    const getSalesDatas = document.getElementById('getSalesDatas');

    let queryParams = 
    "?" + 
    (url ? new URL(url).searchParams + "&" : "") + 
    (keyword ? "keyword=" + encodeURIComponent(keyword) : "");

    const salesResponse = await fetch(url || backendURL + '/api/sales/store' + queryParams, { headers });
    const productsResponse = await fetch(backendURL + '/api/product/all', { headers });
    const customersResponse = await fetch(backendURL + '/api/customer', { headers });


    if (!salesResponse.ok) {
        throw new Error('Failed to fetch sales data');
    }
    if (!productsResponse.ok) {
        throw new Error('Failed to fetch products data');
    }
    if (!customersResponse.ok) {
        throw new Error('Failed to fetch customers data');
    }

    const salesData = await salesResponse.json();
    const productsData = await productsResponse.json();
    const customersData = await customersResponse.json();

    console.log(salesData, productsData, customersData);
    
    if(salesResponse.ok){
        let hasSales = false, index = 0;
        let salesHTML = "";

        salesData.data.forEach(sale => {
            const customer = customersData.find(customer => customer.customer_id === sale.customer_id);
            const product = productsData.find(product => product.product_id === sale.product_id);
            hasSales = true;
            index++;
            
            salesHTML += getSalesHTML(sale, index, customer, product);
        });

        getSalesDatas.innerHTML = salesHTML;

        let pagination = "";
            if (salesData.links) {
                salesData.links.forEach((link) => {
                    pagination += `
                        <li class="page-item" >
                            <a class="page-link ${link.url == null ? " disabled" : ""}${link.active ? " active" : ""}" href="#" data-url="${link.url}">
                                ${link.label}
                            </a>
                        </li>`;
                });
            }

        if(!hasSales) {
            document.getElementById('noSalesFound').innerHTML = `              
            <!-- <div class="text-center my-4">No Sales Yet.</div> -->`
        }

        document.getElementById("pages").innerHTML = pagination;

        document.querySelectorAll("#pages .page-link").forEach((link) => {
        link.addEventListener("click", pageAction);
    });
    }
}

function getSalesHTML(sale, index, customer, product) {
    return `<tr>
                <td class="fw-bold">${index}</td>
                <td>${product.product_name}</td>
                <td>${product.product_type}</td>
                <td>${product.brand}</td>
                <td>${customer.is_frequent_shopper ? `${customer.first_name} ${customer.last_name}` : `Anonymous`}</td>
                <td>${customer.is_frequent_shopper ? `${customer.address}` : `Anonymous`}</td>
                <td>${customer.is_frequent_shopper ? `${customer.phone_number}` : `Anonymous`}</td>
                <td>${sale.quantity}</td>
                <td>${sale.price}</td>
                <td>${sale.total_amount}</td>
                <td>${sale.payment_method}</td>
              </tr>`
}

getSalesData();

const search_form = document.getElementById("search_form");
search_form.onsubmit = async (e) => {
    e.preventDefault(); 

    const formData = new FormData(search_form); 
    const keyword = formData.get("keyword");
    console.log(keyword); 
    getSalesData("", keyword);
}

const pageAction = async (e) => {
  e.preventDefault();
  const url = e.target.getAttribute("data-url");
  await getSalesData(url);
}