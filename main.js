 // ----  main javascript ---- //
 function tryNow() {
    alert(" The World's Next Big Crypto is Hare. Thanks for starting")
  }
  const timerElement = document.getElementById('timer');
  
// ---- Set the target time to 120 days from now ---- //

const now = new Date();
const targetDate = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);

function updateTimer() {
  const currentTime = new Date();
const diff = targetDate - currentTime;


  if (diff <= 0) {
    timerElement.textContent = '00 : 00 : 00 : 00';
    clearInterval(timerInterval);
    return;
  }
}

// ------ main page to login page file link ------ //

function login(event) {
    
      window.location.assign('login.html');
    } 

// ------ main page to Registation  page link ------ //


function Register(event) {
    
      window.location.assign('login.html');
    } 

// ---- login & Registation page ---- // 
const container = document.querySelector('.container');
const registerbtn = document.querySelector('.register-btn');
const loginbtn = document.querySelector('.login-btn');

registerbtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginbtn.addEventListener('click', () => {
    container.classList.remove('active');
});

//  Add new code (Login / Registation functionality ) //
const API_BASE_URL = "http://toant.store"; // ◀◀ YOUR INPUT: Backend server URL //

// ----  Login Form handler ---- //
document.querySelector("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("Username").value;
    const password = document.getElementById("Password").value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (data.success) {
            localStorage.setItem("userData", JSON.stringify(data.user)); // User data center //


            localStorage.setItem("token",data.token) //  new add to chat gpt  //

            alert("Login successful!");
            window.location.href = "dashboard.html"; // ◀◀ YOUR INPUT: Home page URL //
        } else {
            alert(data.message || "Login failed!");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

// ---- Registration Form handler ---- //
document.querySelector(".form-box.register form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    const referralCode = document.getElementById("referralCodeInput").value; 
    try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password, referralCode }),
        });

        const data = await response.json();
        if (data.success) {
            localStorage.setItem("userData", JSON.stringify(data.user));
            alert("Registration successful! Please login.");
            container.classList.remove('active'); // Switch to login form //
        } else {
            alert(data.message || "Registration failed!");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});
