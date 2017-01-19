// Example use of petri.js
// jake kara
// jake@jakekara.com
(function(){

    var go = function(data){

	// Create a new petri dish and do all the main setup here
	var d = new PETRI.dish();
	d
	    .data(data)
	    .max_radius(14)
	    .min_radius(4)
	    .radius_field("amount")
	    .set_fill(function(d){
		return ["gold","palegreen","lightskyblue","tomato"]
		[d.group % 4];
	    })
	    .selection(d3.select("#viz"))
	    .width(window.innerWidth)
	    .height(window.innerHeight)
	    // .group_by("group")
	    .responsive()
	    .simulation();


	// Show off some features
	var funcs = [function(){
	    d.unlock();
	    d.group_by("group")},
		     function(){d.grid_formation()},
		     function(){
			 d.scramble_formation();
		     }
		    ];
	var i = 0;

	setInterval(function(){
	    if (i > funcs.length - 1) i = 0;
	    funcs[i]();
	    i++;
	},5000);

	
	return d;
    }

    // Make fake data
    var dt = [];
    for (var i = 0; i < 250; i++){
	dt.push({
	    group: Math.floor(Math.random() * 4),
	    label:"a",
	    amount:Math.floor(Math.random() * 1000) + 100
	});
    }

    // With a real viz, I'd call d3.json(url, go);
    EXAMPLE = go(dt.sort(function(a,b){if (a.amount < b.amount) return -1; return 1;}));
})();


