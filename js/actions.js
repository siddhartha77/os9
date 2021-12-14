/* Offset of the first opened window.
   Used to stagger/cascade future open windows */
/*const WINDOW_DEFAULT_TOP = 25;
const WINDOW_DEFAULT_LEFT = 7;
const WINDOW_STAGGER_TOP = 14;
const WINDOW_STAGGER_LEFT = 12;*/

const Actions = {
    /* Parse an action
        Parameters:
            action: An action function defined as function:argument */
    "parseFunction": function (action) {
        let actions = action.split("::");
        /* This references the function from the Actions function array */
        let fn = Actions[actions[0]];

        /* Remove the function name so we can get just the arguments */
        actions.splice(0, 1);
        /* Call the function with zero or more arguments */
        fn(...(actions));
    },
    /* Open a window
       Parameters:
            wrapperID: The id of the window wrapper
            windowClass: The class of the window (e.g. "folder" or "info")
            transferAnimation: If true, animate the opening of the window
            callbackFn: A callback function*/
    "openWindow": function (wrapperID, windowClass, transferAnimation = false, callbackFn = undefined) {
        let desktopDBItem = findDesktopDBItem(g_DesktopDB, "id", wrapperID);

        if (wrapperID === undefined || windowClass === undefined) return;
        if (g_openWindows.some(e => e.id === wrapperID && e.type === windowClass)) {
            let $wrapper = $(".window-wrapper[data-id=\"" + wrapperID + "\"]");

            $wrapper.find(".window." + windowClass).trigger("focus");

            if (callbackFn && $wrapper) {
                callbackFn($wrapper);
            }

            return $wrapper;
        } else {
            let $wrapper = $("<div class=\"window-wrapper\"></div>").appendTo(".desktop");
            let $window = $("<div class=\"window " + windowClass + "\"></div>").appendTo($wrapper);
            let windowViewFile = "window." + windowClass + ".html";

            /* Hide the window initially so we don't see it loading */
            $window.hide();

            g_openWindows.push({
                "id": wrapperID,
                "type": windowClass
            });

            $window.load(windowViewFile, function () {
                $window.children(".header").first().load("window.header.html", function () {
                    $wrapper.attr("data-id", wrapperID);
                    $wrapper.attr("data-type", windowClass);
                    initWindow(wrapperID, windowClass);

                    /* Reset saved position of window */
                    if (desktopDBItem) {
                        $wrapper.css("top", desktopDBItem.top);
                        $wrapper.css("left", desktopDBItem.left);
                    }

                    /* Transfer animation */
                    if (transferAnimation) {
                        $("figure[data-id=\"" + wrapperID + "\"]").find("img").transfer({
                            to: $window.parent(".window-wrapper"),
                            duration: SETTINGS_TRANSFER_ANIMATION_DURATION
                        }, function () {
                            $window.show();

                            /* Initialize jScrollPane
                               We always reinitialise right after because adding the scrollbars might wrap
                               the contents down.
                             */
                            let $jsp = $wrapper.find(".body");
                            if ($jsp.length) {
                                let jsp = $jsp.jScrollPane(g_jScrollPaneSettings);
                                jsp.data("jsp").reinitialise();
                            }

                            /* TODO: Resizable windows */
                            /*$wrapper.find(".window").resizable({
                                alsoResize: $window.find(".contents, .body, .grid"),
                                handles: "se",
                                minWidth: 200,
                                minHeight: 200,
                                resize: function() {
                                    jsp.data("jsp").reinitialise();
                                }
                            });*/

                            $window.trigger("focus");

                            /* TODO: Staggered windows */
                            /*offset = $window.offset();
                        $window.offset({
                            top: offset.top + (WINDOW_STAGGER_TOP * g_openWrappers.length),
                            left: offset.left + (WINDOW_STAGGER_LEFT * g_openWrappers.length)
                        });*/
                        });
                    } else {
                        $window.show();

                        $window.trigger("focus");
                    }

                    if (callbackFn && $wrapper) {
                        callbackFn($wrapper);
                    }
                });
            });

            return $wrapper;
        }
    },
    /* Close a window
       Parameters:
            $wrapper: The window wrapper JQuery object */
    "closeWindow": function ($wrapper, animate = true) {
        let wrapperID = $wrapper.attr("data-id");
        let wrapperType = $wrapper.attr("data-type");
        let $figure = $("figure[data-id=\"" + wrapperID + "\"]");
        let $iconImg = $figure.find("img");
        let icon = $figure.attr("data-icon");
        let desktopDBItem = findDesktopDBItem(g_DesktopDB, "id", wrapperID);

        /* Save the position of the window */
        if (desktopDBItem) {
            desktopDBItem.top = $wrapper.css("top");
            desktopDBItem.left = $wrapper.css("left");
        }

        /* Checks if the window was opened by a folder or is an application and animates accordingly */
        if (($figure.hasClass("folder") || $figure.hasClass("application") || $figure.hasClass("trash")) && $iconImg.length && animate) {
            $wrapper.transfer({
                to: $iconImg,
                duration: SETTINGS_TRANSFER_ANIMATION_DURATION
            }, function () {
                /* Remove the wrapper from the open wrappers list */
                g_openWindows.splice(g_openWindows.findIndex(e => e.id === wrapperID && e.type === wrapperType), 1);

                $wrapper.remove();

                /* Remove the icon mask */
                $iconImg.attr("src", SETTINGS_ICONS_LARGE_PATH + icon + ".png");

                $figure.children("a").first().trigger("focus");

                if (g_openWindows.length)
                    Actions.focusWindow(g_openWindows[g_openWindows.length - 1]);
            });
        } else {
            /* This block is repeated because the previous instance
               is an async call inside an animation */
            g_openWindows.splice(g_openWindows.findIndex(e => e.id === wrapperID && e.type === wrapperType), 1);

            if (g_openWindows.length) {
                /* Remove any focus class before explicitly focusing */
                $(".desktop figure.focus").removeClass("focus");
                Actions.focusWindow(g_openWindows[g_openWindows.length - 1]);
            } else {
                /* If there is a focused figure on the desktop then explicitly
                   focus it in case it's just a class focus */
                $(".desktop figure.focus > a").trigger("focus");
            }

            $wrapper.remove();
        }
    },
    /* Focus a window.
       Parameters:
            objWrapper:
                .id: the ID of the wrapper
                .type: the type of window */
    "focusWindow": function (objWrapper) {
        let $wrapper = $(".window-wrapper[data-id=\"" + objWrapper.id + "\"][data-type=\"" + objWrapper.type + "\"]");
        let $window = $wrapper.children(".window");

        $window.trigger("focus");
    },
    "getInfoOnFocusedFigure": function () {
        let $figure = $("figure.focus");
        let figureID = $figure.attr("data-id");

        if ($figure.length > 0) {
            Actions.openWindow(figureID, "info", false);
        }
    },
    /* Download a file
       Parameters:
            desktopDBItem: The Desktop DB object of the file to download */
    "downloadFile": function (desktopDBItem) {
        let startTime = (new Date()).getTime();
        let desktopDBItemParentName = findDesktopDBItemParent(g_DesktopDB, "id", desktopDBItem.id).name;
        let $wrapper = Actions.openWindow(desktopDBItem.id, "download", false, function ($wrapper) {
            $wrapper.find("button").on("click", function () {
                $wrapper.data("jqXHR").abort();
            });
        });

        /* Create an AJAX request to download the file */
        let jqXHR = $.ajax(desktopDBItem.url, {
            type: "GET",
            cache: false,
            xhrFields: {
                responseType: "blob" // binary data
            },
            success: function (data) {
                let a = document.createElement("a");
                let url = window.URL.createObjectURL(data);
                a.href = url;
                a.download = desktopDBItem.name;
                document.body.append(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                $wrapper.find(".progress .right").addClass("done");
                $wrapper.find(".download-calculated-remaining").html("Done");

                /* Wait a couple seconds before closing the window */
                setTimeout(function () {
                    Actions.closeWindow($wrapper);
                }, 2000);
            },
            /* error will also trigger on an abort */
            error: function () {
                $wrapper.find(".download-calculated-remaining").html("Cancelled");

                setTimeout(function () {
                    Actions.closeWindow($wrapper);
                }, 2000);

            },
            progress: function downloadProgress(e) {
                if (e.lengthComputable) {
                    let currentTime = (new Date()).getTime();
                    let duration = (currentTime - startTime) / 1000;
                    let estimatedSecondsRemaining = (e.total / (e.loaded / duration)) - duration;
                    let percentage = (e.loaded * 100) / e.total;

                    $wrapper.find(".progress .middle").css("width", percentage + "%");
                    $wrapper.find(".download-calculated-remaining").html(formatTimeRemaining(estimatedSecondsRemaining));
                    $wrapper.find("td.download-filename").html(desktopDBItem.name);
                    $wrapper.find("td.download-from").html(desktopDBItemParentName);
                    $wrapper.find("td.download-bytes").html(formatBytes(e.loaded) + " of " + formatBytes(e.total));
                }
            }
        });

        /* Put the jqXHR object into the wrapper data so that it can be referenced to be aborted */
        $wrapper.data("jqXHR", jqXHR);
    },
    /* Open an alert
       Parameters:
            id: The id of the alert */
    "alert": function (id, parameter = undefined) {
        let $wrapper = $(".alert-wrapper");
        let alertFile = "alert." + id + ".html";

        $wrapper.load(alertFile, function () {
            $(".modal").show();
            initAlert(id, parameter);
        });
    },
    /* Open a figure by its ID
       Parameters:
            figureID: The ID of the figure */
    "openFigureID": function (figureID) {
        let $figure = $("figure[data-id=\"" + figureID + "\"] > a");

        $figure.trigger("dblclick");
    },
    /* Open the currently focused figure */
    "openFocusedFigure": function () {
        let $figure = $("figure.focus");

        if ($figure.length > 0)
            $figure.find("> a").trigger("dblclick");
    },
    /* Close the currently focused window */
    "closeFocusedWindow": function () {
        let $wrapper = $(".window.focus").first().parent(".window-wrapper");

        if ($wrapper.length > 0)
            Actions.closeWindow($wrapper);
    },
    /* Wake up the website */
    "wake": function (callbackFn) {
        let $sleep = $(".sleep");

        $sleep.fadeTo("slow", 0, function () {
            $sleep.toggleClass("active");
            $sleep.hide();

            if (callbackFn) {
                callbackFn();
            }
        });
    },
    /* Put the website to sleep */
    "sleep": function (callbackFn) {
        let $sleep = $(".sleep");

        $sleep.toggleClass("active");
        $sleep.show();
        $sleep.fadeTo("slow", 1.0, callbackFn);
    },
    /* Reload the page. This is needed for callbacks */
    "reload": function () {
        location.reload();
    },
    /* Restart the website */
    "restart": function () {
        Actions.sleep(Actions.reload);
    },
    /* Shutdown the website */
    "shutdown": function () {
        window.location.href = SETTINGS_SHUTDOWN_URL;
    }
};
