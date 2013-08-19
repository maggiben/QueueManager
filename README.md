QueueManager
============

With this module you can process and manage operations on large queues of items or elements.

### Usage:
```js
var queue = new queueManager({delay: -1})
queue.each(function(item){
    console.log("processing: " + item);
    this.next();
})
.pause()
.add("pirulo")
.add("stuff")
.add('things')
.complete(function(){
    console.log("all tasks done");
})
.start();
