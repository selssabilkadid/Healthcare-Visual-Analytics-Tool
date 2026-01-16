var svgContainer = d3.select("#chart").append("svg")
                                    .attr("width", 800)
                                    .attr("height", 400)
                                    .style("background-color","#d3a981");
var jsonCircles = [
    { "x_axis": 250, "y_axis": 60, "radius": 20, "color" : "green" },

    { "x_axis": 70, "y_axis": 70, "radius": 20, "color" : "purple"},
     { "x_axis": 110, "y_axis": 100, "radius": 20, "color" : "red"}];


     d3.json("././data/datset.json", function(data) {

console.log(data);
/////////////////////

     })
     
    var circles = svgContainer.selectAll("circle")
    .data(jsonCircles) //pour accéder au données
    .enter() // pour traiter chaque données
    .append("circle");


    var circleAttributes = circles // pour créer chaque cercles 
    .attr("cx", function (d) { return d.x_axis; })
    .attr("cy", function (d) { return d.y_axis; })
    .attr("r", function (d) { return d.radius; })
    .style("fill", function(d) { return d.color; });



 svgContainer.append('line')
    .attr('x1',250)
    .attr('y1',60)
    .attr('x2',350)
    .attr('y2',60)
    .attr('stroke', 'black')
    .attr('stroke-width', 10);
 
 
    svgContainer.append('line')
    .attr('x1',250)
    .attr('y1',60)
    .attr('x2',300)
    .attr('y2',120)
    .attr('stroke', 'black')
    .attr('stroke-width', 10);
 

    svgContainer.append('line')
    .attr('x1',300)
    .attr('y1',120)
    .attr('x2',350)
    .attr('y2',60)
    .attr('stroke', 'black')
    .attr('stroke-width', 10);
 
   
   
    var circles = svgContainer.append("circle")
    .attr("cx", 250)
    .attr("cy", 60)
    .attr("r", 20)
    .style("fill","white");
svgContainer.append("circle")
    .attr("cx", 350)
    .attr("cy", 60)
    .attr("r", 20)
    .style("fill","white");
svgContainer.append("circle")
    .attr("cx", 300)
    .attr("cy", 120)
    .attr("r", 20)
    .style("fill","white");



var rect= svgContainer.append('rect')
              .attr('x',200)
              .attr('y',200)
              .attr('width',100)
              .attr('height',100)
              .attr('fill','#7b1544');