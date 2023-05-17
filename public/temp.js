import { on, off, check } from "astro/dist/events";

const defaults = {
  breakpoint: 992,
  submenuTrigger: "hover",
  overlay: true,
  overlayColor: "rgba(0, 0, 0, 0.7)",
  autoSubmenuIndicator: true,
  submenuIndicatorTrigger: false,
  hideSubWhenClickOut: true,
  scrollMomentum: true,
  scrollSpy: false,
  scrollSpySpeed: 1000,
  scrollSpyOffset: 0,
  landscapeClass: "navigation-landscape",
  onInit: function () {},
  onLandscape: function () {},
  onShowOffCanvas: function () {},
  onHideOffCanvas: function () {},
};

function extend(target, options) {
  var prop,
    extended = {};
  for (prop in defaults) {
    if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
      extended[prop] = defaults[prop];
    }
  }
  for (prop in options) {
    if (Object.prototype.hasOwnProperty.call(options, prop)) {
      extended[prop] = options[prop];
    }
  }
  return extended;
}

function closestByClass(el, clazz) {
  while (el.tagName.toLowerCase() !== "html") {
    if (el.classList.length > 0 && el.classList.contains(clazz)) {
      return true;
    } else {
      el = el.parentNode;
    }
  }
  return false;
}

function windowWidth() {
  return (
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth
  );
}

class Navigation {
  constructor(element, options) {
    this.nav = element;
    this.options = extend(defaults, options);
    this.clickEvent = "click.link";
    this.bigScreenFlag = Number.MAX_VALUE;
    this.smallScreenFlag = 1;
    this.hoverEnabled = !matchMedia("(hover: none)").matches;

    if (this.nav !== null) {
      this.init();
    } else {
      return false;
    }
  }

  init() {
    this.navigationBody = this.nav.querySelector(".navigation-body");
    this.menuItems = this.nav.querySelectorAll(
      ".navigation-item, .navigation-dropdown-item"
    );
    this.menuLinks = this.nav.querySelectorAll(
      ".navigation-link, .navigation-dropdown-link"
    );

    const submenus = this.nav.querySelectorAll(
      ".navigation-dropdown, .navigation-megamenu"
    );
    for (let i = 0; i < submenus.length; i++) {
      submenus[i].className += " navigation-submenu";
      submenus[i].parentNode.className += " has-submenu";
    }

    if (this.options.autoSubmenuIndicator) {
      for (let i = 0; i < this.menuItems.length; i++) {
        if (this.menuItems[i].classList.contains("has-submenu")) {
          const indicator = document.createElement("span");
          indicator.classList.add("submenu-indicator");
          if (
            this.menuItems[i].children[1].classList.contains(
              "navigation-dropdown-left"
            )
          ) {
            indicator.classList.add("submenu-indicator-left");
          }
          this.menuItems[i].children[0].appendChild(indicator);
        }
      }
    }

    this.hoverEnabled = !matchMedia("(hover: none)").matches;

    this.navigationMode();
    on(window, "resize", this.navigationMode.bind(this));

    if (this.options.overlay) {
      this.overlayPanel = document.createElement("div");
      this.overlayPanel.classList.add("overlay-panel");
      this.overlayPanel.style.background = this.options.overlayColor;
      this.overlayActive = false;
      this.nav.appendChild(this.overlayPanel);

      on(this.nav.querySelector(".navigation-toggle"), "click", () => {
        if (!this.overlayActive) {
          this.showOffCanvas();
        } else {
          this.hideOffCanvas();
        }
      });
    }

    if (this.options.scrollMomentum) {
      this.disableScrollMomentum();
    }

    if (this.options.scrollSpy) {
      this.initScrollSpy();
    }

    if (windowWidth() >= this.options.breakpoint) {
      this.showLandscape();
    }

    on(window, "resize", () => {
      if (windowWidth() >= this.options.breakpoint) {
        this.showLandscape();
      } else {
        this.hideLandscape();
      }
    });

    if (this.options.hideSubWhenClickOut) {
      on(document, "click", (e) => {
        if (!closestByClass(e.target, "navigation-item")) {
          this.hideSubmenu();
        }
      });
    }

    this.options.onInit.call(this);
  }

