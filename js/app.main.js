/**
 * Created by killian on 27/10/15.
 */
/*
 * app.main.js
 * This is the main module for this SPA
 */

/*  jslint           browser: true,      continue: true,
 devel: true,        indent: 2,          maxerr: 50,
 newcap: true,       nomen: true,        plusplus: true,
 regexp: true,       sloppy: true,       vars: false,
 white: true
 */

/*global $, app */

app.main = (function () {
    //----------------BEGIN MODULE SCOPE VARIABLES------------------
    /* Declare all variables that are available across the
     * namespace 'app.main' in this module scope section.
     *
     * Place static configuration values in the 'configMap'.
     * The static configuration values here are the main HTML sections
     * that will be populated separately by feature JS files.
     */
    var configMap = {
            //Define the map used by uriAnchor for validation
            //then store the current anchor values in a map in
            //the module state, 'stateMap.anchor_map' below
            anchor_schema_map: {
              chat: {open: true, closed: true}
            },
            main_html: String()
            + '<div class="app-main-head">'
                + '<div class="app-main-head-logo"></div>'
                + '<div class="app-main-head-acct"></div>'
                + '<div class="app-main-head-search"></div>'
            + '</div>'
            + '<div  class="app-main-main">'
                + '<div class="app-main-main-nav"></div>'
                + '<div class="app-main-main-content"></div>'
            + '</div>'
            + '<div  class="app-main-foot"></div>'
            + '<div  class="app-main-chat"></div>'
            + '<div class="app-main-modal"></div>',

            //Store retract and extend times and heights for chat slider.
            //Enable easy change of chat slider motions.
            chat_extend_time: 1000,
            chat_retract_time: 300,
            chat_extend_height: 450,
            chat_retract_height: 15,
            //Tooltip
            chat_extended_title: 'Click to retract',
            chat_retracted_title: 'Click to extend'
        },
        // 'stateMap' contains dynamic information shared across the module
        stateMap = {
            $container : null,
            //Store current anchor values in anchor_map object, then declare
            //three additional anchor-related methods in the module scope below
            //and then define the methods in the 'Utility Methods' section.
            anchor_map: {},
            //Used by toggleChat method
            is_chat_retracted : true
        },
        // Cache jQuery collections in 'jqueryMap'
        jqueryMap = {},

        // Declare all module scope variables/function names here.
        //toggleChat to retract or extend slider.
        //onClick is the event handler for toggleChat
        copyAnchorMap, setJqueryMap, toggleChat,
        chanceAnchorPart, onHashchange,
        onClickChat, initModule;
    //-------------------END MODULE SCOPE VARIABLES--------------------



    //-------------------BEGIN UTILITY METHODS-------------------------
    // Reserved for functions that don't interact with page elements
    // We will put the anchor-related hash stuff here for app state.
    // Returns copy of stored anchor map; minimises overhead.
    // Uses jQuery 'extend()' utility to copy the anchor_map object.
    copyAnchorMap = function () {
        return $.extend(true, {}, stateMap.anchor_map);
    };
    //Next, we add the code to automatically update the anchor in the URL
    //from within the 'DOM methods' section.
    //-------------------END UTILITY METHODS---------------------------



    //-------------------BEGIN DOM METHODS-----------------------------
    // Reserved for functions that create and manipulate page elements.
    // Begin DOM method /setJqueryMap/
    // This method caches jQuery collections and greatly reduces the
    // number of jQuery document transversals, improving performance.
    setJqueryMap = function () {
        var $container = stateMap.$container;
        jqueryMap = {
            $container: $container,
            $chat: $container.find('.app-main-chat')
        };
    };
    //End DOM method /setJqueryMap/

    // Begin DOM method /toggleChat/
    // Purpose   :  Extends or retracts chat slider
    // Arguments :
    //  * do_extend - if true, extends the slider; if false retracts
    //  * callback  - optional function to execute at end of animation
    // Settings  :
    //  * chat_extend_time, chat_retract_time
    //  * chat_extend_height, chat_retract_height
    // Returns   :  boolean
    //  * true   -  slider animation activated
    //  * false  -  slider animation not activated
    //
    // State     :   sets stateMap.is_chat_retracted
    //  * true   -   slider is retracted
    //  * false  -   slider is extended
    //
    toggleChat = function (do_extend, callback) {
        var
            px_chat_ht = jqueryMap.$chat.height(),
            is_open = px_chat_ht === configMap.chat_extend_height,
            is_closed = px_chat_ht === configMap.chat_retract_height,
            is_sliding = !is_open && !is_closed;

        // avoid race condition
        if (is_sliding) { return false; }

        // Begin extend chat slider
        if (do_extend) {
            jqueryMap.$chat.animate(
                {height: configMap.chat_extend_height},
                configMap.chat_extend_time,
                function () {
                    jqueryMap.$chat.attr(
                        'title', configMap.chat_extended_title
                    );
                    stateMap.is_chat_retracted = false;
                    if (callback) {callback(jqueryMap.$chat); }
                }
            );
            return true;
        }
        //End extend chat slider

        //Begin retract chat slider - Adjust toggleChat to control hover text
        jqueryMap.$chat.animate(
            {height: configMap.chat_retract_height},
            configMap.chat_retract_time,
            function () {
                jqueryMap.$chat.attr(
                    'title', configMap.chat_extended_title
                );
                stateMap.is_chat_retracted = true;
                if (callback) {callback(jqueryMap.$chat); }
            }
        );
        return true;
        // End retract chat slider
    };
    // End DOM method /toggleChat/

    // Begin DOM method /changeAnchorPart/
    // Purpose: Change part of the URI anchor component
    // Arguments :
    //  * arg_map - The map describing what part of the URI anchor we want to change
    // Returns: boolean
    //  * true - the Anchor portion of the URI was updated
    //  * false - the Anchor portion of the URI could not be updated
    // Action :
    //  The current anchor rep stored in stateMap.anchor_map.
    //  See uriAnchor for a discussion of encoding.
    //  This method
    //      * Creates a copy of this map using copyAnchorMap().
    //      * Modifies the key-values using arg_map.
    //      * Manages the distinction between independent and dependent values in the encoding
    //      * Attempts to change the URI using uriAnchor.
    //      * Returns true on success, false on failure.
    //
    changeAnchorPart = function (arg_map) {
        var
            anchor_map_revise = copyAnchorMap(),
            bool_return = true,
            key_name, key_name_dep;
        // Begin merge changes into anchor map
        KEYVAL:
        for (key_name in arg_map) {
            if (arg_map.hasOwnProperty(key_name)) {
                // skip dependent keys during iteration
                if (key_name.indexOf('_') === 0) {continue KEYVAL;}

                // update independent key value
                anchor_map_revise[key_name] = arg_map[key_name];

                // update matching dependent key
                key_name_dep = '_' + key_name;
                if (arg_map[key_name_dep]) {
                    anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
                }
                else {
                    delete anchor_map_revise[key_name_dep];
                    delete anchor_map_revise['_s' + key_name_dep];
                }
            }
        }
        // End merge changes into anchor map

        // Begin attempt to update URI; revert if not successful.
        //  ie; Don't set the anchor if it doesn't pass the schema
        //  by making uriAnchor throw an exception and reverting the
        //  anchor component to its previous state.
        try {
        $.uriAnchor.setAnchor(anchor_map_revise);
        }
        catch (error) {
            // replace URI with existing state
            $.uriAnchor.setAnchor(stateMap.anchor_map,null,true);
            bool_return = false;
        }
        // End attempt to update URI...
        return bool_return;
    };
    // End DOM method /changeAnchorPart/ (next, add 'onHashchange' event handler)
    //-------------------END DOM METHODS-------------------------------



    //-------------------BEGIN EVENT HANDLERS--------------------------
    // Reserved for jQuery event handler functions.

    // Important Note:
    // We usually 'return false' from jQuery event handlers because this
    // tells jQuery to prevent the default action (like following a link) from
    // occurring. This is the same as invoking 'event.preventDefault()
    // in the event handler. 'return false' also tells jQuery to prevent
    // the event from triggering on the parent DOM element (this behaviour
    // is called 'bubbling') which can be acquired by invoking
    // 'event.stopPropogation()' in the event handler. 'return false' also
    // concludes the handler execution. If the click event has other handlers
    // chained/bound to it then the next one in line will be automatically executed.
    // If we don't want the next to execute immediately then we must
    // invoke event.preventImmediatePropogation().
    //

    // Begin event handler /onHashchange/
    //



    // Add the onClickChat event handler to call toggleChat.
    // How to save app state! This is the 'anchor-interface pattern'!
    // Re-edited to use the uriAnchor jQuery plugin to save state of chat
    // slider position as a hash in the URL: #!chat=closed
    onClickChat = function (event) {
        if (toggleChat(stateMap.is_chat_retracted)){
            $.uriAnchor.setAnchor({
                chat: (stateMap.is_chat_retracted ? 'open': 'closed')
            });
        }
        //Test with console.log
        console.log('chat clicked, isOpen:' + stateMap.is_chat_retracted );
        return false;
    };
    //-------------------END EVENT HANDLERS----------------------------



    //-------------------BEGIN PUBLIC METHODS--------------------------
    // Reserved for publicly available methods
    // Begin Public method /initModule/
    // Used to initialise the module
    initModule = function ($container) {
        // load HTML and map jQuery collections
        stateMap.$container = $container;
        $container.html(configMap.main_html);
        setJqueryMap();

        //Initialise chat slider and bind click handler to jQuery event
        stateMap.is_chat_retracted = true;
        jqueryMap.$chat
            .attr('title', configMap.chat_retracted_title)
            .click(onClickChat);
    };
    // End Public method /initModule/

    // Export public methods explicitly by returning them in a map
    return { initModule : initModule };
    //-------------------END PUBLIC METHODS----------------------------

}());