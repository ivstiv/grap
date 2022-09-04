let isSidenavVisible = window.innerWidth > 1023;
const navToggles = [...document.querySelectorAll(".nav-toggle")];
const navigation = document.querySelector("aside");

const toggleNavigation = () => {
  isSidenavVisible = !isSidenavVisible;
  const value = isSidenavVisible ? "0" : "-100%";
  navigation.style.transform = `translateX(${value})`;
};

navToggles.forEach(el => el.addEventListener("click", toggleNavigation));
document.addEventListener("click", event => {
  if(window.innerWidth > 1023) {
    return;
  }

  const isClickInsideNav = navigation.contains(event.target);
  const isClickOnToggle = navToggles.some(el => el.contains(event.target));
  if (isSidenavVisible && !isClickInsideNav && !isClickOnToggle) {
    toggleNavigation();
  }
});

// if the sidebar was toggled off with js and resized
// back to large screen we need to reset the state
addEventListener("resize", () => {
  if (!isSidenavVisible && window.innerWidth > 1023) {
    toggleNavigation();
  }
  if (isSidenavVisible && window.innerWidth < 1023) {
    toggleNavigation();
  }
});