  navigationMode() {
    if (windowWidth() >= this.options.breakpoint) {
      if (!this.bigScreenFlag) return;
      this.bigScreenFlag = 0;

      if (this.options.submenuTrigger === "click") {
        off(this.menuItems, "mouseenter mouseleave");
        on(this.menuLinks, this.clickEvent, (e) => {
          if (!this.hoverEnabled) return;
          this.toggleSubmenu(e.target.parentNode);
        });
      } else {
        off(this.menuLinks, this.clickEvent);
        on(this.menuItems, "mouseenter", (e) => {
          if (!this.hoverEnabled) return;
          this.showSubmenu(e.target);
        });
        on(this.menuItems, "mouseleave", (e) => {
          if (!this.hoverEnabled) return;
          this.hideSubmenu(e.target);
        });
      }

      this.hideOffCanvas();
      this.hideSubmenu();
      this.showLandscape();
      this.enableScrollMomentum();
    } else {
      if (!this.smallScreenFlag) return;
      this.smallScreenFlag = 0;

      off(this.menuItems, "mouseenter mouseleave");
      off(this.menuLinks, this.clickEvent);

      this.hideLandscape();
      this.disableScrollMomentum();

      if (this.options.submenuTrigger === "click") {
        on(this.menuLinks, this.clickEvent, (e) => {
          this.toggleSubmenu(e.target.parentNode);
        });
      } else {
        on(this.menuLinks, this.clickEvent, (e) => {
          e.preventDefault();
          this.toggleSubmenu(e.target.parentNode);
        });
      }
    }
  }

  toggleSubmenu(item) {
    if (item.classList.contains("has-submenu")) {
      if (item.classList.contains("active")) {
        this.hideSubmenu(item);
      } else {
        this.showSubmenu(item);
      }
    }
  }

  showSubmenu(item) {
    this.hideSubmenu();
    item.classList.add("active");
  }

  hideSubmenu(item) {
    if (item) {
      item.classList.remove("active");
    } else {
      const activeItems = this.nav.querySelectorAll(".navigation-item.active");
      for (let i = 0; i < activeItems.length; i++) {
        activeItems[i].classList.remove("active");
      }
    }
  }

  showOffCanvas() {
    this.overlayActive = true;
    this.nav.classList.add("offcanvas-active");
    this.overlayPanel.classList.add("active");
    document.body.classList.add("offcanvas-active");
    disableBodyScroll(this.nav);
  }

  hideOffCanvas() {
    this.overlayActive = false;
    this.nav.classList.remove("offcanvas-active");
    this.overlayPanel.classList.remove("active");
    document.body.classList.remove("offcanvas-active");
    enableBodyScroll(this.nav);
  }

  showLandscape() {
    this.nav.classList.add("navigation-landscape");
  }

  hideLandscape() {
    this.nav.classList.remove("navigation-landscape");
  }

  disableScrollMomentum() {
    this.nav.addEventListener(
      "touchmove",
      function () {
        disableBodyScroll(this);
      },
      { passive: false }
    );
  }

  enableScrollMomentum() {
    this.nav.removeEventListener("touchmove", disableBodyScroll);
  }

  initScrollSpy() {
    const scrollSpyItems = this.nav.querySelectorAll(".scrollspy-item");
    const scrollSpyTargets = this.nav.querySelectorAll(".scrollspy-target");

    let scrollPositions = [];

    for (let i = 0; i < scrollSpyTargets.length; i++) {
      scrollPositions.push(getOffset(scrollSpyTargets[i]).top);
    }

    on(window, "scroll", () => {
      const currentScrollPosition =
        window.pageYOffset || document.documentElement.scrollTop;

      let activeIndex = 0;

      for (let i = 0; i < scrollPositions.length; i++) {
        if (currentScrollPosition >= scrollPositions[i] - 1) {
          activeIndex = i;
        } else {
          break;
        }
      }

      for (let i = 0; i < scrollSpyItems.length; i++) {
        scrollSpyItems[i].classList.remove("active");
      }

      scrollSpyItems[activeIndex].classList.add("active");
    });
  }
}
