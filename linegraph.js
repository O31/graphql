import { formatBytes, formatDate, createElement } from "./script.js"

export function createGraph(data) {
    const margin = { top: 70, right: 30, bottom: 40, left: 80 }
    const width = 800 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom


    const x = d3.scaleTime().range([0, width])
    const y = d3.scaleLinear().range([height, 0])

    let transactions = []
    for (let i = 0; i < data.data.transactions.length; i++) {
        if (i == data.data.transactions.length) break
        let newObj = {
            ...data.data.transactions[i]
        }
        transactions.push(newObj)
        if (i > 0) {
            transactions[i].amount = transactions[i].amount + transactions[i - 1].amount
        }
    }

    document.querySelector(".graphs").append(createElement("div", "", ["linegraph"]))

    const svg = d3.select(".linegraph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)

    //create tooltip div
    const tooltip = d3.select(".linegraph")
        .append("div")
        .attr("class", "tooltip")

    x.domain(d3.extent(transactions, d => new Date(d.createdAt)))
    y.domain([0, d3.max(transactions, d => d.amount)])


    //append x axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .style("font-size", "14px")
        .call(d3.axisBottom(x)
            .tickValues(x.ticks(d3.timeMonth.every(2)))
            .tickFormat(d3.timeFormat("%b %Y")))
        .call(g => g.select(".domain").remove())
        .selectAll(".tick line")
        .style("stroke-opacity", 0)
    svg.selectAll(".tick text")
        .attr("fill", "#777 ")


    //append y axis
    svg.append("g")
        .style("font-size", "14px")
        .call(d3.axisLeft(y)
            .tickFormat(d => {
                return `${formatBytes(d)}`
            })
            .tickSize(0)
            .tickPadding(10))
        .call(g => g.select(".domain").remove())
        .selectAll(".tick text")
        .style("fill", "#777")
        .style("visibility", (d, i, nodes) => {
            if (i === 0) {
                return "hidden"
            }
            return "visible"
        })

    // add vertical gridlines
    svg.selectAll("xGrid")
        .data(x.ticks().slice(1))
        .join("line")
        .attr("x1", d => x(d))
        .attr("x2", d => x(d))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "gray")
        .attr("stroke-width", .5)

    //add the chart title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", margin.left - 115)
        .attr("y", margin.top - 100)
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("XP PROGRESSION")

    //add the y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .text("XP AMOUNT")



    const line = d3.line()
        .x(d => x(new Date(d.createdAt)))
        .y(d => y(d.amount))

    svg.append("path")
        .datum(transactions)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1)
        .attr("d", line)

    //add a circle element
    const circle = svg.append("circle")
        .attr("r", 0)
        .attr("fill", "steelblue")
        .style("stroke", "white")
        .attr("opacity", .70)
        .style("pointer-events", "none")

    //create a listening rect
    const listeningRect = svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "linerect")

    //create a mouse move action
    listeningRect.on("mousemove", function (event) {
        const [xCoord] = d3.pointer(event, this)
        const bisectDate = d3.bisector(d => new Date(d.createdAt)).left
        const x0 = x.invert(xCoord)
        const i = bisectDate(transactions, x0, 1)
        const d0 = transactions[i - 1]
        const d1 = transactions[i]
        const d = x0 - new Date(d0.createdAt) > new Date(d1.createdAt) - x0 ? d1 : d0
        const xPos = x(new Date(d.createdAt))
        const yPos = y(d.amount)

        //update the circle position
        circle.attr("cx", xPos)
            .attr("cy", yPos)
        //add transistion for the circle radius
        circle.transition()
            .duration(50)
            .attr("r", 5)

        let amount = formatBytes(d.amount)

        tooltip
            .style("display", "block")
            .style("left", `${xPos + 500}px`)
            .style("top", `${yPos + 50}px`)
            .html(`Date: ${formatDate(new Date(d.createdAt))}<br>
            Task: ${d.object.name !== undefined ? d.object.name : 'N/A'}<br>
            Total: ${d.amount !== undefined ? amount : 'N/A'}`)
    })

    listeningRect.on("mouseleave", function () {
        circle.transition()
            .duration(50)
            .attr("r", 0)
        tooltip.style("display", "none")
    })

}
