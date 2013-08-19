var assert = chai.assert,
    expect = chai.expect,
    should = chai.should(); // Note that should has to be executed

describe('QueueManager', function () {
    it('QueueManager exist', function() {
        should.exist(QueueManager);
    });
    it('should create a queue', function(){
        var queue = new QueueManager({delay: 1});
        var isInstance = queue instanceof QueueManager;
        expect(isInstance).to.equal(true);
    });
    it('should add an item to the queue', function() {
        var queue = new QueueManager({delay: 1});
        var size = queue.pause().add("foo").size();
        expect(size).to.equal(1);
    });
    it('should add two items to the queue', function(){
        var queue = new QueueManager({delay: 1});
        var size = queue.pause().add("foo").add("bar").size();
        expect(size).to.equal(2);
    });
    it('should process a single item queue', function(){
        var queue = new QueueManager({delay: 1});
        queue.each(function(item){
            assert.equal(item, 'foo', 'item equal `foo`');
        }).pause().add("foo").start();
    });
    it('should process a queue of tree items', function(){
        var total = 0;
        var queue = new QueueManager({delay: 1});
        queue.each(function(item){
            if(!item) throw new Error();
            total += item;
        })
        .pause()
        .add(1)
        .add(2)
        .add(3)
        .complete(function(){
            expect(total).to.equal(6);
        })
        .start();
    });
    describe("Should sum all numbers in a queue [1, 2, 3]", function(){  
        var total = 0;
        var queue = new QueueManager({delay: 1});
        queue.each(function(item){
            //if(!item) throw new Error();
            total += item;
        })
        .pause()
        .add(1)
        .add(2)
        .add(3)
        .start();

        before(function(done){
            queue.complete(function(){
                done();
            });
        });
        it("total should be 6", function(){    
            expect(total).to.equal(6);
        });
    });
});