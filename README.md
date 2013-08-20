QueueManager
============

With this module you can process and manage operations on large queues of items or elements.

## Summary:
| Function | Description |
| ----- | ----- |
| queueManager | Create a new queue. |
| queueObj.add | Add a single item onto the queue. |
| queueObj.addEach | Add multiple items onto the queue, individually. |
| queueObj.start | Start a currently paused queue. |
| queueObj.next | Intended to be called from within the queueManager.each() callback, this method will continue a queue with a delay of -1. |
| queueObj.clear | Clear a queue completely. |
| queueObj.pause | Pause a currently running queue. |
| queueObj.update | Update an existing queue’s options. |
| queueObj.size | Get the current queue length. |
| queueObj.indexOf | Get the current index in the queue of the passed item. |

## Installation Bower:
<!---->

    bower install queueManager --save

> For more installation details please see [Bower](http://bower.io/)

## queueManager()

#### Usage:
```js
var queueObj = new queueManager( options );
```

#### Arguments:
* options	(Object) An object containing options specific to this queue.

#### Options:
* delay	(Number) Time in milliseconds between each callback execution.  If delay is -1, queue will wait for a queueObj.next call instead of auto-executing.  Defaults to 100.
* batch	(Number) Number of queue items to process at a time.  If less than this number of items remain in the queue, the remainder will be processed.  Defaults to 1.
* queue	(Array) Populate the queue initially with these items.  Defaults to an empty initial queue.
* callback	(Function) Called for each queue item or batch of items, every delay milliseconds.  This function is passed a single argument, which is the single queue item if batch is 1, or an array of queue items if batch is > 1.  If callback returns true, the queue item(s) will be re- added back onto the front of the queue for the next callback execution to retry.  Inside this function, `this` refers to the queueObj object.
* complete	(Function) Called whenever there are no longer any queue items to process.  After completion, if more queue items are added and the queue completes again, this function will be called again.  Inside this function, `this` refers to the queueObj object.
* paused	(Boolean) If true, initialize this queue in a paused state.  Defaults to false.

## queueManager.add()

Add a single item onto the queue.  If you want to add multiple items onto the queue individually, use queueObj.addEach.  If the queue was empty and not paused, processing will resume immediately.

#### Usage:
```js
queueObj.add( item [, priority ] );
```

#### Arguments:
* item (Anything) A single item to add to the queue.
* priority(Boolean) If true, the item is added to the front of the queue, otherwise the item is added to the end of the queue.  Defaults to false.

#### Returns:
* (Object) Reference to self.

## queueManager.addEach()

Add multiple items onto the queue, individually.  If you want to add a single item onto the queue, use queueObj.add.  If the queue was empty and not paused, processing will resume immediately.

#### Usage:
```js
queueObj.addEach( items [, priority ] );
```

#### Arguments:
* items (Array) An array of items to add to the queue.
* priority (Boolean) If true, the items are added to the front of the queue, otherwise the items are added to the end of the queue.  Defaults to false.

#### Returns:
* (Object) Reference to self.

## queueManager.start()

Start a currently paused queue.  If an empty queue is started, it will automatically start processing items as soon as they are added.

#### Usage:
```js
queueObj.start();
```

#### Returns:
* Nothing.

## queueManager.next()

Intended to be called from within the jQuery.jqmq callback, this method will continue a queue with a delay of -1.  This is most useful for queues of asynchronous-but-serial actions, like AJAX requests that must execute in order, but not overlap.

#### Usage:
```js
queueObj.next( [ retry ] );
```

#### Arguments:
* retry (Boolean) If true, the queue item(s) will be re-added back to the front of the queue to be retried on the next queue execution.

#### Returns:
* Nothing.

## queueManager.clear()

Clear a queue completely.  The paused/started status of the queue is unchanged.

#### Usage:
```js
queueObj.clear();
```

#### Returns:
* (Array) The previous queue contents.

## queueManager.pause()

Pause a currently running queue.  A paused but empty queue will need to be manually restarted with queueObj.start even after new items are added.

#### Usage:
```js
queueObj.pause();
```
#### Returns:
* (Object) Reference to self.

## queueManager.update()

Update an existing queue’s options.

#### Usage:
```js
queueObj.update( options );
```

#### Arguments:
* options(Object) An object containing options specific to this queue.

#### Options:
The delay, batch, callback and complete options from queueManager can be updated. The queue and paused state can be changed using the other queueObj methods.

#### Returns:
* Nothing.


## queueManager.size()

Get the current queue length.

#### Usage:
```js
queueObj.size();
```

#### Returns:
* (Number) The length of the queue.

## queueManager.indexOf()

Get the current index in the queue of the passed item.

#### Usage:
```js
queueObj.indexOf( item );
```

#### Arguments:
* item (Anything) An item to test the index of.

#### Returns:
* (Number) The index of the passed item in the queue.  Returns -1 if not found.

## queueManager.each()

A generic iterator function.

#### Usage:
```js
queueObj.each(function(item){
	// TODO Add Item processing code here
});
```
#### Arguments:
* function (Function) The function that will be executed on every object. This function is passed a single argument, which is the single queue item if batch is 1, or an array of queue items if batch is > 1.  If callback returns true, the queue item(s) will be re- added back onto the front of the queue for the next callback execution to retry.  Inside this function, `this` refers to the queueObj object.

#### Returns:
* (Object) Reference to self.

## queueManager.complete()

Called whenever there are no longer any queue items to process.

#### Usage:
```js
queueObj.complete(function(){
	// TODO Add final processing code here
});
```
#### Arguments:
* function (Function) Called whenever there are no longer any queue items to process.  After completion, if more queue items are added and the queue completes again, this function will be called again.  Inside this function, `this` refers to the queueObj object.

#### Returns:
* (Object) Reference to self.


## Basic usage auto executing:
```js
var queue = new queueManager({delay: 1})
queue.each(function(item){
    console.log("processing: " + item);
})
.complete(function(){
    console.log("Work Complete");
})
.add("foo")
.add("bar")
.add('baz')
```
## Non auto executing queues (delay -1):

```js
var queue = new queueManager({delay: -1})
queue.each(function(item){
    console.log("processing: " + item);
    this.next();
})
.pause()
.add("foo")
.add("bar")
.add('baz')
.complete(function(){
    console.log("Work Complete");
})
.start();
```

## Alternative usage w/callbacks:
```js
var queue = new queueManager({
	delay: 1,
	batch: 1,
	callback: function(item) {
		console.log("processing: " + item);
	},
	complete: function() {
		console.log("Work Complete");
	}
});
queue.pause();
queue.add("foo");
queue.add("bar");
queue.start();
```

# Acknowledgments

See the LICENSES.md file for copies of the referenced licenses.

1. jQuery message queuing by "Cowboy" Ben Alman from <http://benalman.com/projects/jquery-message-queuing-plugin/> and are available under dual licenses the MIT and GPL licenses. http://benalman.com/about/license/
2. Node extend <https://github.com/justmoon/node-extend> Ported by Stefan Thomas with contributions by Jonathan Buchanan. MIT license.
