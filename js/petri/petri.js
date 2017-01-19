var PETRI = PETRI || {};

PETRI.set_get = function(set, ret){
    return function(arg){
	if (typeof(arg) == "undefined") return set;
	set = arg;
	return ret;
    }
}

PETRI.dish = function(){
    this.data = PETRI.set_get(this.__data,this);
    this.__radius_range = [1,30];
    this.__default_radius = 3;
    return this;
}


PETRI.dish.prototype.max_radius = function(r){
    if (typeof(r) == "undefined") return this.__radius_range[1];
    this.__radius_range[1] = r;
    return this || this.__default_radius;
}

PETRI.dish.prototype.min_radius = function(r){
    if (typeof(r) == "undefined") return this.__radius_range[0];
    this.__radius_range[0] = r;
    return this;
}

PETRI.dish.prototype.make_links = function(field){
    var links = [];
    var data = this.data();
    var that = this;
    data.forEach(function(n,i){
	data.forEach(function(m,j){
	    if (n == "undefined"){
		console.log(i + " is undefined")
	    }
	    if(m == "undefined"){
		console.log(j + " is undefined")
	    }
	    if (n[field] == m[field] && n != m){
		links.push({
		    "source":i,
		    "target":j,
		    "distance": that.radius(n)
			// + that.radius(m)
			// + that.__radius_range[0]
		});
	    }
	});
    });
    
    return links;
    
    
}

PETRI.dish.prototype.selection = function(d){
    if (typeof(d) == "undefined") return this.__selection; 
    this.__selection = d;
    this.__canvas = this.__selection.append("canvas")
	.classed("petri", true)
    this.__context = this.__canvas.node().getContext("2d");
    return this;
}

// Get canvas bounding rect
PETRI.dish.prototype.geom = function(){
    return this.__canvas.node().getBoundingClientRect();
}

PETRI.dish.prototype.height = function(d){
    if (typeof(d) == "undefined") return this.geom().height;
    this.__canvas.attr("height", d);
    return this;
}

PETRI.dish.prototype.width = function(d){
    if (typeof(d) == "undefined") return this.geom().width;
    this.__canvas.attr("width",d);
    return this;
}

PETRI.dish.prototype.style_function = function(f){
    if (typeof(f) == "undefined") return f;
    this.__style_function = f;
    return this;
}

PETRI.dish.prototype.x_force = function(f){
    var that = this;
    if (typeof(f) == "undefined") {
	return this.__x_force ||
	    function(){return that.width() / 2};
    }
    this.__x_force = d3.forceX(f);
    return this 
}

PETRI.dish.prototype.y_force = function(f){
    var that = this;
    if (typeof(f) == "undefined") {
	return this.__y_force ||
	    function(){return that.height() / 2};
    }
    this.__y_force = d3.forceY(f);
    return this;
}

PETRI.dish.prototype.tick = function(f){
    if (typeof(f) == "undefined") return this.__tick_function || function(){};
    this.__tick_function = f;
    return this;
}

PETRI.dish.prototype.simulation = function(){
    if (typeof(this.__simulation) != "undefined") return this.__simulation;

    var that = this;
    this.__simulation = d3.forceSimulation(this.data())
	.on("tick", function(){
	    that.__tick_function.call(that);
	})
	.force("x",
	       d3.forceX(function(n) {
		   if (n.hasOwnProperty("__destination")){
		       return n.__desintation[0];
		   }
		   return d.width() / 2
	       })
	       .strength(.5))
	.force("y",
	       d3.forceY(function(n) {
		       if (n.hasOwnProperty("__destination")){
			   return n.__desintation[0];
		       }
		       return d.height() / 2;
		   })
	       .strength(.5))
    	.force(
	    "repel",
	    d3.forceManyBody()
		.strength(function(n){
		    var radius = that.radius(n);
		    return radius * -10;})
	)
	.force(
	    "collide",
	    d3.forceCollide()
		.strength(0.2)
		.iterations(10)
		.radius(function(n){
		    var col_radius = that.radius(n) + 1;
		    return col_radius;
		}));

    return this.__simulation;
}

PETRI.dish.prototype.center = function(x, y){
    this.simulation().force("center",d3.forceCenter(x,y));
}

PETRI.dish.prototype.group_by = function(field){
    this.simulation().force("links",
			    d3.forceLink(this.make_links(field)));

}

PETRI.dish.prototype.radius_field = function(f){
    if (typeof(f) == "undefined") return this.__radius_field;
    this.__radius_field = f;

    var radius_domain = [];
    var sorted = this.data().sort(function(a, b){
	if (a[f] < b[f]) return -1;
	return 1;
    }).map(function(a){ return a[f]; });

    this.__radius_domain = [sorted[0],
			    sorted[sorted.length - 1]];

    var that = this;
    this.data(this.data().forEach(function(d){
	var radius = that.radius(d[f]);
	d.__radius = that.radius(d);
    }));
    return this;
}

PETRI.dish.prototype.radius = function(d){
    if (d.hasOwnProperty("__radius")) return d.__radius;
    return d3.scaleLinear()
	.range(this.__radius_range)
	.domain(this.__radius_domain)(d[this.__radius_field]);
}

PETRI.dish.prototype.draw_node = function(d){
    var context = this.__context;
    context.beginPath();
    context.fillStyle = ["gold",
    			 "tomato",
    			 "lightskyblue",
    			 "palegreen",
    			 "gold"] [d.group % 5]; // todo
    var radius = d.__radius || this.__default_radius;
    context.moveTo(d.x + radius, d.y);
    context.arc(d.x, d.y, radius, 0, 2 * Math.PI);

    context.stroke();
    context.fill();
    
    
}

PETRI.node = function(){
    return this;
}

PETRI.node.prototype.style_function = function(f){
    if (typeof(f) == "undefined") return f;
    this.__style_function = f;
    return this;
}


