// Global variables
var width = 0,
	height = 0,
	mapWidth = 0,
	mapHeight = 0,
	legendWidth = 0,
	legendHeight = 0,
	infoWidth = 0,
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
		"title" : "% of non-Hispanic whites",
		"label1" : "Neighborhood: ",
		"label2" : "Change from 2000-2015: ",
		"label3" : "2000: ",
		"label4" : "2015: ",
		"caption1" : "% change in non-Hispanic whites",
		"caption2" : "from 2000-2015",
		"unit" : "%",
	},
	"INCOME_CHG" : {
		"min" : -24837,
		"max" : 46792,
		"title" : "Median yearly income",
		"label1" : "Neighborhood: ",
		"label2" : "Change from 2000-2015: ",
		"label3" : "2000: ",
		"label4" : "2015: ",
		"caption1" : "$ change in median yearly income",
		"caption2" : "from 2000-2015",
		"unit" : " dollars",
	},
	"RENT_CHG" : {
		"min" : -694,
		"max" : 1449,
		"title" : "Median monthly rent",
		"label1" : "Neighborhood: ",
		"label2" : "Change from 2000-2015: ",
		"label3" : "2000: ",
		"label4" : "2015: ",
		"caption1" : "$ change in median monthly rent",
		"caption2" : "from 2000-2015",
		"unit" : " dollars",
	},
	"NEW_DEV" : {
		"title" : "New Developments in the Arts District from 2005-2018",
		"label1" : "Name: ",
		"label2" : "Address: ",
		"label3" : "Type: ",
		"label4" : "Year Established: ",
	}
};

function init() {
	setMap();
	selectionChange();
}

function setMap() {
	// Width and Height of the whole visualization
	//width = window.innerWidth;
    //height = 500;
    height = window.innerHeight;

    mapWidth = document.getElementById("demMap").clientWidth;
    mapHeight = document.getElementById("demMap").clientHeight;
    legendWidth = document.getElementById("demLegend").clientWidth;
    legendHeight = document.getElementById("demLegend").clientHeight;
    infoWidth = document.getElementById("demInfo").clientWidth;


	// Create SVG
	svgMap = d3.select( "#demMap" )
		.append( "svg" )
		.attr( "width", mapWidth)
		.attr( "height", height)
		.append("g");

	svgLegend = d3.select( "#demLegend" )
		.append( "svg" )
		.attr( "width", legendWidth)
		.attr( "height", height)
		.append("g");

	svgInfo = d3.select( "#demInfo" )
		.append( "svg" )
		.attr( "width", infoWidth)
		.attr( "height", 0)
		.append("text");

	selected = "NHW_CHG_00_15";

	// Generate initial map
	loadData();
}

function selectionChange() {
	// select variable for which to display a legend
	d3.selectAll("input")
		.on("change", function() {
			selected = this.id;

			d3.select("#info1")
				.text("");
			d3.select("#info2")
				.text("");
			d3.select("#info3")
				.text("");
			d3.select("#info4")
				.text("");
			d3.select("#streetView")
				.attr("src", "");
			loadData();
		}
	);
}

function loadData() {
  d3.queue()
    .defer(d3.json, "data/census_tracts_with_data_updated2.json")
    .defer(d3.json, "data/roads_updated_topo.json")
    .defer(d3.csv, "data/building_gentrification_data_updated2.csv")
    .await(processData);
}

function processData(error, censusTractsFile, streetsFile, buildingFile) {
	if (error) throw error;
	if (selected == "NEW_DEV") {
		updateBuildingMap(censusTractsFile, streetsFile, buildingFile);
	}
	else {
		updateDemMap(censusTractsFile, streetsFile);
	}
}

