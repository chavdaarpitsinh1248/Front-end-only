// ----------------- API & DOM -----------------
const apiKey = "f7a514374c175b536e2d1261afd5cc30"; // Replace with your OpenWeatherMap API key

const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const icon = document.getElementById("icon");
const unitBtn = document.getElementById("unitBtn");

// ----------------- Temperature State -----------------
let currentTempC = null; // Store temperature in Celsius
let isCelsius = true;    // Current unit state

// ----------------- Fetch Weather -----------------
function fetchWeather(city) {
    if (city === "") {
        alert("Please enter a city name");
        return;
    }

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
        .then(response => response.json())
        .then(data => {
            if (data.cod === "404") {
                alert("City not found");
                return;
            }

            // ----------- Update Weather Info -----------
            cityName.innerText = data.name + ", " + data.sys.country;
            currentTempC = data.main.temp;
            isCelsius = true;
            temperature.innerText = `${currentTempC}°C`;
            description.innerText = data.weather[0].description;
            humidity.innerText = `Humidity: ${data.main.humidity}%`;
            wind.innerText = `Wind: ${data.wind.speed} m/s`;
            icon.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
            icon.alt = data.weather[0].description;
            unitBtn.innerText = "Show in °F";
            cityInput.value = "";

            // ----------- Dynamic Weather Background & Icon -----------
            const weatherMain = data.weather[0].main.toLowerCase();
            document.body.className = ""; // reset classes

            if (weatherMain.includes("clear")) {
                document.body.classList.add("clear");
                icon.className = "sunny";
            } else if (weatherMain.includes("cloud")) {
                document.body.classList.add("clouds");
                icon.className = "cloudy";
            } else if (weatherMain.includes("rain") || weatherMain.includes("drizzle")) {
                document.body.classList.add("rain");
                icon.className = "rainy";
            } else if (weatherMain.includes("snow")) {
                document.body.classList.add("snow");
                icon.className = "";
            } else if (weatherMain.includes("thunderstorm")) {
                document.body.classList.add("thunderstorm");
                icon.className = "";
            } else if (weatherMain.includes("mist") || weatherMain.includes("fog") || weatherMain.includes("haze")) {
                document.body.classList.add("mist");
                icon.className = "";
            } else {
                document.body.classList.add("clear");
                icon.className = "sunny";
            }

            // ----------- Day/Night Theme -----------
            const localTime = new Date((data.dt + data.timezone) * 1000);
            const hours = localTime.getUTCHours();
            document.body.classList.remove("day", "night");
            if (hours >= 6 && hours < 18) {
                document.body.classList.add("day");
            } else {
                document.body.classList.add("night");
            }

        })
        .catch(error => {
            console.error(error);
            alert("Error fetching weather data");
        });
}

// ----------------- Search Events -----------------
searchBtn.addEventListener("click", () => {
    fetchWeather(cityInput.value.trim());
});

cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        fetchWeather(cityInput.value.trim());
    }
});

// ----------------- Unit Toggle -----------------
unitBtn.addEventListener("click", () => {
    if (currentTempC === null) return;

    if (isCelsius) {
        // Convert to Fahrenheit
        const tempF = (currentTempC * 9 / 5 + 32).toFixed(1);
        temperature.innerText = `${tempF}°F`;
        unitBtn.innerText = "Show in °C";
        isCelsius = false;
    } else {
        // Show Celsius
        temperature.innerText = `${currentTempC}°C`;
        unitBtn.innerText = "Show in °F";
        isCelsius = true;
    }
});

