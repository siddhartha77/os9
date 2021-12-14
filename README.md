# OS 9
A retro website framework in the theme of Mac OS 9.

# External Libraries
- [jQuery](https://jquery.com/)
- [jQueryUI](https://jqueryui.com/)
- [jQueryUI Touch Punch](https://github.com/furf/jquery-ui-touch-punch)
- [jQuery Ajax Progress](https://github.com/englercj/jquery-ajax-progress)
- [jScrollPane](http://jscrollpane.kelvinluck.com/)

# Customizing
You'll be mostly using [json/desktopdb.json](json/desktopdb.json) to do your customizing. That file has all the examples you need. The desktop is comprised of figures. Each figure can be a disk, folder, document, picture, download, etc. Figures can also call actions defined in [js/actions.js](js/actions.js). Individual alerts are specified in [js/alerts.js](js/alerts.js). There are also a couple settings in [js/settings.js](js/settings.js).

The desktop is made up of columns. You can specify if you want the figure on the left of the desktop by setting "position": "left-nn". The far left would be "left-01". Don't set any position for your figure to be on the right of the desktop.

# Licence
Do whatever you want with this code. Just be cool about it.