function updateDemLegend() {
	d3.select("#demLegend").selectAll("rect").remove();
	d3.select("#demLegend").selectAll("text").remove();
	d3.select("#demLegend").selectAll(".tick").remove();


	// Label info legend
	d3.select("#title")
		.text(data_set[selected].title);
	d3.select("#label1")
		.text(data_set[selected].label1);
	d3.select("#label2")
		.text(data_set[selected].label2);
	d3.select("#label3")
		.text(data_set[selected].label3);
	d3.select("#label4")
		.text(data_set[selected].label4);

	// Setting legend color gradient
	var lowColor = '#fef7e6';
	var highColor = '#f05e28';

	var minVal = data_set[selected].min;
	var maxVal = data_set[selected].max;

	colorRamp = d3.scaleLinear().domain([minVal,maxVal]).range([lowColor,highColor]);

	// add a legend
	var w = 20, h = height/2;
	var caption1 = h + 26, caption2 = h + 48;

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

	/*d3.select("#caption")
		.text(data_set[selected].caption1);*/

	key.append("text")
		.attr("class", "caption")
		.attr("transform", function () {return "translate(" + 0 + "," + caption1 + ")";})
		.text(data_set[selected].caption1);

	key.append("text")
			.attr("class", "caption")
			.attr("transform", function () {return "translate(" + 0 + "," + caption2 + ")";})
			.text(data_set[selected].caption2);

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

function updateDemMap(censusTractsFile, streetsFile) {
	//d3.select("g").selectAll("path").remove();
	//d3.select("g").selectAll("text").remove();
	svgMap.selectAll("g").remove();
	updateDemLegend();

	// Create GeoPath function that uses built-in D3 functionality 
	// to turn lat/lon coordinates into screen coordinates
	//projection = d3.geoAlbers().fitSize([width, height-200], censusTractsFile); // fix map height after final edits to html
	projection = d3.geoAlbers().fitSize([mapWidth, height], censusTractsFile);
	path = d3.geoPath().projection(projection);

	// Select non-existent elements, bind the data, append the elements, 
	// and apply attributes
	var census_tracts = svgMap.append("g");

	census_tracts.selectAll(".tract")
		.data(censusTractsFile.features)
		.enter().append("path")
		.attr("d", path)
		.attr("class", "tract")
		.attr("fill", function(d) { return colorRamp(d.properties[selected][0]); })
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
				.style("fill", function(d) { return colorRamp(d.properties[selected][0]);});
			d3.select(this).style("fill", function() {
				return d3.rgb(d3.select(this).style("fill")).darker(0.4);
			});

			d3.select("#info1")
				.text(d.properties.NAME);
			d3.select("#info2")
				.text(d.properties[selected][0] + data_set[selected].unit)
				.style("color", function() {
					if (Number(d.properties[selected][0]) < 0)
						{ return "red"; }
					else { return "green"; }
				});
			d3.select("#info3")
				.text(d.properties[selected][1] + data_set[selected].unit);
			d3.select("#info4")
				.text(d.properties[selected][2] + data_set[selected].unit);
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
}

function updateBuildingMap(censusTractsFile, streetsFile, buildingFile) {
	svgMap.selectAll("g").remove();
	//svgMap.select("g").remove();

	// Create GeoPath function that uses built-in D3 functionality 
	// to turn lat/lon coordinates into screen coordinates
	//projection = d3.geoAlbers().fitSize([width, height-200], censusTractsFile); // fix map height after final edits to html
	projection = d3.geoAlbers().fitSize([mapWidth, height], censusTractsFile);
	path = d3.geoPath().projection(projection);

	// Select non-existent elements, bind the data, append the elements, 
	// and apply attributes
	var census_tracts = svgMap.append("g");

	census_tracts.selectAll(".tract")
		.data(censusTractsFile.features)
		.enter().append("path")
		.attr("d", path)
		.attr("class", "tract")
		.attr("fill", "#fef7e6")
		.attr("fill", function(d,i){if (i == 2) {return "#f05e28";} else {return "#fef7e6";}})
		.attr("stroke-width", "1") // change width and color to make more distinct
		.attr("stroke", "white")
		.attr("transform","translate(-100, -120) scale(1.5,1.5)");

	// add roads
	var roads = svgMap.append("g");

	roads.append("path")
		.datum(topojson.mesh(streetsFile, streetsFile.objects.roads_updated))
		.attr("class", "road")
		.attr("d", path)
		.attr("fill", "transparent")
		.attr("stroke", "black")
		.attr("stroke-width", 0.14)
		.attr('pointer-events', 'none')
		.attr("transform","translate(-100, -120) scale(1.5,1.5)");

	var points = svgMap.append("g");
	points.selectAll("circle")
		.data(buildingFile)
		.enter()
		.append("circle")
		.attr("cx", function(d) {return projection([Number(d.lat), Number(d.long)])[0];})
		.attr("cy", function(d) {return projection([Number(d.lat), Number(d.long)])[1];})
		.attr("opacity", 10)
		.attr("stroke", "#999")
		.attr("stroke-width", 1)
		.attr("r", 4)
		.attr("fill", "yellow")
		.attr("transform","translate(-100, -120) scale(1.5,1.5)");

	var selectedPoints = svgMap.append("g");
	selectedPoints.selectAll("circle")
		.data(buildingFile)
		.enter()
		.append("circle")
		.attr("cx", function(d) {return projection([Number(d.lat), Number(d.long)])[0];})
		.attr("cy", function(d) {return projection([Number(d.lat), Number(d.long)])[1];})
		.attr("opacity", 0.0)
		.attr("r", 5)
		.attr("fill", "#999")
		.attr("transform","translate(-100, -120) scale(1.5,1.5)")

		.on("mouseover", function () {
			if (d3.select(this).attr('opacity') == 0) {
				d3.select(this).attr('opacity', 0.8);
			}
		})
		.on("mouseout", function () {
			if (d3.select(this).attr('opacity') == 0.8) {
				d3.select(this).attr('opacity', 0);
			}
		})
		.on("click", function(d) {
			selectedPoints.selectAll("circle").attr('opacity', 0);
			d3.select(this).attr('opacity', 0.85);
			d3.select("#info1")
				.text(d.name);
			d3.select("#info2")
				.text(d.address)
				.style("color", "#666666");
			d3.select("#info3")
				.text(d.type);
			d3.select("#info4")
				.text(d.year);
			d3.select("#streetView")
				.attr("src", d.street_view);
		});

	updateBuildingInfo(censusTractsFile, buildingFile);
}

function updateBuildingInfo(censusTractsFile, buildingFile) {
	// Label info legend
	d3.select("#title")
		.text(data_set[selected].title);
	d3.select("#label1")
		.text(data_set[selected].label1);
	d3.select("#label2")
		.text(data_set[selected].label2);
	d3.select("#label3")
		.text(data_set[selected].label3);
	d3.select("#label4")
		.text(data_set[selected].label4);
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