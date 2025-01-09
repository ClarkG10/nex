import { backendURL, headers, logout } from '../utils/utils.js';

logout();

async function getSalesData(url = "", keyword) {
    const getSalesDatas = document.getElementById('getSalesDatas');
    const salesDateInput = document.getElementById("salesDate");

    let queryParams = 
        "?" + 
        (url ? new URL(url).searchParams + "&" : "") + 
        (keyword ? "keyword=" + encodeURIComponent(keyword) : "");

    try {
        const [salesResponse, productsResponse, customersResponse, frequentProductsResponse, salesByStoreResponse] = await Promise.all([
            fetch(url || backendURL + '/api/sales/store' + queryParams, { headers }),
            fetch(backendURL + '/api/product/all', { headers }),
            fetch(backendURL + '/api/customer', { headers }),
            fetch(backendURL + '/api/frequent-shopper', { headers }),
            fetch(backendURL + '/api/sales/by-store/all', { headers })
        ]);

        if (!salesResponse.ok || !productsResponse.ok || !customersResponse.ok || 
            !frequentProductsResponse.ok || !salesByStoreResponse.ok) {
            throw new Error('Failed to fetch one or more resources');
        }

        const [salesData, productsData, customersData, frequentProductsData, salesByStoreData] = await Promise.all([
            salesResponse.json(),
            productsResponse.json(),
            customersResponse.json(),
            frequentProductsResponse.json(),
            salesByStoreResponse.json()
        ]);

        let filteredSalesData = salesData.data;

        salesDateInput.addEventListener("change", (event) => {
            const selectedDate = event.target.value;

            if (selectedDate) {
                const parsedDate = new Date(selectedDate);
                filteredSalesData = salesByStoreData.filter(sale =>
                    new Date(sale.created_at).toDateString() === parsedDate.toDateString()
                );
                renderSales(filteredSalesData, customersData, productsData, frequentProductsData, "");
            } else {
                renderSales(salesData.data, customersData, productsData, frequentProductsData, getPaginationHTML(salesData.links));
            }
        });

        renderSales(filteredSalesData, customersData, productsData, frequentProductsData, getPaginationHTML(salesData.links));

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function renderSales(filteredSalesData, customersData, productsData, frequentProductsData, paginationHTML) {
    const { salesHTML, hasSales } = processSalesData(filteredSalesData, customersData, productsData, frequentProductsData);
    updateSalesUI(salesHTML, hasSales, paginationHTML);
}

function processSalesData(filteredSalesData, customersData, productsData, frequentProductsData) {
    let salesHTML = "", hasSales = false, index = 0;

    filteredSalesData.forEach(sale => {
        const customer = customersData.find(c => c.customer_id === sale.customer_id);
        const product = productsData.find(p => p.product_id === sale.product_id);
        const frequentShopperEntry = frequentProductsData.find(fs => fs.store_id === sale.store_id && fs.customer_id === sale.customer_id);
        hasSales = true;
        index++;
        salesHTML += getSalesHTML(sale, index, customer, product, frequentShopperEntry);
    });

    return { salesHTML, hasSales };
}

function updateSalesUI(salesHTML, hasSales, paginationHTML = "") {
    const getSalesDatas = document.getElementById('getSalesDatas');
    getSalesDatas.innerHTML = salesHTML;

    if (!hasSales) {
        document.getElementById('noSalesFound').innerHTML = `<div class="text-center my-4">No Sales Yet.</div>`;
    } else {
        document.getElementById('noSalesFound').innerHTML = ""; 
    }

    document.getElementById("pages").innerHTML = paginationHTML;

    document.querySelectorAll("#pages .page-link").forEach(link => {
        link.addEventListener("click", pageAction);
    });
}

function getPaginationHTML(links) {
    let pagination = "";
    if (links) {
        links.forEach(link => {
            pagination += `
                <li class="page-item">
                    <a class="page-link ${link.url == null ? "disabled" : ""} ${link.active ? "active" : ""}" href="#" data-url="${link.url}">
                        ${link.label}
                    </a>
                </li>`;
        });
    }
    return pagination;
}

function getSalesHTML(sale, index, customer, product, frequentShopper) {
    return `<tr>
                <td class="fw-bold">${index}</td>
                <td>${product?.product_name || "N/A"}</td>
                <td>${product?.product_type || "N/A"}</td>
                <td>${product?.brand || "N/A"}</td>
                <td>${frequentShopper?.is_frequent_shopper ? `${customer?.first_name || "Unknown"} ${customer?.last_name || "User"}` : `Anonymous`}</td>
                <td>${frequentShopper?.is_frequent_shopper ? `${customer?.address || "N/A"}` : `Anonymous`}</td>
                <td>${frequentShopper?.is_frequent_shopper ? `${customer?.phone_number || "N/A"}` : `Anonymous`}</td>
                <td>${sale.quantity}</td>
                <td>${sale.price}</td>
                <td>${sale.total_amount}</td>
                <td>${sale.payment_method}</td>
            </tr>`;
}

const pageAction = async (e) => {
    e.preventDefault();
    const url = e.target.getAttribute("data-url");
    await getSalesData(url);
};

const search_form = document.getElementById("search_form");
search_form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(search_form);
    const keyword = formData.get("keyword");
    await getSalesData("", keyword);
};

getSalesData();
