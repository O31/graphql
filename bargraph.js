import { formatBytes, createElement } from "./script.js"


export function generateBarGraph(data) {
    const margin = { top: 70, right: 30, bottom: 60, left: 175 }
    const width = 800 - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

    document.querySelector(".graphs").append(createElement("div", "", ["bargraph"]))

    //create the svg container
    const svg = d3.select(".bargraph")
        .append("svg")
        .style("overflow", "visible")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left + "," + margin.top})`)
        .data(data)

    data.sort(function (a, b) {
        return d3.ascending(a.amount, b.amount)
    })


    const x = d3.scaleLinear()
        .range([0, width])
        .domain([0, d3.max(data, function (d) {
            return d.amount
        })])

    const y = d3.scaleBand()
        .range([height, 0])
        .padding(0.1)
        .domain(data.map(function (d) {
            return d.object.name
        }))

    const xAxis = d3.axisBottom(x)
        .ticks(5)
        .tickSize(0)

    const yAxis = d3.axisLeft(y)
        .tickSize(0)
        .tickPadding(10)

    svg.selectAll("line.vertical-grid")
        .data(x.ticks(5))
        .enter()
        .append("line")
        .attr("class", "vertical-grid")
        .attr("x1", function (d) { return x(d) })
        .attr("y1", 0)
        .attr("x2", function (d) { return x(d) })
        .attr("y2", height)
        .style("stroke", "gray")
        .style("stroke-width", 0.5)
        .style("stroke-dasharray", "3 3")

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("y", function (d) { return y(d.object.name) })
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", function (d) { return x(d.amount) })
        .style("fill", "steelblue")

    svg.append("g") // Add the X Axis
        .attr("class", "x axis")
        .style("font-size", "10px")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .call(g => g.select(".domain").remove())
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function (d) {
            return "rotate(-30)";
        });

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .selectAll("path")
        .style("stroke-width", "1.75px")

    svg.selectAll(".y.axis .tick text")
        .text(function (d) {
            return d.toUpperCase()
        })

    svg.selectAll(".label")
        .data(data)
        .enter().append("text")
        .attr("x", function (d) { return x(d.amount) + 5 })
        .attr("y", function (d) {
            return y(d.object.name) + y.bandwidth() / 2
        })
        .attr("dy", ".35em")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .style("fill", "#3c3d28")
        .text(function (d) { return formatBytes(d.amount) })

    svg.append("text")
        .attr("x", margin.left - 335)
        .attr("y", margin.top - 110)
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("XP EARNED BY TASK")
}