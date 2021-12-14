function initDesktop() {
    $(".modal").hide();

    g_DesktopDB.forEach(function (desktopDBItem) {
        /* Clone the main figure */
        let $desktopFigureClone = populateClone($("figure.cloneable").clone(), desktopDBItem);

        /* Insert the clone */
        if (desktopDBItem.id === "trash") {
            $desktopFigureClone.insertAfter("#trash-spacer");
        } else {
            if (desktopDBItem.position) {
                $desktopFigureClone.appendTo(".desktop .desktop-" + desktopDBItem.position);
            } else {
                $desktopFigureClone.insertBefore("#trash-spacer");
            }
        }
    });

    /* Remove the original figure */
    $("figure.cloneable").remove();

    initFigures($(".desktop"));
}

function populateClone($clone, desktopDBItem) {
    let icon = desktopDBItem.icon ? desktopDBItem.icon : desktopDBItem.kind;

    /* Update the cloned figure */
    $clone.removeClass("cloneable");
    $clone.addClass(desktopDBItem.kind);
    $clone.attr("data-id", desktopDBItem.id);
    $clone.attr("data-action", desktopDBItem.action);
    $clone.find(".label").html(desktopDBItem.name);
    $clone.attr("data-icon", icon);

    if (desktopDBItem.alias) {
        $clone.find(".label").addClass("alias");
    }

    if (desktopDBItem.kind === "link")
        $clone.find("a").attr("href", desktopDBItem.url);

    return $clone;
}

