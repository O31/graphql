import { formatBytes } from "./script.js";

export function generatePie(dataset) {
    const data = {
        "Done": dataset.user[0].totalUp,
        "Received": dataset.user[0].totalDown,
    }
    // set the dimensions and margins of the graph
    const width = 300,
        height = 300,
        margin = 20;

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    const radius = Math.min(width, height) / 2 - margin

    // append the svg object
    const svg = d3.select(".profile")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // set the color scale
    const color = d3.scaleOrdinal()
        .range(["steelblue", "#b03426"]);

    // Compute the position of each group on the pie:
    const pie = d3.pie()
        .value(function (d) { return d[1] })
    const data_ready = pie(Object.entries(data))
    // Now I know that group A goes from 0 degrees to x degrees and so on.

    // shape helper to build arcs:
    const arcGenerator = d3.arc()
        .innerRadius(0)
        .outerRadius(radius * 0.75)

    const hoverArcGenerator = d3.arc().innerRadius(0).outerRadius(radius * 0.85)

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
        .selectAll('mySlices')
        .data(data_ready)
        .join('path')
        .attr('d', arcGenerator)
        .attr('fill', function (d) { return (color(d.data[0])) })
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .on("mouseover", function (d, i) {
            let text = document.querySelector(`${"." + i.data[0]}`)
            text.innerHTML = formatBytes(i.data[1])
            d3.select(this)
                .style("fill-opacity", 1)
                .transition().duration(500)
                .attr("d", hoverArcGenerator)
        })
        .on("mouseout", function (d, i) {
            let text = document.querySelector(`${"." + i.data[0]}`)
            text.innerHTML = i.data[0]
            d3.select(this)
                .style("fill-opacity", 0.8)
                .transition().duration(500)
                .attr("d", arcGenerator)
        })

    // Now add the annotation. Use the centroid method to get the best coordinates
    svg
        .selectAll('mySlices')
        .data(data_ready)
        .join('text')
        .text(function (d) { return d.data[0] })
        .attr("class", function (d) { return `${d.data[0]}` })
        .attr("transform", function (d) { return `translate(${arcGenerator.centroid(d)})` })
        .style("text-anchor", "middle")
        .style("font-size", 17)
        .on("mouseover", function (d, i) {
            let text = document.querySelector(`${"." + i.data[0]}`)
            text.innerHTML = formatBytes(i.data[1])
        })
        .on("mouseout", function (d, i) {
            let text = document.querySelector(`${"." + i.data[0]}`)
            text.innerHTML = i.data[0]
        })


    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", -50)
        .attr("y", -110)
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Audit ratio")
}