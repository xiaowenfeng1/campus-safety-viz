function makeBarchart() {

var cDataset;
var keys;
var cMargin = {top: 20, right: 20, bottom: 30, left: 50},
    cWidth = 950 - cMargin.left - cMargin.right,
    cHeight = 600 - cMargin.top - cMargin.bottom;

// create svg
var svg = d3.select('#area').append('svg')
    .attr('width', cWidth + cMargin.left + cMargin.right)
    .attr('height', cHeight + cMargin.top + cMargin.bottom)
    .attr('class', 'text-center')
    g = svg.append('g')
    .attr('transform', 'translate(' + cMargin.left + ',' + cMargin.top + ')');

var color = d3.scaleOrdinal(d3.schemeSet2);
var divTooltip = d3.select("body")
  .append("div")
  .attr("class", "toolTip")

var x0 = d3.scaleBand()
    .rangeRound([0, cWidth])
    .paddingInner(0.1);

var x1 = d3.scaleBand()
  .padding(0.01);

var y = d3.scaleLinear()
  .rangeRound([cHeight, 0]);

var xAxis = d3.axisBottom()
  .scale(x0);

var yAxis = d3.axisLeft()
  .scale(y);

// read in data
d3.csv('arrest.csv', function(d, i, columns) {
  for (var i = 2, n = columns.length; i< n; i++) d[columns[i]] = +d[columns[i]];
  return d;
}, function(error, data) {
  if (error) throw error;
    cDataset = data;
    //initial viz
    drawViz(cDataset, false);
});

d3.selectAll('select')
  .on('change', function() {
    var selected = this.value;
    var file;
    if (selected == 'criminal') {
      file = 'criminal.csv';
    } else if (selected == 'discipline') {
      file = 'discipline.csv';
    } else if (selected == 'hatecrimes') {
      file = 'hatecrimes.csv';
    } else {
      file = 'arrest.csv'; //on start
    }
    d3.csv(file, function(d, i, columns) {
      for (var i = 2, n = columns.length; i< n; i++) d[columns[i]] = +d[columns[i]];
      return d;
    }, function(error, data) {
      if (error) throw error;
      drawViz(data, true);
    })
  });

  function drawViz(data, update) {
    // get year headers
    keys = data.columns.slice(2);
    drawLegend();

    // set x and y scale domains
    x0.domain(data.map(function(d){return d.subtype; }))
    x1.domain(keys).rangeRound([0, x0.bandwidth()]);
    y.domain([0, d3.max(data, function(d) {
      return d3.max(keys, function(key) { return d[key]; }); })]).nice();

    // create a group of bars for each subtype
    var chart = g.selectAll(".group")
      .data(data)
    chart.exit().remove();
    // enter
    var newChart = chart.enter().append("g")
      .attr("class", "group")

    chart = chart.merge(newChart)
      .attr("transform", function(d) { return "translate(" + x0(d.subtype) + ",0)"; })

    // create a rect for each data value
    var rect = chart.selectAll("rect")
      .data(function(d) { return keys.map(function(key)
        {return {key: key, value: d[key], subtype: d.subtype}; }); })
      rect.exit().remove();
    // update rects
    var newRect = rect.enter().append("rect")
      .attr("fill", function(d) { return color(d.key); });

    rect = rect.merge(newRect)
    rect.transition()
      .duration(1000)
      .attr("x", function(d) { return x1(d.key); })
      .attr("y", function(d) { return y(d.value); })
      .attr("width", x1.bandwidth())
      .attr("height", function(d) { return cHeight - y(d.value); })

    rect.on("mousemove", function(d){
      divTooltip.style("left", d3.event.pageX+10+"px");
      divTooltip.style("top", d3.event.pageY-25+"px");
      divTooltip.style("display", "inline-block");
      divTooltip.style("text-align", "left");
      var x = d3.event.pageX, y = d3.event.pageY
      var elements = document.querySelectorAll(':hover');
      l = elements.length
      l = l-1
      elementData = elements[l].__data__

      divTooltip.html(d.subtype + "<br>Year: " + d.key + "<br>Occurrence: " +elementData.value);
    });
    rect.on("mouseout", function(d){
      divTooltip.style("display", "none");
    });

    if (update) {
      rect.transition()
        .duration(1000)
        .attr("height", function(d) { return cHeight - y(d.value); })
        .attr("x", function(d) { return x1(d.key); })
        .attr("y", function(d) { return y(d.value); })
        .attr("width", x1.bandwidth())

      g.select(".xaxis")
         .transition()
         .duration(1000)
         .call(xAxis);

      g.select(".yaxis")
         .transition()
         .duration(1000)
         .call(yAxis);

    } else {
      g.append('g')
          .attr('class', 'xaxis')
          .attr('transform', 'translate(0,' + cHeight + ')')
          .call(xAxis);

      g.append('g')
          .attr('class', 'yaxis')
          .call(yAxis);
    }
  }

  function drawLegend() {
    var legend = svg.selectAll(".legend")
        .data(keys.slice())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
      .attr("x", cWidth)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

    legend.append("text")
      .attr("x", cWidth - 10)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });
  }
}

makeBarchart();
