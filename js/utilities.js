let g_menubarShowDate = false;

updateClock();

setInterval(function () {
    updateClock();
}, 1000);

/* Update the menubar clock */
function updateClock() {
    const today = new Date();
    let y = today.getFullYear();
    let M = String(today.getMonth() + 1).padStart(2, '0');
    let d = String(today.getDate()).padStart(2, '0');
    let h = today.getHours();
    let m = String(today.getMinutes()).padStart(2, '0');

    if (g_menubarShowDate) {
        $(".menubar .clock").html(y + "/" + M + "/" + d);
    } else {
        $(".menubar .clock").html(h + ":" + m);
    }
}

/* Set the active application menu
*       Parameters:
*           applicationName: The title case name of the application */
function setActiveApplication(applicationName) {
    let $activeApplication = $(".menubar .active-application");

    $activeApplication.empty().append("<img src=\"img/ui/icons-small/apps/" + applicationName.toLowerCase() + ".png\"/>");
    $activeApplication.append("<span>" + applicationName + "</span>");

    return $activeApplication;
}

/* Recursively generate GUIDs for DesktopDB items */
function generateDesktopDBIDs(tree) {
    for (let node of tree) {
        if (!node.id) node.id = getRandomUUID();
        if (node.contents) generateDesktopDBIDs(node.contents);
    }
}

/* Recursively generate "where" strings for Info windows */
function generateWhereStrings(tree, where) {
    for (let node of tree) {
        if (!node.where) node.where = where;
        if (node.contents) generateWhereStrings(node.contents, node.where + node.name + ":");
    }
}

/* Recursively find a node given a property and value
*       Parameters:
*           tree: The DesktopDB object
*           property: The property to search
*           value: The value to search (i.e. property.value) */
function findDesktopDBItem(tree, property, value) {
    for (let node of tree) {
        if (node[property] === value) return node;

        if (node.contents) {
            let desiredNode = findDesktopDBItem(node.contents, property, value);
            if (desiredNode) return desiredNode
        }
    }
    return undefined;
}

/* Recursively find a node's parent given a property and value
*       Parameters:
*           tree: The DesktopDB object
*           property: The property to search
*           value: The value to search (i.e. property.value) */
function findDesktopDBItemParent(tree, property, value) {
    for (let node of tree) {
        if (node[property] === value) return tree;

        if (node.contents) {
            let desiredTree = findDesktopDBItem(node.contents, property, value);
            if (desiredTree) return node
        }
    }
    return false;
}

function getDesktopDBItemFileCount(tree) {
    let count = 0;

    if (tree.contents) {
        for (let node of tree.contents) {
            count++;

            if (node.contents) {
                count += getDesktopDBItemFileCount(node);
            }
        }
    }

    return count;
}

/* Format a number into byte sizes
*       Parameters:
*           bytes: The number to format
*           decimals: Output decimal places */
function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/* Format seconds remaining into text
*       Parameters:
*           seconds: The seconds remaining */
function formatTimeRemaining(seconds) {
    if (seconds < 7) {
        return "About 5 seconds";
    } else if (seconds < 15) {
        return "About 10 seconds";
    } else if (seconds < 55) {
        return "Less than a minute";
    } else if (seconds < 80) {
        return "About a minute";
    } else if (seconds < 3300) {
        return "About " + Math.ceil(seconds / 60) + " minutes";
    } else if (seconds < 4800) {
        return "About an hour";
    } else {
        return "About " + Math.ceil(seconds / 3600) + " hours";
    }
}

/* Generate a random UUIDv4 */
function getRandomUUID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}