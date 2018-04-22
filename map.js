// Global variables
var width,
	height,
	svg,
	color,
	projection,
	path,
	selected,
	colorRamp;

// legend and color data
var data_set = {
	"NHW_CHG_00_15" : {
		"min" : -16,
		"max" : 26,
		"label" : "% change in non-Latinx white",
	},
	"INCOME_CHG" : {
		"min" : -24837,
		"max" : 46792,
		"label" : "$ (in thousands) change in median yearly income",
	},
	"RENT_CHG" : {
		"min" : -694,
		"max" : 1449,
		"label" : "$ change in median monthly rent",
	}
};

function init() {
	setMap();
	selectionChange();
}

function setMap() {
	// Width and Height of the whole visualization
	width = window.innerWidth;
    height = window.innerHeight;

	// Create SVG
	svg = d3.select( "body" )
		.append( "svg" )
		.attr( "width", width )
		.attr( "height", height)
		.append("g");

	selected = "NHW_CHG_00_15";

	// Generate initial legend
	updateLegend();

	// Generate initial map
	loadData();
}

function selectionChange() {
	// select variable for which to display a legend
	d3.selectAll("input")
		.on("change", function() {
			selected = this.id;
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
	updateMap(censusTractsFile, streetsFile);
}

function updateLegend() {
	d3.select("body").selectAll("rect").remove();
	d3.select("body").selectAll("text").remove();
	d3.select("body").selectAll(".tick").remove();

	// Setting legend color gradient
	var lowColor = '#f9f9f9';
	var highColor = '#bc2a66';

	var minVal = data_set[selected].min;
	var maxVal = data_set[selected].max;

	colorRamp = d3.scaleLinear().domain([minVal,maxVal]).range([lowColor,highColor]);

	// add a legend
	var w = 20, h = 300;

	var key = svg.append("g")
		.attr("class", "legend")
		.attr("transform", "translate(40,40)");

	var legend = key.append("defs")
		.append("svg:linearGradient")
		.attr("id", "gradient")
		.attr("x1", "100%")
		.attr("y1", "0%")
		.attr("x2", "100%")
		.attr("y2", "100%")
		.attr("spreadMethod", "pad");

	legend.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", highColor)
		.attr("stop-opacity", 1);
		
	legend.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", lowColor)
		.attr("stop-opacity", 1);

	key.append("rect")
		.attr("width", w)
		.attr("height", h)
		.style("fill", "url(#gradient)");

	var y = d3.scaleLinear()
		.range([h, 0])
		.domain([minVal, maxVal]);

	var yAxis = d3.axisRight(y);

	key.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(21,0)")
		.call(yAxis
			.tickSizeOuter(0))
		.select(".domain")
		.remove();
}

function updateMap(censusTractsFile, streetsFile) {
	//d3.select("g").selectAll("path").remove();

	// Create GeoPath function that uses built-in D3 functionality 
	// to turn lat/lon coordinates into screen coordinates
	projection = d3.geoAlbers().fitSize([width, height-200], censusTractsFile); // fix map height after final edits to html
	path = d3.geoPath().projection(projection);

	// Select non-existent elements, bind the data, append the elements, 
	// and apply attributes
	svg.append("g")
		.attr("class", "tract")
		.selectAll("path")
		.data(censusTractsFile.features)
		.enter().append("path")
		.attr("d", path)
		//.attr("fill", function(d) { return color(d.density = d.properties[selected]/data_set[selected].ratio); })
		.attr("fill", function(d) { return colorRamp(d.properties[selected]); })
		.attr("stroke-width", "1")
		.attr("stroke", "white");
		//.append("title")
      //  .text(function(d) { return d.properties[selected] + "%"; });

    // add roads
	var roads = svg.append("g");

	roads.append("path")
		.datum(topojson.mesh(streetsFile, streetsFile.objects.roads_updated))
		.attr("class", "road")
		.attr("d", path)
		.attr("fill", "transparent")
		.attr("stroke", "black")
		.attr("stroke-width", 0.14);

	//Tryna plot a point here...
	var pointProjection = d3.geoAlbers();
	var pointData = [-118.235144, 34.044104];
	//console.log(projection(pointData));
	var points = svg.append("g");

	points.append("circle")
		.attr("cx", function (d) { return projection(pointData)[0]; })
		.attr("cy", function (d) { return projection(pointData)[1]; })
		.attr("opacity", 10)
		.attr("stroke", "#999")
		.attr("stroke-width", 0.06)
		.attr("r", 2)
		.attr("fill", "red");

    //addLabels(censusTractsFile);
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

window.onload = init();