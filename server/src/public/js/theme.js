

const isDarkThemeLocalStorage = localStorage.getItem("theme") === "dark";
const isDarkThemePreference = window?.matchMedia("(prefers-color-scheme: dark)")?.matches ?? false;
const isThemeInitialised = localStorage.getItem("theme") !== null;
let isDarkTheme = isThemeInitialised ? isDarkThemeLocalStorage : isDarkThemePreference;

const updateThemeInDOM = () => {
  document.documentElement.classList.remove(isDarkTheme ? "light" : "dark");
  document.documentElement.classList.add(isDarkTheme ? "dark" : "light");
};

const toggleTheme = () => {
  isDarkTheme = !isDarkTheme;
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  updateThemeInDOM();
};

const themeToggles = [...document.querySelectorAll(".theme-toggle")];
themeToggles.forEach(el => el.addEventListener("click", toggleTheme));

// apply theme initially
updateThemeInDOM();
