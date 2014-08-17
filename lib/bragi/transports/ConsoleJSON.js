/* =========================================================================
 *
 * ConsoleJSON
 *      Logs to console, but just outputs raw JSON
 *
 * ========================================================================= */
function TransportConsoleJSON ( options ){
    options = options || {};

    // Transport must set groupsEnabled and groupsDisabled to provide transport 
    // level support for overriding what groups to log
    // (NOTE - the user does not need to pass in groupsEnabled, but the 
    // transport must set these properties)
    this.groupsEnabled = options.groupsEnabled;
    this.groupsDisabled = options.groupsDisabled;

    // Optional, transport specific
    this.spacing = options.spacing === undefined ? 4 : options.spacing;
    return this;
}

// Prototype properties (All these must exist to be a valid transport)
// --------------------------------------
TransportConsoleJSON.prototype.name = 'ConsoleJSON';

TransportConsoleJSON.prototype.log = function transportConsoleJSONLog( loggedObject ){
    // log
    //  Logs a passed object to the console
    //
    //  params:
    //      loggedObject: {Object} the log object to log
    //      options : {Object} the logger options
    //
    // Setup message for console output
    // ------------------------------
    //  The final message will just be a JSON printed string

    console.log('------------------------------------------ ' + loggedObject.group);
    console.log( JSON.stringify(loggedObject, null, this.spacing) );
    console.log('\n');

    return this;
};

module.exports = TransportConsoleJSON;
