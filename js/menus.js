/* Number of times to flash when menu item selected */
const MENU_ITEM_FLASH_COUNT = 3;
/* Delay between flashes */
const MENU_ITEM_FLASH_DELAY = 50;
/* Grace period before a menu is considered sticky */
const MENU_STICKY_GRACE_PERIOD = 350;
/* Offset of submenu relative to parent title */
const SUBMENU_LEFT_OFFSET = 26;

function initMenus() {
    /* Used to keep track of a menu to be hidden on mouseup */
    let m_openMenus = [];
    let m_menuMousedown = false;
    let m_menuDragging = false;
    let m_menuDraggingTimer = null;
    let m_menuItemFlashing = false;

    /* Initialize menubar */
    $(".menubar .clock").on("click", function () {
        g_menubarShowDate = !g_menubarShowDate;
        updateClock();
    });

    /* Hide all the menu items */
    $(".menu .menu-items").each(function () {
        let $this = $(this);

        $this.hide();
    });

    /* Build icon menus (like the Apple menu) */
    $(".menubar > .menu .icon").each(function () {
        let $this = $(this);
        let icon = $this.attr("data-icon");

        if (icon) {
            let iconPath = SETTINGS_ICONS_SMALL_PATH + icon + ".png";

            $this.css("background-image", "url(" + iconPath + ")");
        }
    });

    /* Build shortcuts and check marks */
    $(".menu .menu-items > div").not(".submenu").each(function () {
        let $this = $(this);
        let shortcut = $this.attr("data-shortcut");
        let checked = $this.attr("data-checked");

        if (shortcut) {
            $this.append("<div class=\"shortcut\"><div class=\"symbol\">&#8984;</div><div class=\"char\">" + shortcut + "</div></div>");
        }

        if (checked) {
            $this.prepend("<div class=\"checked\">&nbsp;</div>");
        }
    });

    $(".menubar").on("mousedown", function (event) {
        /* Prevents a window from losing focus and
           displaying its blur state */
        event.preventDefault();
    });

    $(".menu-items .submenu .title").each(function () {
        let $this = $(this);

        /* Add an arrow icon */
        $this.append("<div class=\"arrow\">&#11208;</div>");
    });

    /* Close any submenus */
    $(".menu > .menu-items > div").on("mouseenter", function () {
        let $this = $(this);

        m_openMenus.forEach(function (menuId, index) {
            /* Make sure it's a submenu */
            if (menuId !== $this.attr("id") && $("#" + menuId).hasClass("submenu")) {
                $("#" + menuId + " .menu-items").hide();

                /* Remove the submenu from the array */
                m_openMenus.splice(index, 1);
            }
        });
    });

    let $menuItemsDiv = $(".menu-items > div");

    /* Highlight menu item */
    $menuItemsDiv.not(".separator").on("mouseenter", function () {
        let $this = $(this);

        /* Conditional menu items can toggle the "disabled" class
           so this check will handle them instead the function selector */
        if (m_menuItemFlashing || $this.is(".disabled"))
            return;

        $this.addClass("active");
    });

    /* Remove highlight from menu item */
    $menuItemsDiv.not(".separator").on("mouseleave", function () {
        let $this = $(this);

        $this.removeClass("active");
    }).on("mouseup", function (event) {
        /* The menu has been clicked */
        let $this = $(this);
        let flashCount = MENU_ITEM_FLASH_COUNT;
        let action = $this.attr("data-action");

        /* Prevent other mouseup actions */
        event.stopPropagation();

        /* Conditional menu items can toggle the "disabled" class
           so this check will handle them instead the function selector.
           The "none" action will prevent submenu titles from flashing. */
        if (m_menuItemFlashing || $this.is(".disabled") || action === "none") {
            /* Close all menus */
            $(".desktop").trigger("mouseup");

            return;
        }

        m_menuItemFlashing = true;

        /* Flash effect */
        while (flashCount--) {
            $this.queue(function () {
                $this.removeClass("active").dequeue();
            }).delay(MENU_ITEM_FLASH_DELAY).queue(function () {
                $this.addClass("active").dequeue();
            }).delay(MENU_ITEM_FLASH_DELAY);
        }

        /* Action handler */
        $this.queue(function () {
            if (action) {
                Actions.parseFunction(action);
            }
            $this.dequeue();
        }).queue(function () {
            /* Close all menus */
            $(".desktop").trigger("mouseup");
            $this.removeClass("active");

            m_menuItemFlashing = false;
            $this.dequeue();
        });
    });

    let $menuTitle = $(".menu > .title");

    /* Sticky menus will hide one menu and show another if a menu has been
       clicked and the button released */
    $menuTitle.on("mouseenter", function () {
        let $this = $(this);

        /* Make sure we don't close the active menu when you enter its title */
        if (!m_openMenus.includes($this.parents(".menu").attr("id"))) {
            m_openMenus.forEach(function (menuId) {
                $("#" + menuId + " .title").removeClass("active");
                $("#" + menuId + " .menu-items").hide();
            });
            m_openMenus = [];
        }

        if (m_menuMousedown) {
            $this.trigger("mousedown");
        }
    });

    /* Show the menu items */
    $menuTitle.on("mousedown", function () {
        let $this = $(this);
        let $menuItems = $this.siblings(".menu-items");
        let menuId = $this.parents(".menu").attr("id");

        if (m_menuMousedown && m_openMenus.includes(menuId)) {
            /* Clicking the title of an active menu will close it */
            $(".desktop").trigger("mouseup");
        } else {
            $this.addClass("active");
            /* Toggle conditional menu items */
            toggleConditionalMenuItems($menuItems);
            $menuItems.show();
            m_openMenus = [menuId];
            m_menuMousedown = true;
        }

        /* Dragging menus will close them when mouseup on a title, but
           only after a timer (or else it's a sticky menu) */
        m_menuDraggingTimer = setInterval(function () {
            m_menuDragging = true;
        }, MENU_STICKY_GRACE_PERIOD);
    });

    /* Show the submenu items */
    $(".submenu").on("mouseenter", function () {
        let $this = $(this);

        /* Conditional menu items can toggle the "disabled" class
           so this check will handle them instead the function selector */
        if (m_menuItemFlashing || $this.is(".disabled"))
            return;

        if (m_menuMousedown) {
            let $menuItems = $this.children(".menu-items");

            $this.addClass("active");

            /* Toggle conditional menu items */
            toggleConditionalMenuItems($menuItems);

            $menuItems.show();

            /* Position the submenu properly relative to its title */
            $menuItems.css("left", $this.width() + SUBMENU_LEFT_OFFSET);
            m_openMenus.push($this.attr("id"));
        }
    });

    /* Moving into the spacer will close all menus, but keep sticky menus active.
       This is done instead of $(".menu .title").leave() because otherwise the
       active menu will close once you leave its title. */
    $(".menubar > div:not(.menu)").on("mouseenter", function () {
        m_openMenus.forEach(function (menuId) {
            $("#" + menuId + " .title").removeClass("active");
            $("#" + menuId + " .menu-items").hide();
        });

        m_openMenus = [];
    });

    /* Close all menus if we mouseup over non-enabled menu items */
    $(".desktop, .menubar > div:not(.menu), .menu-items > div.disabled, .menu-items > div.separator").on("mouseup", function () {
        let $this = $(this);
        /* Conditional menu items can toggle the "disabled" class
           so this check will handle them instead the function selector */
        if ($this.is(".menu-items > div:not(.disabled)") && $this.is(".menu-items > div:not(.separator)"))
            return;

        /* Clear the menu dragging timer */
        clearInterval(m_menuDraggingTimer);

        /* Stop dragging a menu if we are */
        if (m_menuDragging)
            m_menuDragging = false;

        m_openMenus.forEach(function (menuId) {
            $("#" + menuId + " .title").removeClass("active");
            $("#" + menuId + " .menu-items").hide();
        });

        m_openMenus = [];
        m_menuMousedown = false;
    });
}

