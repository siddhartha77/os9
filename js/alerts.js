function initAlert(id, parameter) {
    switch (id) {
        case "shutdown":
            initShutdownAlert();
            break;
        case "access-denied":
            initSimpleAlert(".access-denied.alert");
            break;
        case "bad-alias":
            initSimpleAlert(".bad-alias.alert", parameter);
            break;
        default:
            break;
    }
}

function initShutdownAlert() {
    let $shutdownAlert = $(".shutdown.alert");

    $(".alert button").on("click", function () {
        let $this = $(this);
        let action = $this.attr("data-action");

        switch (action) {
            case "restart":
                Actions.restart();

                break;
            case "sleep":
                $shutdownAlert.remove();
                Actions.sleep();

                break;
            case "cancel":
                $shutdownAlert.remove();

                break;
            case "shutdown":
                Actions.shutdown();

                break;
            default:
                break;
        }

        $(".modal").hide();
    });
}

function initSimpleAlert(alertClass, textParameter) {
    let $alert = $(alertClass);

    if (textParameter) {
        let $alertText = $alert.find(".text");

        $alertText.html($alertText.html().replace("{0}", textParameter));
    }

    $(".alert button").on("click", function () {
        let $this = $(this);
        let action = $this.attr("data-action");

        if (action === "ok")
            $alert.remove();

        $(".modal").hide();
    });
}