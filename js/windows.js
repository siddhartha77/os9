let g_openWindows = [];
let g_highestZIndex = 3;

function initWindow(wrapperID, windowClass) {
    let $wrapper = Object;

    switch (windowClass) {
        case "folder":
            $wrapper = initFolderWindow(wrapperID);
            initBaseWindow($wrapper);
            break;
        case "info":
            $wrapper = initInfoWindow(wrapperID);
            initBaseWindow($wrapper);
            break;
        case "about":
            $wrapper = initAboutWindow(wrapperID);
            initBaseWindow($wrapper);
            break;
        case "download":
            $wrapper = initDownloadWindow(wrapperID);
            initBaseWindow($wrapper);
            break;
        case "simpletext":
            $wrapper = initSimpleTextWindow(wrapperID);
            initBaseWindow($wrapper);
            break;
        case "pictureviewer":
            $wrapper = initPictureViewerWindow(wrapperID);
            initBaseWindow($wrapper);
            break;
        case "zterm":
            $wrapper = initZTermWindow(wrapperID);
            initBaseWindow($wrapper);
            break;
        default:
            break;
    }
}

function initFolderWindow(wrapperID) {
    let $wrapper = $(".window-wrapper[data-id=\"" + wrapperID + "\"][data-type=\"folder\"]");
    let $window = $wrapper.children(".window");
    let desktopDBItem = findDesktopDBItem(g_DesktopDB, "id", wrapperID);
    let headerTitle = "";

    if (!desktopDBItem) return;

    /* Set the window icon and title */
    switch (wrapperID) {
        case "folder":
            headerTitle = "<img src=\"" + SETTINGS_ICONS_SMALL_PATH + "folder.png\" />" + desktopDBItem.name;
            break;
        case "trash":
            headerTitle = "<img src=\"" + SETTINGS_ICONS_SMALL_PATH + "trash.png\" />" + desktopDBItem.name;
            break;
        default:
            headerTitle = "<img src=\"" + SETTINGS_ICONS_SMALL_PATH + "folder.png\" />" + desktopDBItem.name;
            break;
    }

    $window.find(".header > .title").html(headerTitle);

    /* Build window (i.e. folder) contents */
    if (desktopDBItem.contents) {
        initFolderWindowContents($window, desktopDBItem.contents);
        /* Build icons, etc. */
        initFigures($window);
    }

    $window.find(".grid figure a").on("focus", function () {
        /* Style the window, but don't focus it as
          we don't want to lose the figure focus */
        $window.triggerHandler("focus");
    }).on("blur", function () {
        /* Since the window isn't focused, blur
           it here to style it if we click outside.
           Note that the window will focus if we click
           in it as that would trigger after this blur */
        $window.trigger("blur");
    });

    return $wrapper;
}


function initInfoWindow(wrapperID) {
    let $wrapper = $(".window-wrapper[data-id=\"" + wrapperID + "\"][data-type=\"info\"]");
    let $window = $wrapper.children(".window");
    let $infoTable = $window.find(".info-table");
    let desktopDBItem = findDesktopDBItem(g_DesktopDB, "id", wrapperID);
    let icon = desktopDBItem.icon ? desktopDBItem.icon : desktopDBItem.kind;

    if (!desktopDBItem) return;

    /* Set the window title */
    $window.find(".header > .title").html(desktopDBItem.name + " Info");
    $window.find("img[data-info-key='icon']").attr("src", SETTINGS_ICONS_LARGE_PATH + icon + ".png");
    $window.find("input[data-info-key='name']").attr("value", desktopDBItem.name);

    /* Build info window table with figure-specific properties */
    switch (desktopDBItem.kind) {
        case "disk":
            $infoTable.load("window.info.table.disk.html", function () {
                $infoTable.find("td[data-info-key='format']").html(desktopDBItem.format);
                $infoTable.find("td[data-info-key='capacity']").html(desktopDBItem.capacity);
                $infoTable.find("td[data-info-key='available']").html(desktopDBItem.available);
                $infoTable.find("td[data-info-key='used']").html(desktopDBItem.used);

                updateInfoTableGeneralProperties($infoTable, desktopDBItem);
            });
            break;
        case "folder":
            $infoTable.load("window.info.table.folder.html", function () {
                $infoTable.find("td[data-info-key='size']").html(formatInfoTableFileSize(desktopDBItem.size) + ", for " + getDesktopDBItemFileCount(desktopDBItem) + " items");

                updateInfoTableGeneralProperties($infoTable, desktopDBItem);
            });
            break;
        case "application":
        case "download":
        case "document":
        case "video":
        case "picture":
            $infoTable.load("window.info.table.file.html", function () {
                $infoTable.find("td[data-info-key='size']").html(formatInfoTableFileSize(desktopDBItem.size));
                $infoTable.find("td[data-info-key='version']").html(desktopDBItem.version);

                updateInfoTableGeneralProperties($infoTable, desktopDBItem);
            });
            break;
        case "link":
            $infoTable.load("window.info.table.link.html", function () {
                $infoTable.find("td[data-info-key='url']").html(desktopDBItem.url);

                updateInfoTableGeneralProperties($infoTable, desktopDBItem);
            });
            break;
        case "trash":
            $infoTable.load("window.info.table.trash.html", function () {
                $infoTable.find("td[data-info-key='contents']").html(desktopDBItem.infoContents);

                updateInfoTableGeneralProperties($infoTable, desktopDBItem);
            });
            break;
        default:
            break;
    }

    return $wrapper;
}

