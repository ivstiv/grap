const themes = {
  light: {
    "--primary-color": "#5a29e4",
    "--background-color": "#fff",
    "--font-color": "#1f1c24",
    "--primary-shadow-color": "#5b29e45d",
  },
  dark: {
    "--primary-color": "#1DDECB",
    "--background-color": "#1D2025",
    "--font-color": "#1DDECB",
    "--primary-shadow-color": "#0a4640",
  },
};

const themeToggle = document.querySelector("#theme-toggle");

themeToggle.addEventListener("click", () => {
  const theme = localStorage.getItem("theme") ?? "light";
  const isLight = theme === "light";
  localStorage.setItem("theme", isLight ? "dark" : "light");
  updateTheme();
});

const updateTheme = () => {
  const theme = localStorage.getItem("theme") ?? "light";
  if (theme === "light") {
    themeToggle.innerText = "🌞";
  } else {
    themeToggle.innerText = "🌚";
  }
  const currentTheme = themes[theme];
  for(const key in currentTheme) {
    document.documentElement.style.setProperty(key, currentTheme[key]);
  }
};

updateTheme();
