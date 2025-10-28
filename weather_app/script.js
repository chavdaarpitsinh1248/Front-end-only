// ----------------- API & DOM -----------------

// ======================= Weather App with Sun/Moon Animation =======================

// 🔑 Replace with your own OpenWeatherMap API key
const API_KEY = "f7a514374c175b536e2d1261afd5cc30";

document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.getElementById("searchBtn");
    const cityInput = document.getElementById("cityInput");

    searchBtn.addEventListener("click", () => {
        const city = cityInput.value.trim();
        if (city) fetchWeather(city);
    });

    cityInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const city = cityInput.value.trim();
            if (city) fetchWeather(city);
        }
    });
});

// ======================= FETCH WEATHER =======================
async function fetchWeather(city) {
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        const data = await res.json();

        if (data.cod !== 200) {
            alert("City not found!");
            return;
        }

        // Calculate accurate local time for the city
        const utcSeconds = data.dt + data.timezone;
        const cityTime = new Date(utcSeconds * 1000);
        const hours = cityTime.getUTCHours();
        const minutes = cityTime.getUTCMinutes();

        // Update display + background + animation
        updateSky(hours, minutes);

    } catch (err) {
        console.error(err);
        alert("Error fetching weather data.");
    }
}

// ======================= SKY + SUN/MOON MOVEMENT =======================
function updateSky(hours, minutes) {
    const sky = document.querySelector(".sky");
    const sunMoon = document.querySelector(".sun_moon");
    const stars = document.querySelector(".stars");

    if (!sky || !sunMoon) return; // stop if elements not found

    const minsOfDay = hours * 60 + minutes;

    const dayStart = 6 * 60;    // 6:00 AM
    const dayEnd = 19 * 60;     // 7:00 PM
    const nightStart = 19 * 60 + 1;
    const nightEnd = 5 * 60 + 59;

    let isDay = minsOfDay >= dayStart && minsOfDay <= dayEnd;
    let progress = 0;

    if (isDay) {
        const dayDuration = dayEnd - dayStart;
        progress = (minsOfDay - dayStart) / dayDuration;
    } else {
        const totalNight =
            (24 * 60 - nightStart) + (nightEnd + 1);
        let passedNight;
        if (minsOfDay >= nightStart) {
            passedNight = minsOfDay - nightStart;
        } else {
            passedNight = (minsOfDay + 24 * 60) - nightStart;
        }
        progress = passedNight / totalNight;
    }

    progress = Math.max(0, Math.min(1, progress));

    // Compute movement: right → left + arc
    const left = (1 - progress) * 100; // percent of width
    const heightArc = Math.sin(progress * Math.PI) * 25; // curved path
    const bottomVh = 10 + heightArc;

    sunMoon.style.left = `${left}vw`;
    sunMoon.style.bottom = `${bottomVh}vh`;

    // Toggle appearance
    if (isDay) {
        sky.classList.add("day-sky");
        sky.classList.remove("night-sky");
        sunMoon.classList.add("sun");
        sunMoon.classList.remove("moon");
        if (stars) stars.innerHTML = ""; // remove stars
    } else {
        sky.classList.add("night-sky");
        sky.classList.remove("day-sky");
        sunMoon.classList.add("moon");
        sunMoon.classList.remove("sun");
        if (stars && stars.children.length === 0) createStars(stars);
    }
}

// ======================= CREATE TWINKLING STARS =======================
function createStars(container) {
    const count = 70;
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const s = document.createElement("div");
        s.className = "star";
        s.style.top = `${Math.random() * 100}%`;
        s.style.left = `${Math.random() * 100}%`;
        s.style.width = s.style.height = `${Math.random() * 2 + 1}px`;
        s.style.animationDelay = `${Math.random() * 3}s`;
        container.appendChild(s);
    }
}