function formatInfoTableFileSize(bytes) {
    if (bytes === undefined) return;

    let formattedBytes = formatBytes(bytes);

    return formattedBytes + " on disk (" + bytes.toLocaleString() + " bytes)"
}

function updateInfoTableGeneralProperties($infoTable, desktopDBItem) {
    $infoTable.find("td[data-info-key='kind']").html(desktopDBItem.kind);
    $infoTable.find("td[data-info-key='where']").html(desktopDBItem.where);
    $infoTable.find("td[data-info-key='created']").html(desktopDBItem.created);
    $infoTable.find("td[data-info-key='modified']").html(desktopDBItem.modified);
    $infoTable.find("td[data-info-key='label']").html(desktopDBItem.label);
    $infoTable.find("textarea[data-info-key='comments']").html(desktopDBItem.comments);
}

function initAboutWindow(wrapperID) {
    let $wrapper = $(".window-wrapper[data-id=\"" + wrapperID + "\"][data-type=\"about\"]");
    let $window = $wrapper.children(".window");

    /* Set the window title */
    $window.find(".header > .title").html("About This Website");

    $.getJSON("json/greets.json").then(function (greetsJSON) {
        let $greetsList = $window.find(".about-greets ul");

        greetsJSON.forEach(function (greet) {
            $greetsList.append("<li>" + greet.name + "</li>");
        });
        /* Initialize jScrollPane */
        let jsp = $wrapper.find(".about-greets").jScrollPane({
            showArrows: true,
            alwaysShowHScroll: false,
            alwaysShowVScroll: true,
            verticalArrowPositions: "after",
            horizontalArrowPositions: "after",
            clickOnTrack: true,
            verticalDragMinHeight: 16
        });
        jsp.data("jsp").reinitialise();
    });

    return $wrapper;
}

function initDownloadWindow(wrapperID) {
    let $wrapper = $(".window-wrapper[data-id=\"" + wrapperID + "\"][data-type=\"download\"]");
    let $window = $wrapper.children(".window");

    /* Set the window title */
    $window.find(".header > .title").html("Download to \"Your Computer\"");

    return $wrapper;
}

function initSimpleTextWindow(wrapperID) {
    let $wrapper = $(".window-wrapper[data-id=\"" + wrapperID + "\"][data-type=\"simpletext\"]");
    let $window = $wrapper.children(".window");

    /* Set the window title */
    $window.find(".header > .title").html("SimpleText");

    return $wrapper;
}

function initPictureViewerWindow(wrapperID) {
    let $wrapper = $(".window-wrapper[data-id=\"" + wrapperID + "\"][data-type=\"pictureviewer\"]");
    let $window = $wrapper.children(".window");

    /* Set the window title */
    $window.find(".header > .title").html("PictureViewer");

    return $wrapper;
}

function initZTermWindow(wrapperID) {
    let $wrapper = $(".window-wrapper[data-id=\"" + wrapperID + "\"][data-type=\"zterm\"]");
    let $window = $wrapper.children(".window");

    /* Set the window title */
    $window.find(".header > .title").html("ZTerm");

    return $wrapper;
}

