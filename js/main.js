// Example use of petri.js
// jake kara
// jake@jakekara.com
(function(){

    var go = function(data){
	console.log("main.js");

	d = new PETRI.dish();
	d
	    .data(data)
	    .max_radius(14)
	    .min_radius(4)
	    .radius_field("amount")
	    .selection(d3.select("#viz"))
	    .width("1000")
	    .height("500")
	    .tick(function(a){
		var that = this;
		this.simulation().alpha(0.1);
		that.__context.clearRect(0, 0, d.width(), d.height());
		that.__context.strokeStyle = "black"
		that.__context.lineWidth = 1;

		this.simulation().nodes().forEach(function(n){
		    that.draw_node.call(that,n);
		});

	    })
	    .group_by("group");
    }

    var dt = [];
    for (var i = 0; i < 250; i++){
	dt.push({
	    group: Math.floor(Math.random() * 4),
	    label:"a",
	    amount:Math.floor(Math.random() * 1000) + 100
	});
    }

    // Make fake data
    // With a real viz, I'd call d3.json(url, go);
    go(dt.sort(function(a,b){if (a.amount < b.amount) return -1; return 1;}));
})();