function initFigures($parent) {
    /* Initialize icons */
    $parent.find("figure").each(function () {
        let $this = $(this);
        let icon = $(this).attr("data-icon");

        $this.children("a").append("<img src=\"" + SETTINGS_ICONS_LARGE_PATH + icon + ".png\" />");
    });

    $parent.find("figure a").on("focus", function () {
        let $this = $(this);
        $this.parents("figure").first().addClass("focus");
    });

    $parent.find("figure a").on("blur", function () {
        let $this = $(this);
        $this.parents("figure").first().removeClass("focus");
    });

    $parent.find("figure a").on("dblclick", function (e) {
        let $this = $(this);
        let action = $this.parent("figure").attr("data-action");

        if (action) {
            e.stopImmediatePropagation();
            Actions.parseFunction(action);
        }
    });

    /* Folders */
    $parent.find("figure.folder > a, figure.trash > a").on("dblclick", function () {
        let $this = $(this);
        let wrapperID = $this.parent("figure").attr("data-id");
        let $iconImg = $this.children("img");
        let icon = $this.parent("figure").attr("data-icon");

        Actions.openWindow(wrapperID, "folder", true);
        /* Mask the icon */
        $iconImg.attr("src", SETTINGS_ICONS_LARGE_PATH + icon + "-mask.png");
    });

    /* Links */
    $parent.find("figure.link a").on("click", function () {
        return false;
    }).on("dblclick", function () {
        /* Open link in a new tab */
        window.open(this.href, "_blank").focus();
        return false;
    });

    /* Downloads */
    $parent.find("figure.download > a").on("click", function () {
        return false;
    }).on("dblclick", function () {
        let $this = $(this);
        let wrapperID = $this.parent("figure").attr("data-id");
        let desktopDBItem = findDesktopDBItem(g_DesktopDB, "id", wrapperID);

        Actions.downloadFile(desktopDBItem);
    });

    /* Applications */
    $parent.find("figure.application > a").on("click", function () {
        return false;
    }).on("dblclick", function () {
        let $this = $(this);
        let wrapperID = $this.parent("figure").attr("data-id");
        let $iconImg = $this.children("img");
        let icon = $this.parent("figure").attr("data-icon");

        Actions.openWindow(wrapperID, wrapperID, true);
        $iconImg.attr("src", SETTINGS_ICONS_LARGE_PATH + icon + "-mask.png");
    });

    /* Documents */
    $parent.find("figure.document > a").on("click", function () {
        return false;
    }).on("dblclick", function () {
        let $this = $(this);
        let wrapperID = $this.parents("figure").first().attr("data-id");
        let desktopDBItem = findDesktopDBItem(g_DesktopDB, "id", wrapperID);
        let $simpleTextFigure = $("figure[data-id=\"simpletext\"]");
        let $simpleTextIconImg = $simpleTextFigure.find("img");
        let simpleTextIcon = $simpleTextFigure.attr("data-icon");

        $simpleTextIconImg.attr("src", SETTINGS_ICONS_LARGE_PATH + simpleTextIcon + "-mask.png");

        /* Open a SimpleText window */
        Actions.openWindow("simpletext", "simpletext", false, function ($wrapper) {
            let $simpleTextText = $wrapper.find(".simpletext-text");

            /* Text data requires special formatting */
            if (desktopDBItem.url.split(".").pop() === "txt") {
                $simpleTextText.addClass("text-data");
            } else {
                $simpleTextText.removeClass("text-data");
            }

            $simpleTextText.load(desktopDBItem.url, function () {
                /* Initialize jScrollPane */
                let jsp = $wrapper.find(".body").jScrollPane(g_jScrollPaneSettings);
                jsp.data("jsp").reinitialise();
            });

            /* Set the SimpleText window title to the document name */
            $wrapper.find(".title").html(desktopDBItem.name)
        });
    });

    /* Pictures */
    $parent.find("figure.picture > a").on("click", function () {
        return false;
    }).on("dblclick", function () {
        let $this = $(this);
        let wrapperID = $this.parents("figure").first().attr("data-id");
        let $existingWrapper = $(".window-wrapper[data-id=\"pictureviewer\"]");
        let desktopDBItem = findDesktopDBItem(g_DesktopDB, "id", wrapperID);
        let $pictureViewerFigure = $("figure[data-id=\"pictureviewer\"]");
        let $pictureViewerIconImg = $pictureViewerFigure.find("img");
        let pictureViewerIcon = $pictureViewerFigure.attr("data-icon");

        $pictureViewerIconImg.attr("src", SETTINGS_ICONS_LARGE_PATH + pictureViewerIcon + "-mask.png");

        /* Quick hack to automatically resize the window (close it first!) */
        if ($existingWrapper.length) {
            Actions.closeWindow($existingWrapper, false);
        }

        /* Open a PictureViewer window */
        Actions.openWindow("pictureviewer", "pictureviewer", false, function ($wrapper) {
            /* Load in the image from the DesktopDBItem URL */
            let $pictureViewerImage = $wrapper.find(".pictureviewer-image");
            let image = new Image();
            image.src = desktopDBItem.url;
            image.onload = function () {
                $pictureViewerImage.html(image);
                /* Initialize jScrollPane */
                let jsp = $wrapper.find(".body").jScrollPane(g_jScrollPaneSettings);
                jsp.data("jsp").reinitialise();
            };

            /* Set the PictureViewer window title to the document name */
            $wrapper.find(".title").html(desktopDBItem.name)
        });
    });

    /* Movies */
    $parent.find("figure.movie > a").on("click", function () {
        return false;
    }).on("dblclick", function () {
        let $this = $(this);
        let wrapperID = $this.parents("figure").first().attr("data-id");
        let $existingWrapper = $(".window-wrapper[data-id=\"pictureviewer\"]");
        let desktopDBItem = findDesktopDBItem(g_DesktopDB, "id", wrapperID);
        let $pictureViewerFigure = $("figure[data-id=\"pictureviewer\"]");
        let $pictureViewerIconImg = $pictureViewerFigure.find("img");
        let pictureViewerIcon = $pictureViewerFigure.attr("data-icon");

        $pictureViewerIconImg.attr("src", SETTINGS_ICONS_LARGE_PATH + pictureViewerIcon + "-mask.png");

        /* Quick hack to automatically resize the window (close it first!) */
        if ($existingWrapper.length) {
            Actions.closeWindow($existingWrapper, false);
        }

        /* Open a PictureViewer window */
        Actions.openWindow("pictureviewer", "pictureviewer", false, function ($wrapper) {
            /* Load in the image from the DesktopDBItem URL */
            let $pictureViewerImage = $wrapper.find(".pictureviewer-image");
            $pictureViewerImage.html("<video autoplay><source src=\"" + desktopDBItem.url + "\" type=\"video/mp4\"></video>");
            let $video = $pictureViewerImage.find("video");
            $video.onload = function () {
                /* Initialize jScrollPane */
                let jsp = $wrapper.find(".body").jScrollPane(g_jScrollPaneSettings);
                jsp.data("jsp").reinitialise();
            };

            /* Set the PictureViewer window title to the document name */
            $wrapper.find(".title").html(desktopDBItem.name)
        });
    });

    /* The label will also open the figure */
    $parent.find("figure figcaption").on("dblclick", function () {
        let $this = $(this);

        $this.siblings("a").first().trigger("dblclick");
    });
}