import { backendURL } from "../utils/utils.js";

const getCustomerForm = document.getElementById("form_register");

getCustomerForm.onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(getCustomerForm);

    // for (let [key, value] of formData.entries()) {
    //     console.log(key, value);
    // }

    const registerButton = document.querySelector("#form_register button");

    registerButton.disabled = true;
    registerButton.innerHTML =`<div class="spinner-border spinner-border-sm" role="status" style="width: 20px; height: 20px;"></div>
    <span class="ms-2">Loading...</span>
`;

    const registerResponse = await fetch(backendURL + "/api/customer", {
        method: "POST",
        headers: {
            Accept: "application/json"
        },
        body: formData,
    });

    const registerData = await registerResponse.json();

    if (!registerResponse.ok) {
        alert(`${registerData.message}`)
        registerButton.disabled = false;
        registerButton.innerHTML = `Create an account`;
        throw new Error ("Couldn't register")
    }else{
        alert(`Registration successful!`);
        getCustomerForm.reset(); 
        window.location.pathname = "/index.html";
    }

    registerButton.disabled = false;
    registerButton.innerHTML = `Create an account`;
}