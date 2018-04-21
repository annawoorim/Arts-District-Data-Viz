// Global variables
var width,
	height,
	svg,
	color,
	path,
	selected;

// legend and color data
var data_set = {
	"NHW_CHG_00_15" : {
		"color_domain" : [-10, -5, 0, 5, 10, 20],
		"color_range" : d3.schemeBlues[7],
		"legend_domain" : [-20, 30],
		"legend_range" : [0, 300],
		"label" : "% change in non-Latinx white",
		"ratio" : 1
	},
	"INCOME_CHG" : {
		"color_domain" : [-25, -10, -5, 0, 5, 10, 20, 50],
		"color_range" : d3.schemeBlues[8],
		"legend_domain" : [-25, 50],
		"legend_range" : [0, 300],
		"label" : "$ (in thousands) change in median yearly income",
		"ratio" : 1000
	},
	"RENT_CHG" : {
		"color_domain" : [-700, -100, 0, 100, 300, 1000, 1500],
		"color_range" : d3.schemeBlues[7],
		"legend_domain" : [-700, 1500],
		"legend_range" : [0, 350],
		"label" : "$ change in median monthly rent",
		"ratio" : 1
	}
}

function init() {
	setMap();
}

function setMap() {
	// Width and Height of the whole visualization
	width = window.innerWidth;
    height = window.innerHeight;

	// Create SVG
	svg = d3.select( "body" )
		.append( "svg" )
		.attr( "width", width )
		.attr( "height", height )
		.append("g");

	selected = "NHW_CHG_00_15";

	// Generate initial color
	updateColor();

	// Generate initial legend
	updateLegend();

	// Generate initial map
	loadData();

	// select variable for which to display a legend
	d3.selectAll("input")
		.on("change", function() {
			selected = this.id;
			updateColor();
			updateLegend();
			loadData();
		}
	);
}

function loadData() {
  d3.queue()
    .defer(d3.json, "../data/census_tracts_with_data.json")
    .defer(d3.json, "../data/roads_updated_topo.json")
    .await(processData);
}

function processData(error, censusTractsFile, streetsFile) {
	if (error) throw error;
	console.log(streetsFile);
	updateMap(censusTractsFile);
}

function updateColor() {
	color = d3.scaleThreshold()
		.domain(data_set[selected].color_domain)
		.range(data_set[selected].color_range);
		//.range(["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f", "#54278f"]);
}

function updateLegend() {
	d3.select("body").selectAll("rect").remove();
	d3.select("body").selectAll("text").remove();
	d3.select("body").selectAll(".tick").remove();

	var svgLegend = svg.append("g")
		.attr("class", "key")
		.attr("transform", "translate(40,40)");

	 
	// A position encoding for the key

	var x = d3.scaleLinear()
		.domain(data_set[selected].legend_domain)
		.range(data_set[selected].legend_range); // not sure what this does??

	svgLegend.selectAll("rect")
		.data(color.range().map(function(d, i) {
			return {
				x0: i ? x(color.domain()[i - 1]) : x.range()[0],
				x1: i < color.domain().length ? x(color.domain()[i]) : x.range()[1],
				z: d
			};
		}))
		.enter().append("rect")
		.attr("height", 8)
		.attr("x", function(d) { return d.x0; })
		.attr("width", function(d) { return d.x1 - d.x0; })
		.attr("fill", function(d) { return d.z; });

	svgLegend.append("text")
		.attr("class", "caption")
		.attr("x", x.range()[0])
		.attr("y", -6)
		.attr("fill", "#000")
		.attr("text-anchor", "start")
		.attr("font-weight", "bold")
		.text(data_set[selected].label);

	svgLegend.call(d3.axisBottom(x)
		.tickSizeInner(13)
		.tickSizeOuter(0)
		.tickValues(color.domain()))
	.select(".domain")
		.remove();
}

function updateMap(censusTractsFile, streetsFile) {
	//d3.select("g").selectAll("path").remove();

	// Create GeoPath function that uses built-in D3 functionality 
	// to turn lat/lon coordinates into screen coordinates
	var projection = d3.geoAlbers().fitSize([width, height], censusTractsFile);
	path = d3.geoPath().projection(projection);

	// Select non-existent elements, bind the data, append the elements, 
	// and apply attributes
	svg.append("g")
		.attr("class", "tract")
		.selectAll("path")
		//.data(censusTractsFile.features)
		.data(censusTractsFile.features)
		.enter().append("path")
		.attr("d", path)
		.attr("fill", function(d) { return color(d.density = d.properties[selected]/data_set[selected].ratio); })
		.attr("stroke-width", "1")
		.attr("stroke", "white");
		//.append("title")
      //  .text(function(d) { return d.properties[selected] + "%"; });

    // add roads
    // draws road boundaries
	//var roads = svg.append("g");

	//roads.append("path")
	//	.datum(topojson.mesh(streetsFile, streetsFile.objects.roads_updated))
	//	.attr("class", "road")
	//	.attr("d", path)
	//	.attr("fill", "transparent")
	//	.attr("stroke", "#000")
	//	.attr("stroke-width", 0.14);

	//.datum(topojson.mesh(roadsFile, roadsFile.objects.sf))

    addLabels(censusTractsFile);
}

function addLabels(censusTractsFile) {
	// Add district labels
	svg.selectAll("label")
		.data(censusTractsFile.features)
		.enter()
		.append("text")
			.attr("class", "label")
			.attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
			.attr ("text-anchor", "middle")
			.text(function(d) { return d.properties.NAME;} );
}

//Tryna plot a point here...
//svg.selectAll("circle")
//	.data([34.045132, -118.235271]).enter()
//	.append("circle")
//	.attr("transform", function(d) { return "translate(" + projection([-118.235271, 34.045132]) + ")"; })
//	.attr("cx", function (d) { console.log(projection(d)); return projection(d)[0]; })
//	.attr("r", "8px")
//	.attr("fill", "red");		

window.onload = init();