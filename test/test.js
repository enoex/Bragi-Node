/* =========================================================================
 * 
 * Tests
 *      Runs a variety of tests for the logging system
 *
 * ========================================================================= */
var mocha = require('mocha');
var should = require('chai').should();
var chai = require('chai');
var assert = chai.assert;

// Our library
var logger = require('../lib/bragi');

// we need to capture log output
var logs = [];
var origLog = console.log;

console.log = function logOverride(msg) {
    logs.push([].slice.call(arguments));
    //// to hide all logs:
    //origLog.apply(console.log, arguments);
};
// --------------------------------------
//
// Logging Tests
//
// --------------------------------------
describe('Bragi: Javascript Logger', function(){

    // ----------------------------------
    //
    // Reset logs, groupsEnabled, and history before *each* test
    //
    // ----------------------------------
    beforeEach(function(){
        // Reset all logs, logger options, etc.
        logs = [];
        logger.options.groupsEnabled = true;
        logger.options.groupsDisabled = [];
        logger.options.storeAllHistory = false;
        logger.transports.empty();

        logger.transports.add(
            new logger.transportClasses.Console({
                showMeta: true, 
                showStackTrace: false
            })
        );
    });
    
    // ----------------------------------
    // Basic logging tests
    // ----------------------------------
    describe('log() by group', function(){

        describe('log everything', function(){
            it('should log everything', function(){
                logger.options.groupsEnabled = true;
                logger.log('group1', 'hello'); 
                logs.length.should.equal(1);
            });

            it('should log everything', function(){
                logger.options.groupsEnabled = true;
                logger.log('group1', 'hello'); 
                logger.log('group2', 'hello'); 
                logger.log('group3', 'hello'); 
                logs.length.should.equal(3);

                // should log undefined
                logger.log('group', 'should be :%j: and :%j:', undefined, 42);
                assert(logs[logs.length-1][0].match(/:undefined:/));
                assert(logs[logs.length-1][0].match(/:42:/));

            });
        });

        describe('log by groups', function(){
            it('should only log one group', function(){
                logger.options.groupsEnabled = ['group1'];
                logger.log('group1', 'logged'); 

                logger.log('some-group-group1', 'not logged'); 
                logger.log('group2', 'not logged'); 
                logs.length.should.equal(1);
            });

            it('should log multiple groups', function(){
                logger.options.groupsEnabled = ['group1', 'group2'];
                logger.log('group1', 'logged'); 
                logger.log('group2', 'logged'); 

                logger.log('group3', 'not logged'); 
                logs.length.should.equal(2);
            });

            it('should log subgroups', function(){
                logger.options.groupsEnabled = ['group1:subgroup1'];
                logger.log('group1:subgroup1', 'logged'); 

                logger.log('group1:subgroup2', 'not logged'); 
                logs.length.should.equal(1);
            });

            it('should log subgroups and their subgroups', function(){
                logger.options.groupsEnabled = ['group1:subgroup1'];
                logger.log('group1:subgroup1', 'logged'); 
                logger.log('group1:subgroup1:subgroup2', 'logged'); 

                logger.log('group1:subgroup2', 'not logged'); 
                logger.log('blabla:group1:subgroup1', 'not logged'); 
                logs.length.should.equal(2);
            });

            it('should log deep subgroups', function(){
                logger.options.groupsEnabled = ['group1:subgroup1:subgroup2:subgroup3'];
                logger.log('group1:subgroup1:subgroup2:subgroup3', 'logged'); 
                logger.log('group1:subgroup1:subgroup2:subgroup3:subgroup4', 'logged'); 

                logger.log('group1', 'NOT logged'); 
                logger.log('group1:subgroup1', 'NOT logged'); 
                logger.log('group1:subgroup1:subgroup3:subgroup3:subgroup4', 'NOT logged'); 
                logger.log('group1:subgroup2', 'not logged'); 
                logger.log('blabla:group1:subgroup1', 'not logged'); 
                logs.length.should.equal(2);
            });

            describe('regular expressions', function(){
                it('should test for /group1/', function(){
                    logger.options.groupsEnabled = [/group1/];
                    logger.log('group1:subgroup1:subgroup2:subgroup3', 'logged'); 
                    logger.log('group1:subgroup1:subgroup2:subgroup3:subgroup4', 'logged'); 
                    logger.log('group1', 'logged'); 
                    logger.log('group1:subgroup1', 'logged'); 
                    logger.log('group1:subgroup1:subgroup3:subgroup3:subgroup4', 'logged'); 
                    logger.log('group1:subgroup2', 'logged'); 
                    // NOTE: This is a regex, so "subgroup1" WILL match (because
                    // group1 is found in the string)
                    logger.log('blabla:group2:subgroup1', 'logged'); 

                    logger.log('bbla:nomatch', 'not logged');
                    logger.log('group2', 'not logged');

                    logs.length.should.equal(7);
                });

                it('should test for /^group1/ (match at start of string)', function(){
                    logger.options.groupsEnabled = [/^group1/];
                    logger.log('group1:subgroup1:subgroup2:subgroup3', 'logged'); 
                    logger.log('group1:subgroup1:subgroup2:subgroup3:subgroup4', 'logged'); 
                    logger.log('group1', 'logged'); 

                    logger.log('group2:group1', 'not logged'); 
                    logger.log('blabla:group2:subgroup1', 'not logged'); 
                    logger.log('bbla:nomatch', 'not logged');

                    logs.length.should.equal(3);
                });

                it('should test for /.*subgroup1/ (match anything that contains subgroup1)', function(){
                    logger.options.groupsEnabled = [/.*subgroup1/];
                    logger.log('group1:subgroup1:subgroup2:subgroup3',
                        'logged'); 
                    logger.log('group1:subgroup1:subgroup2:subgroup3:subgroup4',
                        'logged'); 
                    logger.log('blabla:innerbla:subgroup1', 'logged'); 
                    logger.log('blabla:group2:subgroup1', 'logged'); 

                    logger.log('group1', 'not logged'); 
                    logger.log('group2:group1', 'not logged'); 
                    logger.log('bbla:nomatch', 'not logged');

                    logs.length.should.equal(4);
                });
            });
        });
    });

    // ----------------------------------
    // Built in log tests
    // ----------------------------------
    describe('Built in log type tests', function(){
        it('show always log error if not set in groupsDisabled', function(){
            logger.options.groupsEnabled = ['group1'];
            logger.log('error', 
                'Should be logged, even if it is not present in groupsEnabled');
            logger.log('error:group1', 
                'Should be logged, even if it is not present in groupsEnabled');
            logger.log('error:group2', 
                'Should be logged, even if it is not present in groupsEnabled');
            logger.log('group1', 'Should be logged');

            logger.log('group2', 'Should not be logged');
            logger.log('group3', 'Should not be logged');

            logs.length.should.equal(4); 
        });
        it('show always log warn if not set in groupsDisabled', function(){
            logger.options.groupsEnabled = ['group1'];
            logger.log('warn', 
                'Should be logged, even if it is not present in groupsEnabled');
            logger.log('warn:group1', 
                'Should be logged, even if it is not present in groupsEnabled');
            logger.log('warn:group2', 
                'Should be logged, even if it is not present in groupsEnabled');
            logger.log('group1', 'Should be logged');

            logger.log('group2', 'Should not be logged');
            logger.log('group3', 'Should not be logged');

            logs.length.should.equal(4); 
        });

        describe('Tests for built in types when set in groupsDisabled', function(){
            it('should NOT log errors if set in groupsDisabled', function(){
                logger.options.groupsEnabled = true;
                logger.options.groupsDisabled = ['error'];
                
                logger.log('error', 'Should not be logged');
                logger.log('error:group1', 'Should not be logged');
                logger.log('error:group2', 'Should not be logged');

                logger.log('group1', 'Should be logged');
                // This should log, because the root namespace is group2, NOT 
                // error - so it's not a built in type
                logger.log('group2:error', 'Should be logged');

                logs.length.should.equal(2); 
            });

            it('should NOT log warns if set in groupsDisabled', function(){
                logger.options.groupsEnabled = true;
                logger.options.groupsDisabled = ['warn'];
                
                logger.log('warn', 'Should not be logged');
                logger.log('warn:group1', 'Should not be logged');
                logger.log('warn:group2', 'Should not be logged');

                logger.log('group1', 'Should be logged');
                logger.log('group2:warn', 'Should be logged');

                logs.length.should.equal(2); 
            });
        });
    });

    // ----------------------------------
    // Util
    // ----------------------------------
    describe('Util tests', function(){

        describe('print() function', function(){
            it('should return string with right colors', function(){
                var string = logger.util.print('Test', 'red');
                assert(string.indexOf(logger.util.colors.red) === 0);
                assert(string.indexOf(logger.util.colors.reset) !== -1);
            });
        });

        describe('Symbols', function(){
            it('should return some symbols', function(){
                assert(logger.util.symbols.success.indexOf('✔︎') !== -1);
            });
        });
    });

    // ----------------------------------
    // Transports - Tests
    // ----------------------------------
    describe('Transports - Functionality', function(){
        it('should return transports when calling get()', function(){
            // single console transport by default
            assert(logger.transports.get('Console').length === 1);
        });
        it('should return correct array of property values', function(){
            assert( logger.transports.get('Console').property('showMeta')[0] === true );
        });
        it('should set properties when property() called', function(){
            logger.transports.get('Console').property('showMeta', false);
            assert( logger.transports.get('Console').property('showMeta')[0] === false );
        });

        it('should add another transport and get and set properties with strings', function(){
            logger.transports.add(
                new logger.transportClasses.Console({
                    showMeta: true, 
                    showStackTrace: false
                })
            );

            // get 
            assert( logger.transports.get('Console').length === 2 );
            assert( logger.transports.get('Console').property('showMeta').length === 2 );
            assert( logger.transports.get('Console').property('showMeta')[0] === true );
            assert( logger.transports.get('Console').property('showMeta')[1] === true );

            // set
            logger.transports.get('Console').property('showMeta', false);
            assert( logger.transports.get('Console').property('showMeta')[0] === false );
            assert( logger.transports.get('Console').property('showMeta')[1] === false );

        });


        it('should add another transport and set properties with object', function(){
            logger.transports.add(
                new logger.transportClasses.Console({
                    showMeta: true, 
                    showStackTrace: false
                })
            );

            assert( logger.transports.get('Console').property('showMeta')[0] === true );
            assert( logger.transports.get('Console').property('showMeta')[1] === true );
            assert( logger.transports.get('Console').property('showStackTrace')[0] === false );
            assert( logger.transports.get('Console').property('showStackTrace')[1] === false );

            // set
            logger.transports.get('Console').property({ showMeta: false, showStackTrace: true });
            assert( logger.transports.get('Console').property('showMeta')[0] === false );
            assert( logger.transports.get('Console').property('showMeta')[1] === false );
            assert( logger.transports.get('Console').property('showStackTrace')[0] === true );
            assert( logger.transports.get('Console').property('showStackTrace')[1] === true );

            // and set again with strings
            logger.transports.get('Console').property('showStackTrace', false);
            assert( logger.transports.get('Console').property('showStackTrace')[0] === false );
            assert( logger.transports.get('Console').property('showStackTrace')[1] === false );


        });
    });

    // ----------------------------------
    // Transports - History Tests
    // ----------------------------------
    describe('Transports - History tests', function(){
        it('should log some group and story history', function(){
            var history = new logger.transportClasses.History({});
            logger.transports.add(history);

            logger.options.groupsEnabled = true;

            logger.log('h1', 'hello');
            assert(history.history.h1.length === 1);
        });

        it('should log some group and story history for multiple groups', function(){
            var history = new logger.transportClasses.History({});
            logger.transports.add(history);
            logger.options.groupsEnabled = true;

            logger.log('h2', 'hello');
            assert(history.history.h2.length === 1);

            logger.log('h2', 'hello again');
            assert(history.history.h2.length === 2);

            logger.log('h3', 'hello again');
            assert(history.history.h3.length === 1);
            assert(history.history.h2.length === 2);

            logger.log('h4', 'hello there');
            logger.log('h4', 'oh hi');
            assert(history.history.h2.length === 2);
            assert(history.history.h3.length === 1);
            assert(history.history.h4.length === 2);
        });

        it('should not add logs to history if log level is not in groupsEnabled array', function(){
            var history = new logger.transportClasses.History({});
            logger.transports.add(history);
            logger.options.groupsEnabled = ['h1only'];
            
            logger.log('h1only', 'this is logged in history');
            // won't get added to history since it's not logged
            logger.log('h2only', 'this is not logged');

            assert(history.history.h1only.length === 1);
            assert(history.history.h2only === undefined);
        });

        it('should add everything to history if storeEverything is true', function(){
            var history = new logger.transportClasses.History({
                storeEverything: true
            });
            logger.transports.add(history);
            logger.options.groupsEnabled = ['h1only'];
            
            logger.log('h1only', 'this is logged in history');
            logger.log('h2only', 'this is also logged in history, but NOT logged to console');
            logger.log('h3only', 'this is also logged in history, but NOT logged to console');

            logs.length.should.equal(1); 
            assert(history.history.h1only.length === 1);
            assert(history.history.h2only.length === 1);
            assert(history.history.h3only.length === 1);
            assert(history.history.blabla === undefined);
        });
    });

    // ----------------------------------
    // Groups Enabled - add / remove
    // ----------------------------------
    describe('groupsEnabled add / remove', function(){
        describe('addGroup', function(){
            it('should add single text group', function(){
                logger.options.groupsEnabled.should.equal(true);
                logger.addGroup('test');
                logger.options.groupsEnabled.length.should.equal(1);
                logger.options.groupsEnabled[0].should.equal('test');
            });

            it('should add single regex group', function(){
                logger.options.groupsEnabled.should.equal(true);
                logger.addGroup('/test/');
                logger.options.groupsEnabled.length.should.equal(1);
            });

            it('should add a single regex group if multiple are added', function(){
                logger.options.groupsEnabled.should.equal(true);
                logger.addGroup('/test/');
                logger.addGroup('/test/');
                logger.addGroup('/test/');
                logger.addGroup('/test/');
                logger.addGroup('/test/');
                logger.options.groupsEnabled.length.should.equal(1);
            });
            it('should add multiple groups', function(){
                logger.options.groupsEnabled.should.equal(true);
                logger.addGroup('test1').addGroup('test2');
                logger.options.groupsEnabled.length.should.equal(2);
            });
            it('should add a regex and a string', function(){
                logger.options.groupsEnabled.should.equal(true);
                logger.addGroup('/test/');
                logger.addGroup('test');
                logger.options.groupsEnabled.length.should.equal(2);
            });
            it('should not add if existing group exists', function(){
                logger.options.groupsEnabled = ['test'];
                logger.addGroup('test');
                logger.options.groupsEnabled.length.should.equal(1);
            });
        });

        describe('removeGroup', function(){
            it('should remove a group', function(){
                logger.options.groupsEnabled = ['test'];
                logger.removeGroup('test');
                logger.options.groupsEnabled.length.should.equal(0);
            });
            it('should remove a group and leave another one', function(){
                logger.options.groupsEnabled = ['test', 'test2'];
                logger.removeGroup('test');
                logger.options.groupsEnabled.length.should.equal(1);
            });
            it('should remove all occurences of a group', function(){
                logger.options.groupsEnabled = ['test', 'test2', 'test'];
                logger.removeGroup('test');
                logger.options.groupsEnabled.length.should.equal(1);
            });
            it('should remove a group (regex)', function(){
                logger.options.groupsEnabled = [/test/];
                logger.removeGroup(/test/);
                logger.options.groupsEnabled.length.should.equal(0);
            });
            it('should remove all occurences of a group (regex)', function(){
                logger.options.groupsEnabled = [/test/, 'test2', /test/];
                logger.removeGroup(/test/);
                logger.options.groupsEnabled.length.should.equal(1);
            });
            it('should remove multiple groups', function(){
                logger.options.groupsEnabled = ['test1', 'test2', 'test3'];
                logger.removeGroup('test1').removeGroup('test2');
                logger.options.groupsEnabled.length.should.equal(1);
            });
            it('should not blow up when groups is empty', function(){
                logger.options.groupsEnabled = [];
                logger.removeGroup(/test/);
                logger.options.groupsEnabled.length.should.equal(0);
            });
            it('should not blow up when groups is true', function(){
                logger.options.groupsEnabled = true;
                logger.removeGroup(/test/);
                logger.options.groupsEnabled.length.should.equal(0);
            });
            it('should not blow up when groups is false', function(){
                logger.options.groupsEnabled = false;
                logger.removeGroup(/test/);
                logger.options.groupsEnabled.length.should.equal(0);
            });
        });
    });

    // ----------------------------------
    // disabled group tests (blacklist)
    // ----------------------------------
    describe('History tests', function(){
        it('should not log groups that are blacklisted', function(){
            logger.options.groupsDisabled = ['group1'];

            logger.log('group1', 'Should NOT be logged');

            logger.log('group2', 'Should be logged');
            logger.log('group3', 'Should be logged');
                
            logs.length.should.equal(2); 
        });

        it('should not log sub groups that are blacklisted', function(){
            logger.options.groupsDisabled = ['group1'];

            logger.log('group1', 'Should NOT be logged');
            logger.log('group1:subgroup1', 'Should NOT be logged');
            logger.log('group1:subgroup1:subgroup2', 'Should NOT be logged');

            logger.log('group2', 'Should be logged');
            logger.log('group3', 'Should be logged');
                
            logs.length.should.equal(2); 
        });

        it('should not log regex that are blacklisted', function(){
            logger.options.groupsDisabled = [/disabled/];

            logger.log('group1', 'Should be logged');
            logger.log('group1:subgroup1', 'Should be logged');

            logger.log('group1:disabled', 'Should NOT be logged');
            logger.log('disabled', 'Should NOT be logged');
            logger.log('balbaldisabledbalabla', 'Should NOT be logged');
                
            logs.length.should.equal(2); 
        });

        it('should not log multiple blacklisted items', function(){
            logger.options.groupsDisabled = ['group1', /disabled/];

            logger.log('gropu2', 'should be logged');

            logger.log('group1', 'Should NOT be logged');
            logger.log('group1:subgroup1', 'Should NOT be logged');
            logger.log('group1:disabled', 'Should NOT be logged');
            logger.log('disabled', 'Should NOT be logged');
            logger.log('balbaldisabledbalabla', 'Should NOT be logged');
                
            logs.length.should.equal(1); 
        });
    });

    // ----------------------------------
    // Some 'performance' tests
    // ----------------------------------
    describe('performance tests', function(){

        describe('NO transports', function(){

            it('(no transport) should log 100 at once in a trivial amount of time', function(){
                var numLogCalls = 100;
                logger.transports.empty();
                var start = new Date();

                for(var i=0; i<numLogCalls; i++){
                    logger.log('group1', 'hello'); 
                }

                process.stdout.write('\t(no transport) Done with ' + numLogCalls + 
                    ' calls in ' + (+(new Date() - start)) + 'ms \n');

                //logs.length.should.equal(numLogCalls);
            });
            it('(no transports) should log 1,000 messages at once', function(){
                var numLogCalls = 1000;
                logger.transports.empty();
                var start = new Date();

                for(var i=0; i<numLogCalls; i++){
                    logger.log('group1', 'hello'); 
                }

                process.stdout.write('\t(no transport) Done with 1,000 ' +
                    ' calls in ' + (+(new Date() - start)) + 'ms \n');

                //logs.length.should.equal(numLogCalls);
            });
            it('(no transports) should log 10,000 messages at once', function(){
                var numLogCalls = 10000;
                logger.transports.empty();
                var start = new Date();

                for(var i=0; i<numLogCalls; i++){
                    logger.log('group1', 'hello'); 
                }

                process.stdout.write('\t(no transport) Done with 10,000 ' +
                    ' calls in ' + (+(new Date() - start)) + 'ms \n');

                //logs.length.should.equal(numLogCalls);
            });

        });

        describe('TRANSPORT - console everything', function(){
            it('(console) should log 100 at once in a trivial amount of time', function(){
                var numLogCalls = 100;
                var start = new Date();

                for(var i=0; i<numLogCalls; i++){
                    logger.log('group1', 'hello'); 
                }

                process.stdout.write('\t(console) Done with ' + numLogCalls + 
                    ' calls in ' + (+(new Date() - start)) + 'ms \n');

                //logs.length.should.equal(numLogCalls);
            });
            it('(console) should log 1,000 messages at once', function(){
                var numLogCalls = 1000;
                var start = new Date();

                for(var i=0; i<numLogCalls; i++){
                    logger.log('group1', 'hello'); 
                }

                process.stdout.write('\t(console) Done with 1,000 ' +
                    ' calls in ' + (+(new Date() - start)) + 'ms \n');

                //logs.length.should.equal(numLogCalls);
            });
            it('(console) should log 10,000 messages at once', function(){
                var numLogCalls = 10000;
                var start = new Date();

                for(var i=0; i<numLogCalls; i++){
                    logger.log('group1', 'hello'); 
                }

                process.stdout.write('\t(console) Done with 10,000 ' +
                    ' calls in ' + (+(new Date() - start)) + 'ms \n');

                //logs.length.should.equal(numLogCalls);
            });

        });
    });

    // ----------------------------------
    //
    // Reset the console log functionality when done
    //
    // ----------------------------------
    after(function(){
        console.log = origLog;
    });
});
