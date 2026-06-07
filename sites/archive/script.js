var buttons = Array.prototype.slice.call(document.querySelectorAll(".view-button"));
var menuToggle = document.querySelector(".menu-toggle");
var nav = document.querySelector("#site-nav");
var navItems = Array.prototype.slice.call(document.querySelectorAll(".nav-item"));
var loaderNumber = document.querySelector(".loader-number");
var loadingTimer = 0;

function setView(view) {
  document.body.setAttribute("data-view", view);
  buttons.forEach(function (button) {
    var active = button.getAttribute("data-view") === view;
    if (active) {
      button.classList.add("is-active");
    } else {
      button.classList.remove("is-active");
    }
    button.setAttribute("aria-pressed", String(active));
  });
}

buttons.forEach(function (button) {
  button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
  button.addEventListener("click", function () {
    setView(button.getAttribute("data-view"));
  });
});

if (menuToggle) {
  menuToggle.addEventListener("click", function () {
    var open = !document.body.classList.contains("menu-open");
    if (open) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    menuToggle.setAttribute("aria-expanded", String(open));
  });
}

function setActiveNav(link) {
  navItems.forEach(function (item) {
    if (item === link) {
      item.classList.add("nav-active");
    } else {
      item.classList.remove("nav-active");
    }
  });
}

function runLoader(next) {
  window.clearInterval(loadingTimer);
  var value = 0;
  if (loaderNumber) {
    loaderNumber.textContent = "0";
  }
  document.body.classList.add("is-loading");

  loadingTimer = window.setInterval(function () {
    value += Math.ceil((100 - value) / 7);
    if (value >= 100) {
      value = 100;
      window.clearInterval(loadingTimer);
      if (loaderNumber) {
        loaderNumber.textContent = "100";
      }
      window.setTimeout(function () {
        next();
        document.body.classList.remove("is-loading");
      }, 130);
      return;
    }
    if (loaderNumber) {
      loaderNumber.textContent = String(value);
    }
  }, 34);
}

if (nav) {
  nav.addEventListener("click", function (event) {
    var targetNode = event.target;
    if (targetNode && targetNode.tagName === "A") {
      event.preventDefault();
      var link = targetNode;
      var href = link.getAttribute("href");
      var target = document.querySelector(href);

      document.body.classList.remove("menu-open");
      if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", "false");
      }

      runLoader(function () {
        setActiveNav(link);
        if (target && target.getBoundingClientRect) {
          var previousScrollBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = "auto";
          window.scrollTo(0, target.getBoundingClientRect().top + window.pageYOffset);
          window.setTimeout(function () {
            document.documentElement.style.scrollBehavior = previousScrollBehavior;
          }, 0);
        }
        if (window.history && window.history.pushState) {
          window.history.pushState(null, "", href);
        } else {
          window.location.hash = href;
        }
      });
    }
  });
}
