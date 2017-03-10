var dataset;
// Dimensions of sunburst.
var width = 550;
var height = 400;
var radius = Math.min(width, height) / 2;
var colors =  d3.scaleOrdinal(d3.schemeSet2);
// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: 120, h: 30, s: 3, t: 10
};
var node; //save root for tweening
var x = d3.scaleLinear()
.range([0, 2 * Math.PI]);
var y = d3.scaleSqrt()
.range([0, radius]);
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
//.key(function(d) {return d.crime;})
.key(function(d) { return d.type; })
.key(function(d) { return d.subtype; })

d3.csv("./data/total.csv", function(error,data) {
  if (error) throw error;
  dataset = data;
  drawViz(2012, true);
});

function drawViz(year, first) {

  initializeBreadcrumbTrail();
  //get all years
  keys = dataset.columns.slice(3);

  //put data into hierarchy and sum up dat based on year
  var root = d3.hierarchy({values: nest.entries(dataset)}, function(d) { return d.values; })
  node = root; //save the original root for tween

  //determine size of slices
  if (year == "2012") {
    root.sum(function(d) { return d.y2012; });
  } else if (year == "2013") {
    root.sum(function(d) { return d.y2013; });
  } else {
    root.sum(function(d) { return d.y2014; });
  }

  var nodes = partition(root).descendants();

  if (first) {
    var path= svg.selectAll("path")
    .data(nodes)
    .enter().append("path")
    .attr("pointer-events", "all")
    // don't show root
    .attr("display", function(d) { return d.depth ? null : "none"; })
    .attr("fill-rule", "evenodd")
    .style("fill", function(d) {
      return colors(getColor(d))})
      .style("opacity", 1)

    } else {
      svg.selectAll("path").data(nodes)
    }
    svg.selectAll("path")
    .on("mouseover", mouseover)
    .transition().duration(1000)
    .attrTween("d", arcTweenData);

    svg.on("mouseleave", mouseleave);

    // Fade all but the current sequence, and show it in the breadcrumb trail.
    function mouseover(d) {
      if (d) {
        var count = d.value;

        var sequenceArray = d.ancestors().reverse();
        sequenceArray.shift(); // remove root node from the array
        updateBreadcrumbs(sequenceArray, count);
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
    }

    function mouseleave(d) {
      d3.select("#trail")
      .style("visibility", "hidden");
      // Deactivate all segments during transition.
      d3.selectAll("path").on("mouseover", null);

      // Transition each segment to full opacity and then reactivate it.
      d3.selectAll("path")
      .transition()
      .duration(500)
      .style("opacity", 1)
      .on("end", function() {
        d3.select(this).on("mouseover", mouseover);});
      }

      // When switching data: interpolate the arcs in data space.
      function arcTweenData(a, i) {
        // (a.x0s ? a.x0s : 0) -- grab the prev saved x0 or set to 0 (for 1st time through)
        // avoids the stash() and allows the sunburst to grow into being
        var oi = d3.interpolate({ x0: (a.x0s ? a.x0s : 0), x1: (a.x1s ? a.x1s : 0) }, a);
        function tween(t) {
          var b = oi(t);
          a.x0s = b.x0;
          a.x1s = b.x1;
          return arc(b);
        }
        if (i == 0) {
          // If on the first arc, adjust the x domain to match the root node
          // at the current zoom level.
          var xd = d3.interpolate(x.domain(), [node.x0, node.x1]);
          return function (t) {
            x.domain(xd(t));
            return tween(t);
          };
        } else {
          return tween;
        }
      }
      // color for slices
      function getColor(d) {
        var key;
        if (d.parent) {
          if (d.children) {
            if (d.height == 2) {
              console.log(d)
              key = d.data.key
            } else {
              key = d.parent.data.key;
            }
          } else {
            key = d.parent.parent.data.key;
          }
        }
        return key;
      }

      function initializeBreadcrumbTrail() {
        // Add the svg area.
        var trail = d3.select("#sequence").append("svg:svg")
        .attr("width", width)
        .attr("height", 50)
        .attr("id", "trail");
        // Add the label at the end, for the percentage.
        trail.append("svg:text")
        .attr("id", "endlabel")
        .style("fill", "#000");
      }

      // Generate a string that describes the points of a breadcrumb polygon.
      function breadcrumbPoints(d, i) {
        var points = [];
        points.push("0,0");
        points.push(b.w + ",0");
        points.push(b.w + b.t + "," + (b.h / 2));
        points.push(b.w + "," + b.h);
        points.push("0," + b.h);
        if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
        points.push(b.t + "," + (b.h / 2));
      }
      return points.join(" ");
    }

    // Update the breadcrumb trail to show the current sequence and percentage.
    function updateBreadcrumbs(nodeArray, count) {

      // Data join; key function combines name and depth (= position in sequence).
      var trail = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { return getText(d) + d.depth; });

      // Remove exiting nodes.
      trail.exit().remove();

      // Add breadcrumb and label for entering nodes.
      var entering = trail.enter().append("svg:g");

      entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) { return colors(getColor(d)); });

      entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .style("font-size", "0.8em")
      .text(function(d) { return getText(d); })

      // Merge enter and update selections; set position for all nodes.
      entering.merge(trail).attr("transform", function(d, i) {
        return "translate(" + i * (b.w + b.s) + ", 0)";
      });

      // Now move and update the percentage at the end.
      d3.select("#trail").select("#endlabel")
      .attr("x", (nodeArray.length + 0.15) * (b.w + b.s))
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .style("font-weight", "500")
      .text(count +" occurrences");

      // Make the breadcrumb trail visible, if it's hidden.
      d3.select("#trail")
      .style("visibility", "");

      function getText(d) {
        if(d.height == 0) {
          return d.data.location;
        } else {
          return d.data.key;
        }
      }
    }
  }
  // Respond to radio click.
  d3.selectAll('.year').on("click", function change() {
    var year = this.value;
    drawViz(year,false);
  });
