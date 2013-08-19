/*!
* Queuing Manager - v1.0 - 14/08/2013
* http://benalman.com/projects/jquery-message-queuing-plugin/
* 
* Copyright (c) 2013 Benjamin Maggi
* Dual licensed under the MIT and GPL licenses.
*/

// *Version: 1.0, Last updated: 14/08/2013*
// 
// GitHub       - http://github.com/maggiben
// Source       - http://github.com/maggiben
// 
// About: Acknowledgements
//
// Most of this code is based on "jQuery Message Queuing" plugin by "Cowboy" Ben Alman 
// Check out his excelent work here: http://benalman.com/projects/jquery-message-queuing-plugin/
// And Here: http://github.com/cowboy/jquery-message-queuing/
// 
// About: License
// 
// Copyright (c) 2013 Benjamin Maggi,
// Dual licensed under the MIT and GPL licenses.
// 
// About: Release History
// 
// 1.0 - (14/08/2013) Initial release
//
// About: Usage
//
// Create a new queue.
// 
// > var queue = new QueueManager( options );
// 
// Arguments:
// 
//  options - (Object) An object containing options specific to this queue.
// 
// Options:
// 
//   delay - (Number) Time in milliseconds between each callback execution. If
//     delay is -1, queue will wait for a <queueObj.next> call instead of
//     auto-executing. Defaults to 100.
//   batch - (Number) Number of queue items to process at a time. If less than
//     this number of items remain in the queue, the remainder will be
//     processed. Defaults to 1.
//   queue - (Array) Populate the queue initially with these items. Defaults
//     to an empty initial queue.
//   callback - (Function) Called for each queue item or batch of items, every
//     delay milliseconds. This function is passed a single argument, which is
//     the single queue item if batch is 1, or an array of queue items if
//     batch is > 1. If callback returns true, the queue item(s) will be re-
//     added back onto the front of the queue for the next callback execution
//     to retry. Inside this function, `this` refers to the queueObj object.
//   complete - (Function) Called whenever there are no longer any queue items
//     to process. After completion, if more queue items are added and the
//     queue completes again, this function will be called again. Inside this
//     function, `this` refers to the queueObj object.
//   paused - (Boolean) If true, initialize this queue in a paused state.
//     Defaults to false.
// 
// Returns:
// 
//  (Object) a reference to the jqmq queue object.


