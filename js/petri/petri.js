var PETRI = PETRI || {};

// Not using this method throughout; just deciding what I think about it
PETRI.set_get = function(set, ret){
    return function(arg){
	if (typeof(arg) == "undefined") return set;
	set = arg;
	return ret;
    }
}

PETRI.dish = function(){
    this.data = PETRI.set_get(this.__data,this);

    // Defaults
    this.__radius_range = [1,30];
    this.__default_radius = 3;
    this.__stroke_color = "black";
    this.__color_function = function(){return "black";};

    return this;
}

PETRI.dish.prototype.set_fill = function(f){
    if (typeof(f) == "undefined") {
	return this.__color_function;
    }
    this.__color_function = f;
    return this;
}

PETRI.dish.prototype.color = function(d){
    return this.__color_function(d);
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

// Prepare the canvas for retina screens.
PETRI.dish.prototype.retina = function(){
    this.__pixel_ratio = window.devicePixelRatio || 1;

    // No need to resize for a 1:1 screen
    if (this.__pixel_ration == 1) return this;
    
    this.__canvas
        .attr("height",this.height() * this.__pixel_ratio)
    	.attr("width", this.width() * this.__pixel_ratio)

    this.__context
    	.scale(this.__pixel_ratio, this.__pixel_ratio)
    
    return this;
}

PETRI.dish.prototype.selection = function(d){
    if (typeof(d) == "undefined") return this.__selection; 
    this.__selection = d;
    this.__canvas = this.__selection
	.append("canvas")
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
    this.__canvas.style("height", d + "px");
    this.retina();
    return this;
}

PETRI.dish.prototype.width = function(d){
    if (typeof(d) == "undefined") return this.geom().width;
    this.retina();
    this.__canvas.attr("width",d);
    this.__canvas.style("width",d + "px");
    return this;
}

PETRI.dish.prototype.responsive = function(){
    var that = this;
    d3.select(window).on("resize", function(){
	that
	.width(that.selection().node().getBoundingClientRect().width)
	// .height(that.selection().node().getBoundingClientRect().height)
	    .update_forces();
    });
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
    if (typeof(f) == "undefined") {
	if (typeof(this.__tick_function == "undefined")){
	    this.__tick_function = function(a){
		this.simulation().alpha(0.9);
		this.__context.clearRect(0, 0, this.width(), this.height());
		this.__context.strokeStyle = this.__stroke_color;
		this.__context.lineWidth = 1;

		var that = this;
		this.simulation().nodes().forEach(function(n){
		    that.draw_node.call(that,n);
		});
	    }
	}
	return this.__tick_function;
    }
    this.__tick_function = f;
    return this;
}

PETRI.dish.prototype.rearrange = function(f){
    this.simulation().nodes().forEach(function(n){
	n.__destination = f(n);
    });
    this.update_forces();
    return this;
}

PETRI.dish.prototype.update_forces = function(){
    if (typeof(this.__simulation) == "undefined") return this;

    var that = this;
    this.simulation()
            .force("x",
	       d3.forceX(function(n) {
		   if (n.hasOwnProperty("__destination")
		      && n["__destination"] != null){
		       return n.__destination[0];
		   }
		   return that.width() / 2;
	       })
	       .strength(0.5))
	.force("y",
	       d3.forceY(function(n) {
		   if (n.hasOwnProperty("__destination")
		      && n["__destination"] != null){
		       return n.__destination[1];
		   }
		   return that.height() / 2;
	       })
	       .strength(0.5))


    return this;
}

PETRI.dish.prototype.simulation = function(){
    if (typeof(this.__simulation) != "undefined") return this.__simulation;

    var that = this;
    this.__simulation = d3.forceSimulation(this.data())
	.on("tick", function(){
	    that.tick().call(that);
	})
    this.update_forces();
    this.__simulation
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
		.iterations(20)
		.radius(function(n){
		    var col_radius = that.radius(n) + 1;
		    return col_radius;
		}));


    return this.__simulation;
}

PETRI.dish.prototype.center = function(x, y){
    this.simulation().force("center",d3.forceCenter(x,y));
}

PETRI.dish.prototype.unlock = function(){
    this.rearrange(function(d){
	return null;
    });
    return this;
}

PETRI.dish.prototype.group_by = function(field){
    var that = this;
    this.simulation()
	.force("links",
	       d3.forceLink(this.make_links(field)))
	.force("repel",
	       d3.forceManyBody()
	       .strength(function(n){
		   var radius = that.radius(n);
		   return radius * -10;}));
    return this;
}

PETRI.dish.prototype.ungroup = function(){
    this.simulation()
	.force("links", null)
	.force("repel", null);
    return this;
}

PETRI.dish.prototype.grid_formation = function(){
    this.ungroup();
    var node_count = this.simulation().nodes().length;

    var width = this.width();
    var height = this.height();
    var area = width * height;

    var cols = Math.ceil(Math.sqrt(node_count))
    var rows = Math.ceil(node_count / cols);

    var node_width = width / rows;
    var node_height = height / cols;
    
    var that = this;
    var col = 0;
    var row = -1;
    this.rearrange(function(n){
	if (col >= cols) col = 0;
	if (col == 0){
	    row ++;
	}
	var ret = [Math.round(col * node_width), Math.round(row * node_height)];
	col++;
	return ret;
	
    });
	
    
}

PETRI.dish.prototype.scramble_formation = function(){
    this.ungroup();
    var that = this;
    this.rearrange(function(n){
	var ret = [Math.random() * that.width(),
		   Math.random() * that.height()];
	return ret;
    });
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
    var scale = d3.scaleLinear()
	.range(this.__radius_range)
	.domain(this.__radius_domain);
    this.data(this.data().forEach(function(d){
	var radius = scale(d[that.__radius_field]);
	d.__radius = scale(d[that.__radius_field]);
    }));

    this.update_forces();
    return this;
}

PETRI.dish.prototype.radius = function(d){
    if (d.hasOwnProperty("__radius")) return d.__radius;
    if (typeof(this.__radius_field) == "undefined"){
	return this.__default_radius;
    }
}

PETRI.dish.prototype.draw_node = function(d){
    var context = this.__context;
    context.beginPath();
    context.fillStyle = this.color(d);

    var radius = d.__radius || this.__default_radius;
    context.moveTo(d.x + radius, d.y);
    context.arc(d.x, d.y, radius, 0, 2 * Math.PI);

    context.stroke();
    context.fill();
    
    
}

PETRI.node = function(nd){
    this.__nd = nd;
    return this;
}




