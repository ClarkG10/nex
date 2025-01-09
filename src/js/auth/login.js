import { backendURL, determineUserAccess } from "../utils/utils.js";


const form_login = document.getElementById('form_login');

form_login.onsubmit = async (e) => {
    e.preventDefault();
    
    const loginButton =  document.querySelector("#form_login button");

    loginButton.disabled = true;
    loginButton.innerHTML = `
    <div class="spinner-border spinner-border-sm" role="status" style="width: 20px; height: 20px;"></div>
    <span class="ms-2">Loading...</span>
`;
  
    const formData = new FormData(form_login);

    // for (let [key, value] of formData.entries()) {
    //     console.log(key, value);
    // }
  
    const loginResponse = await fetch(backendURL + "/api/login", {
      method: "POST", 
      headers: {
        Accept: "application/json",
      }, body: formData, 
    }); 
  
    const loginData = await loginResponse.json();
  
    if (loginResponse.ok) {
      localStorage.setItem("token", loginData.token);
      form_login.reset();
      await determineUserAccess();
    } else {
      alert(loginData.message);
    }
    loginButton.disabled = false;
    loginButton.innerHTML = `Login`;
  };