/* TODO: Get this fast and working */
/*function refreshWindowMenu() {
    let $windowMenu = $("#menuWindow .menu-items");
    let $wrapper = Object;
    let title = "";

    $windowMenu.append("<div>Desktop</div>");

    if (g_openWindows.length) {
        $windowMenu.append("<div class=\"separator\"></div>");
    }

    const infoWindows = g_openWindows.filter(e => e.type === "info");

    infoWindows.sort();

    infoWindows.forEach(function(infoWindow){
        $wrapper = $(".desktop .window-wrapper[data-id=\"" + infoWindow.id + "\"][data-type=\"" + infoWindow.type + "\"]");
        title = $wrapper.find(".window .header .title").text();

        console.log(title);
    });

}*/

function toggleConditionalMenuItems($menuItems) {
    $menuItems.children("div").each(function () {
        let $this = $(this);
        let requires = $this.attr("data-requires");

        if (requires) {
            let fn = MenuItemRequires[requires];

            if (fn()) {
                $this.removeClass("disabled");
            } else {
                $this.addClass("disabled");
            }
        }
    });
}

const MenuItemRequires = {
    "focusedFigure": function () {
        let $figure = $("figure");
        return $figure.hasClass("focus");
    },
    "focusedWindow": function () {
        let $window = $(".window");
        return $window.hasClass("focus");
    }
};