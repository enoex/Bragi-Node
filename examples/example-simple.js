/* =========================================================================
 *
 * example-simple.js
 *      Simple call
 *  
 * ========================================================================= */
var logger = require('../lib/bragi');


logger.log('group1:subgroup1', 'Hello %j', "world");
logger.log('group1:subgroup1', 'Hello %j', [1,2,3]);

// Store stack trace so line numbers can be shown
logger.options.storeStackTrace = true;
logger.transports.get('Console')[0].showMeta = false;
logger.log(
    'group1', 
    logger.util.print('Hello', 'green') + ' Not showing meta. Props: %j ::::::', 
    {name: 'world', size: 'big', props: {answer: 42}},
    {name: 'world', size: 'big', props: {answer: 42}}
);
// turn back on meta info
logger.transports.get('Console')[0].showMeta = true;

// Now show the full stack trace ( set on the Console transport )
logger.transports.get('Console')[0].showStackTrace = true;
logger.log('group1', 'Hello %j', "world");

// Turn off stack trace
logger.transports.get('Console')[0].showStackTrace = false;

logger.log('group1', logger.util.print('I am green', 'green') + ' and ' + 
    logger.util.print('I am blue', 'blue'));