function initBaseWindow($wrapper) {
    let $window = $wrapper.children(".window");

    /* Make the window focusable */
    $window.attr("tabindex", -1);

    /* Make the window draggable */
    $wrapper.draggable({
        handle: ".draggable",
        containment: $(".desktop")
    });

    /* Remove controls if defined */
    $(".window > .header.no-close-box > .close-box").remove();
    $(".window > .header.no-zoom-box > .zoom-box").remove();
    $(".window > .header.no-windowshade-box > .windowshade-box").remove();

    /* Padding in the header is necessary to center the title in cases where controls are hidden*/
    $window.find(".header > .zoom-box").siblings(".header-lines-wrapper.left").find(".header-lines.center").css("padding-left", "16px");
    $window.find(".header.no-close-box.no-zoom-box > .windowshade-box").siblings(".header-lines-wrapper.left").find(".header-lines.center").css("padding-left", "17px");

    $window.on("focusin", function () {
        let $this = $(this);
        let wrapperID = $wrapper.attr("data-id");
        let $figure = $("figure[data-id=\"" + wrapperID + "\"]");

        $this.find(".control-box, .header-lines").show();
        $this.find(".resize-handle").addClass("enabled");
        $this.removeClass("blur");
        $this.addClass("focus");
        $this.children(".header").removeClass("draggable");

        /* Enable scrolling */
        $this.find(".jspTrack").removeClass("disabled");
        $this.find(".jspArrow ").show();
        $this.find(".jspDrag").show();

        /* The window should have the highest z-index */
        $wrapper.css("z-index", ++g_highestZIndex);

        if ($figure.hasClass("folder") && !$this.find(".grid:focus-within").length) {
            $figure.addClass("focus");
        }

        /* Set the active application menu */
        if ($figure.hasClass("application")) {
            setActiveApplication($figure.find(".label").html());
        }
    });

    $window.find("input, textarea").on("blur", function () {
        $window.trigger("blur");
    });

    $window.on("focusout", function () {
        let $this = $(this);
        let wrapperID = $wrapper.attr("data-id");
        let $figure = $("figure[data-id=\"" + wrapperID + "\"]");
        let width = $this.css("width");

        /* Window children shouldn't steal focus styling from the window */
        if ($this.is(":focus-within")) {
            /* But if we just selected a figure then blur the
               window's parent figure */
            if ($this.hasClass("folder")) {
                $figure.removeClass("focus");
            }

            return;
        }

        $figure.removeClass("focus");

        /* Need to set draggable so it doesn't take an extra click
           on certain elements */
        $this.children(".header").addClass("draggable");
        $this.find(".control-box, .header-lines").hide();
        $this.find(".resize-handle").removeClass("enabled");
        $this.removeClass("focus");
        $this.addClass("blur");

        /* Disable scrolling */
        $this.find(".jspTrack").addClass("disabled");
        $this.find(".jspArrow ").hide();
        $this.find(".jspDrag").hide();

        /* When hiding elements, the size of the window
           may change and we want to keep it the same */
        $this.css("width", width);

        /* Default the active application menu to the Finder */
        setActiveApplication("Finder");
    });

    /* KLUDGE: JQueryUI will not properly handle bubbling
                   up the focus on draggable elements so we
                   do it here*/
    $window.find(".draggable").on("mousedown", function () {
        let $this = $(this);
        let $window = $this.parents(".window");

        $window.trigger("focus");
    });

    $window.find(".close-box").on("click", function () {
        Actions.closeWindow($wrapper);
    });

    /* Window shade control */
    $window.find(".windowshade-box").on("click", function () {
        let width = $window.css("width");

        $window.find(".statusbar, .contents").toggle();

        /* When hiding elements, the size of the window
           may change and we want to keep it the same */
        $window.css("width", width);
    });

    /* Double-click header also invokes window shade */
    $window.find(".draggable").on("dblclick", function () {
        $(this).siblings(".windowshade-box").trigger("click");
    });

    /* Expand arrow control */
    $window.find(".expand-arrow").on("mousedown", function () {
        $(this).addClass("active");
    });

    $window.find(".expand-arrow").on("mouseup", function () {
        let $this = $(this);

        $this.removeClass("active");
        $this.toggleClass("right");
        $this.toggleClass("down");
        $window.toggleClass("expanded");
    });
}

function initFolderWindowContents($window, desktopDBItemContents) {
    let $itemCount = $window.find(".statusbar .statusbar-text .item-count");
    $itemCount.html(desktopDBItemContents.length);

    /* Create the folder contents listing */
    desktopDBItemContents.forEach(function (dbFolderItem) {
        let $folderFigureClone = populateClone($window.find("figure.cloneable").clone(), dbFolderItem);

        /* Insert the file */
        $folderFigureClone.appendTo($window.find(".grid"));
    });

    /* Remove the cloneable figure */
    $("figure.cloneable").remove();
}