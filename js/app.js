/**
 * Created by killian on 27/10/15.
 */
/*
 * app.js
 * Root namespace module
 * app.js is the master controller for this SPA.
 * All application features are coordinated by app.js
 */

/*  Telling jslint to expect 'polluting' of the global namespace
 *  with 'app' and '$' global variables
*/


/*  jslint              browser: true,      continue: true,
    devel: true,        indent: 2,          maxerr: 50,
    newcap: true,       nomen: true,        plusplus: true,
    regexp: true,       sloppy: true,       vars: false,
    white: true
 */

/*  global $, app */


/*  Using the module pattern to create the 'app' namespace which
  * exports one method, 'initModule', which is the function that
  * initialises the application */


var app = (function (){
    var initModule = function ($container) {
       app.main.initModule( $container );
    };

    return { initModule: initModule};
}());