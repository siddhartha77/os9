/**
 * @typedef desktopDBItem
 * @type {object}
 * @property {string} name - name of the figure
 * @property {string} icon - specify an icon relative to SETTINGS_ICONS_LARGE_PATH
 * @property {boolean} alias - true if figure is an alias
 * @property {string} format - for disk figures Info Window
 * @property {string} capacity - for disk figures Info Window
 * @property {string} available - for disk figures Info Window
 * @property {string} used - for disk figures Info Window
 * @property {number} size - size in bytes for  Info Window
 * @property {string} version - for Info Window
 * @property {string} kind - disk/folder/picture/movie/document/download/link/application/trash
 * @property {string} url - for picture/document/download/link
 * @property {string} infoContents - for trash Info Window
 * @property {string} where - for Info Window
 * @property {string} created - date for Info Window
 * @property {string} modified - date for Info Window
 * @property {string} comments - for Info Window
 * @property {array} contents - array of other desktopDBItems for folders
 * @property {"text"} dataType - "text" if the document needs to be parsed for whitespaces
 * @property {"left-nn"} position - put figure on left of desktop in column nn
 * @property {number} top - Added during window drag
 * @property {number} left - Added during window drag
 */

let g_DesktopDB = {};
let g_jScrollPaneSettings = {
    showArrows: true,
    alwaysShowHScroll: true,
    alwaysShowVScroll: true,
    verticalArrowPositions: "after",
    horizontalArrowPositions: "after",
    clickOnTrack: true,
    verticalDragMinHeight: 16
};

$(function () {
    let appInit = true;

    $(".startup").load("startup.html", function () {
        let $progressBarMiddle = $(".startup .progress .middle");
        let $progressBarRight = $(".startup .progress .right");

        $(".startup-dialog").hide();

        Actions.wake(function() {
            $(".startup-dialog").show();
        });

        $progressBarMiddle.css("width", "20%");

        $(".menubar").load("menubar.html", function () {

            $progressBarMiddle.css("width", "40%");

            $(".desktop").load("desktop.html", function () {
                    $progressBarMiddle.css("width", "80%");

                    if (appInit) {
                        $.getJSON("json/desktopdb.json").then(function (db) {
                            g_DesktopDB = db;
                            generateDesktopDBIDs(g_DesktopDB);
                            generateWhereStrings(g_DesktopDB, SETTINGS_WHERE_ROOT);
                        }).then(function () {
                            $progressBarMiddle.css("width", "85%");
                            initMenus();
                        }).then(function () {
                            $progressBarMiddle.css("width", "90%");
                            initDesktop();
                        }).then(function () {
                            $progressBarMiddle.css("width", "100%");
                            $progressBarRight.addClass("done");

                            setTimeout(function () {
                                $(".startup").hide();
                            }, 2000);
                        });

                        /* Because .load() is called for every .window... */
                        appInit = false;
                    }
            });
        });
    });

    $(".sleep").on("click", function () {
        Actions.wake();
    });
});
