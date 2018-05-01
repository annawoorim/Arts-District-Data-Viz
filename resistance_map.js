// Global variables
var width,
	height,
	mapWidth,
	legendWidth,
	infoWidth,
	svgMap,
	svgLegend,
	svgInfo,
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
		"title" : "% of people of color",
		"label1" : "% change in people of color",
		"label2" : "from 2000-2015",
		"unit" : "%",
	},
	"INCOME_CHG" : {
		"min" : -24837,
		"max" : 46792,
		"title" : "Median yearly income",
		"label1" : "$ change in median yearly income",
		"label2" : "from 2000-2015",
		"unit" : " dollars",
	},
	"RENT_CHG" : {
		"min" : -694,
		"max" : 1449,
		"title" : "Median monthly rent",
		"label1" : "$ change in median monthly rent",
		"label2" : "from 2000-2015",
		"unit" : " dollars",
	}
};

function init() {
	setMap();
	selectionChange();
}

function setMap() {
	// Width and Height of the whole visualization
	//width = window.innerWidth;
    height = 500;

    mapWidth = document.getElementById("demMap").clientWidth;
    legendWidth = document.getElementById("demLegend").clientWidth;
    infoWidth = document.getElementById("demInfo").clientWidth;

	// Create SVG
	svgMap = d3.select( "#demMap" )
		.append( "svg" )
		.attr( "width", mapWidth)
		.attr( "height", height)
		.append("g");

	svgLegend = d3.select( "#demLegend" )
		.append( "svg" )
		.attr( "width", legendWidth )
		.attr( "height", height)
		.append("g");

	svgInfo = d3.select( "#demInfo" )
		.append( "svg" )
		.attr( "width", infoWidth )
		.attr( "height", height)
		.append("text");

	selected = "NHW_CHG_00_15";

	// Generate initial map
	updateInfo();
	loadData();
}

function selectionChange() {
	// select variable for which to display a legend
	d3.selectAll("input")
		.on("change", function() {
			selected = this.id;
			// Remove previous data labels
			//d3.select("#neighborhood").selectAll("text").remove();
			//d3.select("#value0015").selectAll("text").remove();

			updateInfo();
			loadData();
		}
	);
}

function loadData() {
  d3.queue()
    .defer(d3.json, "../data/census_tracts_with_data_updated.json")
    .defer(d3.json, "../data/roads_updated_topo.json")
    //.defer(d3.json, "../data/building_gentrification_data.csv")
    .await(processData);
}

function processData(error, censusTractsFile, streetsFile) {
	if (error) throw error;
	updateMap(censusTractsFile, streetsFile);
}

function updateLegend() {
	d3.select("#demLegend").selectAll("rect").remove();
	d3.select("#demLegend").selectAll("text").remove();
	d3.select("#demLegend").selectAll(".tick").remove();

	// Setting legend color gradient
	var lowColor = '#013243'; // change to e4f1fe
	var highColor = '#e4f1fe'; // change to 013243

	var minVal = data_set[selected].min;
	var maxVal = data_set[selected].max;

	colorRamp = d3.scaleLinear().domain([minVal,maxVal]).range([lowColor,highColor]);

	// add a legend
	var w = 20, h = 300;

	var y = d3.scaleLinear()
		.range([h, 0])
		.domain([minVal, maxVal]);

	var yAxis = d3.axisRight(y);

	var key = svgLegend.append("g")
		.attr("class", "legend")
		.attr("transform", "translate(40,40)");

	key.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(21,0)")
		.call(yAxis.tickSizeOuter(0))
		.select(".domain")
		.remove();

	key.append("text")
		.attr("class", "caption")
		.attr("transform", "translate(0, 320)")
		.text(data_set[selected].label1);

	key.append("text")
			.attr("class", "caption")
			.attr("transform", "translate(0, 336)")
			.text(data_set[selected].label2);

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
}

function updateMap(censusTractsFile, streetsFile) {
	//d3.select("g").selectAll("path").remove();
	d3.select("g").selectAll("text").remove();
	updateLegend();

	// Create GeoPath function that uses built-in D3 functionality 
	// to turn lat/lon coordinates into screen coordinates
	//projection = d3.geoAlbers().fitSize([width, height-200], censusTractsFile); // fix map height after final edits to html
	projection = d3.geoAlbers().fitSize([mapWidth, 500], censusTractsFile);
	path = d3.geoPath().projection(projection);

	// Select non-existent elements, bind the data, append the elements, 
	// and apply attributes
	var census_tracts = svgMap.append("g");

	census_tracts.selectAll(".tract")
		.data(censusTractsFile.features)
		.enter().append("path")
		.attr("d", path)
		.attr("class", "tract")
		.attr("fill", function(d) { return colorRamp(d.properties[selected]); })
		.attr("stroke-width", "1")
		.attr("stroke", "white")

		.on("mouseover", function() {
			if (d3.select(this).attr("stroke-width") == 1) {
				d3.select(this).attr("stroke-width", 3);
			}
		})
		.on("mouseout", function() {
			if (d3.select(this).attr("stroke-width") == 3) {
				d3.select(this).attr("stroke-width", 1);
			}
		})
        .on("click", function(d) {
			d3.selectAll(".tract")
				.style("fill", function(d) { return colorRamp(d.properties[selected]);});
			d3.select(this).style("fill", function() {
				return d3.rgb(d3.select(this).style("fill")).darker(0.4);
			});
			d3.select("#neighborhood")
				.text(d.properties.NAME);
			d3.select("#value0015")
				.text(d.properties[selected] + data_set[selected].unit);
		});
		

    // add roads
	var roads = svgMap.append("g");

	roads.append("path")
		.datum(topojson.mesh(streetsFile, streetsFile.objects.roads_updated))
		.attr("class", "road")
		.attr("d", path)
		.attr("fill", "transparent")
		.attr("stroke", "black")
		.attr("stroke-width", 0.14)
		.attr('pointer-events', 'none');

	//Tryna plot a point here...
	var pointProjection = d3.geoAlbers();
	var pointData = [-118.235144, 34.044104];
	//console.log(projection(pointData));
	var points = svgMap.append("g");

	points.append("circle")
		.attr("cx", function (d) { return projection(pointData)[0]; })
		.attr("cy", function (d) { return projection(pointData)[1]; })
		.attr("opacity", 10)
		.attr("stroke", "#999")
		.attr("stroke-width", 0.06)
		.attr("r", 2)
		.attr("fill", "red");
}

function updateInfo() {
	d3.select("#title")
		.text(data_set[selected].title);
}

/*
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word == words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}
*/

window.onload = init();