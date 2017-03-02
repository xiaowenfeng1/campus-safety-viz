function makeSunburst() {
var dataset;
// Dimensions of sunburst.
var width = 750;
var height = 500;
var radius = Math.min(width, height) / 2;

var x = d3.scaleLinear()
    .range([0, 2 * Math.PI]);
var y = d3.scaleSqrt()
    .range([0, radius]);
var color = d3.scaleOrdinal(d3.schemeSet2);
var partition = d3.partition()

var svg = d3.select("#sunburst").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

var arc = d3.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
    .outerRadius(function(d) { return Math.max(0, y(d.y1)); });

// create hierarchial data format
var nest = d3.nest()
    .key(function(d) { return d.type; })
    .key(function(d) { return d.subtype; })
    //.key(function(d){ return d.location;})

d3.csv("total.csv", function(error,data) {
  if (error) throw error;
  dataset = data;
  drawViz(dataset);
 });

 function drawViz(data) {
   //bouding circle underneath sunburst
   svg.append("svg:circle")
      .attr("r", radius)
      .style("opacity", 0);

   var root = d3.hierarchy({values: nest.entries(data)}, function(d) { return d.values; })
       .sort(function(a, b) { return b.value - a.value; });
       root.sum(function(d) { return d.y2012; });
   var nodes = partition(root).descendants();

   svg.selectAll("path")
     .data(nodes)
     .enter().append("path")
     .attr("pointer-events", "all")
     .attr("display", function(d) { return d.depth ? null : "none"; })
     .attr("d", arc)
     .attr("fill-rule", "evenodd")
     .style("fill", function(d) { return color((d.children ? d : d.parent).data.key); })
     .style("opacity", 1)
     .on("mouseover", mouseover);


  //mouseleave interaction
  svg.on("mouseleave", mouseleave);
 }

 // Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {
  console.log(d);
  var count = (d.data.type ? d.data.type + " " : "")+
  (d.parent.data.key ? d.parent.data.key + " ": "")
  + (d.data.key ? d.data.key +" " : "")
  +(d.data.location ? d.data.location + " ": "")
  +d.value;
  // var countString = count;
  // if (count < 10) {
  //   countString = "< 10";
  // }
  //console.log(count);
  d3.select("#explanation")
      .style("visibility", "visible");
  d3.select("#countString")
      .html(count);

  var sequenceArray = d.ancestors().reverse();
  sequenceArray.shift(); // remove root node from the array
  // updateBreadcrumbs(sequenceArray, percentageString);

  // Fade all the segments.
  d3.selectAll("path")
      .style("opacity", 0.3);

  // Then highlight only those that are an ancestor of the current segment.
  svg.selectAll("path")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
}

function mouseleave(d) {

  // Deactivate all segments during transition.
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll("path")
      .transition()
      .duration(1000)
      .style("opacity", 1)
      .on("end", function() {
              d3.select(this).on("mouseover", mouseover);});

  d3.select("#explanation")
      .style("visibility", "hidden");
}


}
makeSunburst();
