function makeBarchart() {
  var color = d3.scaleOrdinal()
    .range(["#bdd7e7","#6baed6","#2171b5"]);
  var cDataset;
  var keys;
  var cMargin = {top: 20, right: 20, bottom: 30, left: 50},
  cWidth = 550 - cMargin.left - cMargin.right,
  cHeight = 400 - cMargin.top - cMargin.bottom;

  // create svg
  var svg = d3.select('#area').append('svg')
  .attr('width', cWidth + cMargin.left + cMargin.right)
  .attr('height', cHeight + cMargin.top + cMargin.bottom+45)
  .attr('class', 'text-center')
  g = svg.append('g')
  .attr('transform', 'translate(' + cMargin.left + ',' + cMargin.top + ')');

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
  d3.csv('./data/arrest.csv', function(d, i, columns) {
    for (var i = 2, n = columns.length; i< n; i++) d[columns[i]] = +d[columns[i]];
    return d;
  }, function(error, data) {
    if (error) throw error;
    cDataset = data;
    //initial viz
    drawChart(cDataset, false);
  });

  d3.selectAll('select')
  .on('change', function() {
    var selected = this.value;
    var file;
    if (selected == 'criminal') {
      file = './data/criminal.csv';
      d3.select('.text-muted').style("visibility", "visible");
    } else if (selected == 'VAWA') {
      file = './data/VAWA.csv';
      d3.select('.text-muted').style("visibility", "visible");
    } else if (selected == 'hatecrimes') {
      file = './data/hatecrimes.csv';
      d3.select('.text-muted').style("visibility", "hidden");
    } else {
      file = './data/arrest.csv'; //on start
      d3.select('.text-muted').style("visibility", "hidden");
    }
    d3.csv(file, function(d, i, columns) {
      for (var i = 2, n = columns.length; i< n; i++) d[columns[i]] = +d[columns[i]];
      return d;
    }, function(error, data) {
      if (error) throw error;
      drawChart(data, true);
    })
  });

  function drawChart(data, update) {
    // get year headers
    keys = data.columns.slice(2);
    drawLegend();

    var t = d3.transition()
    .duration(750)
    //.delay(100)
    .ease(d3.easeLinear)

    // set x and y scale domains
    x0.domain(data.map(function(d){return d.subtype; }))
    x1.domain(keys).rangeRound([0, x0.bandwidth()]);
    y.domain([0, d3.max(data, function(d) {
      return d3.max(keys, function(key) { return d[key]; }); })]).nice();

      // create a group of bars for each subtype
      var chart = g.selectAll(".group")
      .data(data)
      chart.exit().transition().duration(100).remove();
      // enter
      var newChart = chart.enter().append("g")
      .attr("class", "group")

      chart = chart.merge(newChart)
      .attr("transform", function(d) { return "translate(" + x0(d.subtype) + ",0)"; })

      // create a rect for each data value
      var rect = chart.selectAll("rect")
      .data(function(d) {
        return keys.map(function(key)
        {return {key: key, value: d[key], subtype: d.subtype}; });
      })

      rect.exit().remove();
      // update rects
      var newRect = rect.enter().append("rect")
      .attr("fill", function(d) { return color(d.key); })
      .attr("class", function(d) { return "y" + d.key});

      rect = rect.merge(newRect)
        .attr("x", function(d) { return x1(d.key); })
        .attr("width", x1.bandwidth())
        .attr("y", function(d) {return cHeight})
        .attr("height",0)
      rect.transition(t)
        .attr("height", function(d) { return cHeight - y(d.value); })
        .attr("y", function(d) { return y(d.value); })

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
        rect.transition(t)
        .attr("height", function(d) { return cHeight - y(d.value); })
        .attr("x", function(d) { return x1(d.key); })
        .attr("y", function(d) { return y(d.value); })
        .attr("width", x1.bandwidth())

        g.select(".xaxis")
        //.transition(t)
        //.duration(1000)
        .call(xAxis);

        g.select('.xaxis')
        .selectAll(".tick text")
        .attr("transform", "rotate(-25)")
        .style("text-anchor", "end");

        g.select(".yaxis")
        .transition(t)
        //.duration(1000)
        .call(yAxis);

      } else {
        g.append('g')
        .attr('class', 'xaxis')
        .attr('transform', 'translate(0,' + cHeight + ')')
        .call(xAxis);

        g.select('.xaxis')
        .selectAll(".tick text")
        .attr("transform", "rotate(-25)")
        .style("text-anchor", "end");

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
          .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
          .on("click", function (d) {
            drawViz(d, false)
          })

      legend.append("rect")
        .attr("x", cWidth)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

      legend.append("text")
        .attr("x", cWidth - 10)
        .attr("y", 9)
        .attr("dy", ".32em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });
    }

  }
  makeBarchart();