(function (root, factory) {
    "use strict";
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(require('jquery'), require('debug'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'debug'], factory);
    } else {
        // Browser globals (root is window)
        root.QueueManager = factory(root.jquery, root.debug);
}
}(this, function (jquery, debug) {
    "use strict";
    var QueueManager = (function() {
        function QueueManager(settings) {
            ////////////////////////////////////////////////////////////////////
            // Constructor                                                    //
            ////////////////////////////////////////////////////////////////////
            var _self = this;
            this.version = '1.0';
            var defaults = {
                delay: 100,
                batch: 1,
                callback: null,
                complete: null,
                paused: false,
                queue: []                
            };
            // Merge options
            this.options = jquery.extend({}, defaults, settings);
            // The actual queue.
            this.queue = this.options.queue;
            this.paused = this.options.paused;
            this.recent = [];
            this.timeout_id;
            this.cleared;
            
            // If queue isn't explicitly paused, start it.
            if(!this.paused) {
                this.start();
            }
        }
        ////////////////////////////////////////////////////////////////////
        // Define chainable methods                                       //
        ////////////////////////////////////////////////////////////////////
        
        // Method: QueuManager.each
        //
        // Usage:
        // 
        // > QueueManager.each( function(item) {} );
        //
        // Arguments:
        //
        //  args - (Function) Called for each queue item or batch of items, every
        //     delay milliseconds. This function is passed a single argument, which is
        //     the single queue item if batch is 1, or an array of queue items if
        //     batch is > 1. If callback returns true, the queue item(s) will be re-
        //     added back onto the front of the queue for the next callback execution,
        //     to retry. Inside this function, `this` refers to the QueueManager object.
        //
        // Returns:
        // 
        //  (Object) Reference to QueueManager object.

        QueueManager.prototype.each = function(args) {
            var that = this;
            this.onEach = args;
            return that;
        };
        
        // Method: QueueManager.complete
        //
        // Processes to be executed after queue completion.
        //
        // Usage:
        // 
        // > QueueManager.complete( function() {} );
        // 
        // Arguments:
        //
        //  args - (Function) Called whenever there are no longer any queue items
        //     to process. After completion, if more queue items are added and the
        //     queue completes again, this function will be called again. Inside this
        //     function, `this` refers to the queueObj object. 
        // 
        // Returns:
        // 
        //  (Object) Reference to QueueManager object.

        QueueManager.prototype.complete = function(args) {
            var that = this;
            that.onComplete = args;
            return that;
        }
        // Method: QueueManager.add
        // 
        // Add a single item onto the queue. If you want to add multiple items onto
        // the queue individually, use <QueueManager.addEach>. If the queue was empty and
        // not paused, processing will resume immediately.
        // 
        // Usage:
        // 
        // > QueueManager.add( item [, priority ] );
        // 
        // Arguments:
        // 
        //  item - (Anything) A single item to add to the queue.
        //  priority - (Boolean) If true, the item is added to the front of the
        //    queue, otherwise the item is added to the end of the queue. Defaults
        //    to false.
        // 
        // Returns:
        // 
        //  (Number) The length of the queue, after the item has been added.

        QueueManager.prototype.add = function( item, priority ) {
            var that = this;
            return that.addEach( [ item ], priority );
        };
    
        // Method: QueueManager.addEach
        // 
        // Add multiple items onto the queue, individually. If you want to add a
        // single item onto the queue, use <QueueManager.add>. If the queue was empty and
        // not paused, processing will resume immediately.
        // 
        // Usage:
        // 
        // > QueueManager.addEach( items [, priority ] );
        // 
        // Arguments:
        // 
        //  items - (Array) An array of items to add to the queue.
        //  priority - (Boolean) If true, the items are added to the front of the
        //    queue, otherwise the items are added to the end of the queue. Defaults
        //    to false.
        // 
        // Returns:
        // 
        //  (Number) The length of the queue, after the items have been added.

        QueueManager.prototype.addEach = function( items, priority ) {
            var that = this;
            if ( items ) {
                // Unset "cleared" status.
                that.cleared = false;
                // Push all items, individually, onto the queue. If priority is true, send
                // them to the beginning, otherwise, send them to the end.
                that.queue = priority
                    ? items.concat( that.queue )
                    : that.queue.concat( items );
                // If queue isn't explicitly paused, restart it.
                if(!that.paused) {
                    that.start();
                }
            }
            return that;
        };

        // Method: QueueManager.start
        // 
        // Start a currently paused queue. If an empty queue is started, it will
        // automatically start processing items as soon as they are added.
        // 
        // Usage:
        // 
        // > QueueManager.start();
        // 
        // Returns:
        // 
        //  Nothing.
        
        QueueManager.prototype.start = function() {
            // Flag queue as un-paused.
            var that = this;
            this.paused = false;
            if ( this.size() && !this.timeout_id && !this.recent.length ) {

                (function loopy(){
                    var delay = that.options.delay;
                    var batch = that.options.batch;
                    var complete = that.options.complete || that.onComplete;
                    var callback = that.options.callback || that.onEach;

                    // Clear timeout_id.
                    that.stop();
                    // If queue is empty, call the "complete" method if it exists and quit.
                    if ( !that.size() ) {
                        that.cleared = true;
                        complete && complete.apply( that );
                        return;
                    }
                    // Queue has items, so shift off the first `batch` items.
                    that.recent = that.queue.splice( 0, batch );
              
                    // If "callback" method returns true, unshift the queue items for
                    // another attempt.
                    if ( callback && callback.apply( that, [(batch === 1 ? that.recent[0] : that.recent)] ) === true ) {
                        that.queue = that.recent.concat( that.queue );
                        that.recent = [];
                    }
                    
                    // Repeatedly loop if the delay is a number >= 0, otherwise wait for a
                    // $.jqmqNext() call.
                    if ( typeof delay === 'number' && delay >= 0 ) {
                        that.recent = [];
                        that.timeout_id = setTimeout( loopy, delay );
                    }
                })();
            }
        };

        // Method: QueueManager.next
        // 
        // Intended to be called from within the <jQuery.jqmq> callback, this method
        // will continue a queue with a delay of -1. This is most useful for queues
        // of asynchronous-but-serial actions, like AJAX requests that must execute
        // in order, but not overlap.
        // 
        // Usage:
        // 
        // > QueueManager.next( [ retry ] );
        // 
        // Arguments:
        // 
        //  retry - (Boolean) If true, the queue item(s) will be re-added back to
        //    the front of the queue to be retried on the next queue execution.
        // 
        // Returns:
        // 
        //  Nothing.
    
        QueueManager.prototype.next = function( retry ) {
            var that = this;
            var complete = that.options.complete || that.onComplete;
          
            // If retry is true, unshift the most recent items for another attempt.
            if ( retry ) {
                that.queue = that.recent.concat( that.queue );
            }
          
            // Reset the recent items list.
            that.recent = [];
          
            // If queue is empty (but not from calling .clear), call the "complete"
            // method if it exists, otherwise continue processing the queue (if not
            // paused).
            if ( that.size() ) {
                that.paused || that.start();
            } else if ( !that.cleared ) {
                that.cleared = true;
                complete && complete.apply( that, self );
            }
        };

        // Method: QueueManager.clear
        // 
        // Clear a queue completely. The paused/started status of the queue is
        // unchanged.
        // 
        // Usage:
        // 
        // > QueueManager.clear();
        // 
        // Returns:
        // 
        //  (Array) The previous queue contents.

        QueueManager.prototype.clear = function() {
            var that = this;
            var result = that.queue;

            // Stop the queue if it is running.
            that.stop();

            // Clear the queue.
            that.queue = [];
            that.cleared = true;

            // Reset the recent items list.
            that.recent = [];

            // Return the previous queue, in case it's needed for some reason.
            return result;
        };

        // Method: QueueManager.pause
        // 
        // Pause a currently running queue. A paused but empty queue will need to be
        // manually restarted with <QueueManager.start> even after new items are added.
        // 
        // Usage:
        // 
        // > QueueManager.pause();
        // 
        // Returns:
        // 
        //  Nothing.

        QueueManager.prototype.pause = function() {
            var that = this;
            // Stop the queue if it is running.
            that.stop();

            // Flag it as paused.
            that.paused = true;
            return that;
        };

        // Method: QueueManager.update
        // 
        // Update an existing queue's options.
        // 
        // Usage:
        // 
        // > QueueManager.update( options );
        // 
        // Arguments:
        // 
        //  options - (Object) An object containing options specific to this queue.
        // 
        // Options:
        // 
        //   The delay, batch, callback and complete options from <jQuery.jqmq> can
        //   be updated. The queue and paused state can be changed using the other
        //   QueueManager methods.
        // 
        // Returns:
        // 
        //  Nothing.
        
        QueueManager.prototype.update = function( opts ) {
            var that = this;
            $.extend( that.options, opts );
        };

        // Method: QueueManager.size
        // 
        // Get the current queue length.
        // 
        // Usage:
        // 
        // > QueueManager.size();
        // 
        // Returns:
        // 
        //  (Number) The length of the queue.
        QueueManager.prototype.size = function() {
            var that = this;
            return that.queue.length;
        };

        // Method: QueueManager.indexOf
        // 
        // Get the current index in the queue of the passed item.
        // 
        // Usage:
        // 
        // > QueueManager.indexOf( item );
        // 
        // Arguments:
        // 
        //  item - (Anything) An item to test the index of.
        // 
        // Returns:
        // 
        //  (Number) The index of the passed item in the queue. Returns -1 if not
        //  found.

        QueueManager.prototype.indexOf = function( item ) {
            var that = this;
            return that.queue.indexOf(item);
        };

        // Stop a running queue, optionally flagging it as paused.
        QueueManager.prototype.stop = function() {
            var that = this;
            that.timeout_id && clearTimeout(that.timeout_id);
            that.timeout_id = undefined;
            return that;
        };
        ////////////////////////////////////////////////////////////////////////
        // Get module version number                                          //
        ////////////////////////////////////////////////////////////////////////
        QueueManager.prototype.getVersion = function() {
            return this.version;
        };

        return QueueManager;
    }());
    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return QueueManager;
}));      


