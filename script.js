import { createGraph } from "./linegraph.js"
import { generatePie } from "./piegraph.js"
import { generateBarGraph } from "./bargraph.js"

generateLoginPage()

function generateLoginPage() {
    let token = getCookie("graphQLtoken")
    if (token == "" || token == null) {
        let loginDiv = createElement("div", "", ["login"])
        let imgSvg = createSvg()

        imgSvg.setAttribute("style", "display:block;")
        loginDiv.append(imgSvg)
        let formElem = createElement("form", "", [])
        formElem.append(createElement("p", "", ["mainError", "error"]))
        let emailInput = createElement("input", "", ["field"])
        emailInput.setAttribute("placeholder", "Username")
        emailInput.setAttribute("name", "uname")
        let passwordInput = createElement("input", "", ["field"])
        passwordInput.setAttribute("type", "password")
        passwordInput.setAttribute("placeholder", "Password")
        passwordInput.setAttribute("name", "pword")
        let loginBtn = createElement("button", "LOGIN", ["loginBtn"])
        loginDiv.addEventListener("keypress", (e) => {
            if (e.key == "Enter") submitLogin(emailInput.value, passwordInput.value)
        })

        let uLabel = createElement("label", "USERNAME", ["loginP"])
        uLabel.setAttribute("for", "uName")
        formElem.append(createElement("p", "", ["unError", "error"]))
        formElem.append(uLabel)
        formElem.append(emailInput)
        let pwLabel = createElement("label", "PASSWORD", ["loginP"])
        pwLabel.setAttribute("for", "pword")
        formElem.append(createElement("p", "", ["pwError", "error"]))
        formElem.append(pwLabel)
        formElem.append(passwordInput)
        formElem.append(loginBtn)
        loginDiv.append(formElem)
        document.querySelector(".main").append(loginDiv)
        formElem.onsubmit = (e) => {
            e.preventDefault;
            submitLogin(emailInput.value, passwordInput.value)
            return false
        }
    } else {
        getXPdata(token)
    }
}

function submitLogin(username, password) {
    let failed
    let userNameEr = document.querySelector(".unError")
    let passwordEr = document.querySelector(".pwError")

    if (username == "") {
        userNameEr.innerHTML = "Please provide an username"
        failed = true
    }
    if (password == "") {
        passwordEr.innerHTML = "Please provide a password"
        failed = true
    }
    if (!failed) {
        login(username, password)
    }
}

function getCookie(name) {
    if (document.cookie.length != 0) {
        var array = document.cookie.split("=");
        return array[1]
    }
    else {
        return null
    }
}

function getXPdata(authToken) {
    const query = `
    query{
        user{
            createdAt
            login
            campus
            firstName
            lastName
            totalUp
            totalDown
            auditRatio
            email
        }
        transaction( 
            where: {
                type:{ _eq: "xp"}}, 
            order_by:{ createdAt: asc },
            )
            {
            type
            amount
            path
            object{
                name
            }
            createdAt
        }
    }`
    fetch("https://01.kood.tech/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
            query
        })
    }).then(response => {
        return response.json()
    }).then(data => {
        if (data.errors != undefined) {
            document.cookie = `${"graphQLtoken=;"}`;
            generateLoginPage()
        } else {
            document.querySelector(".main").append(createElement("div", "", ["content"]))
            document.querySelector(".content").append(createElement("div", "", ["graphs"]))
            cleanData(data)
            generateProfile(data.data)
            createGraph(data)
            generateBarGraph(data.data.transactions)
        }

    })
}

function cleanData(data) {
    const transaction = data.data.transaction

    let transactions = []
    let sum = 0
    for (let i = 1; i < transaction.length; i++) {
        if (i == transactions.length) break
        if (transaction[i].path.includes("div-01") && !transaction[i].path.includes("piscine")) {
            sum += transaction[i].amount
            transactions.push(transaction[i])
        }
    }
    data.data.transactions = transactions
    data.data.sum = sum
}

function generateProfile(data) {
    let user = data.user[0]

    const cont = createElement("div", "", ["profile"])
    const nameDiv = createElement("p", `${user.firstName + " " + user.lastName}`, ["title"])
    // nameDiv.classList.add("title")
    cont.append(nameDiv)

    cont.append(createElement("p", "Campus:", ["subtitle"]))
    cont.append(createElement("p", user.campus.toUpperCase()))

    cont.append(createElement("p", "Email:", ["subtitle"]))
    cont.append(createElement("p", user.email))

    cont.append(createElement("p", "Total xp:", ["subtitle"]))
    cont.append(createElement("p", formatBytes(data.sum)))

    cont.append(createElement("p", "Account created at:", ["subtitle"]))
    cont.append(createElement("p", formatDate(new Date(user.createdAt))))

    cont.append(createElement("p", "First sprint:", ["subtitle"]))
    cont.append(createElement("p", formatDate(new Date(data.transaction[0].createdAt))))

    document.querySelector(".main").append(cont)
    generatePie(data)

    let logOutBtn = createElement("button", "LOG OUT", ["logOutBtn"])
    cont.append(logOutBtn)
    logOutBtn.addEventListener("click", () => {
        document.querySelector(".main").innerHTML = ""
        document.cookie = `${"graphQLtoken=;"}`;
        generateLoginPage()
    })

}

export function createElement(elem, innerHTML, classes = []) {
    const newElem = document.createElement(elem)
    newElem.innerHTML = innerHTML
    for (let i = 0; i < classes.length; i++) {
        newElem.classList.add(classes[i])
    }
    return newElem
}

export function formatDate(date) {
    let day = date.getDate().toString().padStart(2, "0")
    let month = date.getMonth() + 1
    let year = date.getFullYear()
    return `${day + "." + month.toString().padStart(2, "0") + "." + year}`
}

async function login(username, password) {
    let encoded = window.btoa(`${username + ":" + password}`)
    let auth = "Basic " + encoded
    const response = await fetch("https://01.kood.tech/api/auth/signin", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": auth,
        }
    }).then(response => {
        return response.json()
    }).then(data => {
        if (data.error != undefined) {
            document.querySelector(".mainError").innerHTML = "Wrong username or password"
        } else {
            document.cookie = `${"graphQLtoken=" + data}`;
            document.querySelector(".main").innerHTML = ""
            getXPdata(data)
        }
    })
}

export function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1000
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]} `
}

function createSvg() {
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("class", "svgImg")
    svg.setAttribute("width", "182")
    svg.setAttribute("height", "48")
    svg.setAttribute("viewBox", "0 0 182 48")
    svg.setAttribute("fill", "none")
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")


    let gKoodj = document.createElementNS("http://www.w3.org/2000/svg", "g")
    gKoodj.setAttribute("id", "koodJ")

    let gKood = document.createElementNS("http://www.w3.org/2000/svg", "g")
    gKood.setAttribute("id", "kood")
    let koodPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    koodPath.setAttribute("id", "kood")
    koodPath.setAttribute("d", "M12.4659 33.2756L12.4943 24.9943H13.4602L19.5966 17.1818H27.4659L18.3466 28.375H16.5142L12.4659 33.2756ZM6.2017 39V9.90909H13.1477V39H6.2017ZM19.7528 39L14.0426 29.9375L18.6165 25.0085L27.7784 39H19.7528ZM39.2379 39.4119C36.9463 39.4119 34.9766 38.9432 33.3288 38.0057C31.6906 37.0587 30.4264 35.7424 29.5362 34.0568C28.6555 32.3617 28.2152 30.3968 28.2152 28.1619C28.2152 25.9176 28.6555 23.9527 29.5362 22.267C30.4264 20.572 31.6906 19.2557 33.3288 18.3182C34.9766 17.3712 36.9463 16.8977 39.2379 16.8977C41.5296 16.8977 43.4946 17.3712 45.1328 18.3182C46.7805 19.2557 48.0447 20.572 48.9254 22.267C49.8156 23.9527 50.2607 25.9176 50.2607 28.1619C50.2607 30.3968 49.8156 32.3617 48.9254 34.0568C48.0447 35.7424 46.7805 37.0587 45.1328 38.0057C43.4946 38.9432 41.5296 39.4119 39.2379 39.4119ZM39.2805 34.1705C40.1139 34.1705 40.8194 33.9148 41.397 33.4034C41.9747 32.892 42.415 32.1818 42.718 31.2727C43.0305 30.3636 43.1868 29.3125 43.1868 28.1193C43.1868 26.9072 43.0305 25.8466 42.718 24.9375C42.415 24.0284 41.9747 23.3182 41.397 22.8068C40.8194 22.2955 40.1139 22.0398 39.2805 22.0398C38.4188 22.0398 37.6896 22.2955 37.093 22.8068C36.5059 23.3182 36.0561 24.0284 35.7436 24.9375C35.4406 25.8466 35.2891 26.9072 35.2891 28.1193C35.2891 29.3125 35.4406 30.3636 35.7436 31.2727C36.0561 32.1818 36.5059 32.892 37.093 33.4034C37.6896 33.9148 38.4188 34.1705 39.2805 34.1705ZM64.0036 39.4119C61.7119 39.4119 59.7422 38.9432 58.0945 38.0057C56.4562 37.0587 55.192 35.7424 54.3018 34.0568C53.4212 32.3617 52.9808 30.3968 52.9808 28.1619C52.9808 25.9176 53.4212 23.9527 54.3018 22.267C55.192 20.572 56.4562 19.2557 58.0945 18.3182C59.7422 17.3712 61.7119 16.8977 64.0036 16.8977C66.2952 16.8977 68.2602 17.3712 69.8984 18.3182C71.5462 19.2557 72.8104 20.572 73.6911 22.267C74.5812 23.9527 75.0263 25.9176 75.0263 28.1619C75.0263 30.3968 74.5812 32.3617 73.6911 34.0568C72.8104 35.7424 71.5462 37.0587 69.8984 38.0057C68.2602 38.9432 66.2952 39.4119 64.0036 39.4119ZM64.0462 34.1705C64.8795 34.1705 65.585 33.9148 66.1626 33.4034C66.7403 32.892 67.1806 32.1818 67.4837 31.2727C67.7962 30.3636 67.9524 29.3125 67.9524 28.1193C67.9524 26.9072 67.7962 25.8466 67.4837 24.9375C67.1806 24.0284 66.7403 23.3182 66.1626 22.8068C65.585 22.2955 64.8795 22.0398 64.0462 22.0398C63.1844 22.0398 62.4553 22.2955 61.8587 22.8068C61.2715 23.3182 60.8217 24.0284 60.5092 24.9375C60.2062 25.8466 60.0547 26.9072 60.0547 28.1193C60.0547 29.3125 60.2062 30.3636 60.5092 31.2727C60.8217 32.1818 61.2715 32.892 61.8587 33.4034C62.4553 33.9148 63.1844 34.1705 64.0462 34.1705ZM86.5533 39.3125C84.9434 39.3125 83.4804 38.8958 82.1641 38.0625C80.8478 37.2292 79.7966 35.9792 79.0107 34.3125C78.2247 32.6458 77.8317 30.5767 77.8317 28.1051C77.8317 25.5388 78.2389 23.4271 79.0533 21.7699C79.8677 20.1127 80.933 18.8864 82.2493 18.0909C83.575 17.2955 85.0002 16.8977 86.5249 16.8977C87.6707 16.8977 88.6508 17.0966 89.4652 17.4943C90.2796 17.8826 90.9519 18.3845 91.4822 19C92.0125 19.6155 92.415 20.2547 92.6896 20.9176H92.8317V9.90909H99.7777V39H92.9027V35.4631H92.6896C92.3961 36.1354 91.9794 36.7652 91.4396 37.3523C90.8999 37.9394 90.2228 38.4129 89.4084 38.7727C88.6035 39.1326 87.6518 39.3125 86.5533 39.3125ZM88.968 33.9006C89.8108 33.9006 90.5305 33.6638 91.1271 33.1903C91.7237 32.7074 92.183 32.0303 92.505 31.1591C92.8269 30.2879 92.9879 29.2652 92.9879 28.0909C92.9879 26.8977 92.8269 25.8703 92.505 25.0085C92.1925 24.1468 91.7332 23.4839 91.1271 23.0199C90.5305 22.5559 89.8108 22.3239 88.968 22.3239C88.1063 22.3239 87.3771 22.5606 86.7805 23.0341C86.1839 23.5076 85.7294 24.1752 85.4169 25.0369C85.1139 25.8987 84.9624 26.9167 84.9624 28.0909C84.9624 29.2652 85.1186 30.2879 85.4311 31.1591C85.7436 32.0303 86.1934 32.7074 86.7805 33.1903C87.3771 33.6638 88.1063 33.9006 88.968 33.9006ZM117.636 8.54545L108.261 43.375H102.338L111.713 8.54545H117.636Z")
    gKood.append(koodPath)

    let gJohvi = document.createElementNS("http://www.w3.org/2000/svg", "g")
    gJohvi.setAttribute("id", "johvi")
    let johviPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    johviPath.setAttribute("id", "johvi")
    johviPath.setAttribute("d", "M18.0199 9.90909H24.9517V30.0227C24.9422 31.9072 24.4924 33.5549 23.6023 34.9659C22.7121 36.3674 21.4811 37.4564 19.9091 38.233C18.3466 39.0095 16.5379 39.3977 14.483 39.3977C12.6648 39.3977 11.0123 39.0805 9.52557 38.446C8.0483 37.8116 6.86932 36.8267 5.98864 35.4915C5.11742 34.1562 4.68655 32.447 4.69602 30.3636H11.6989C11.7273 31.1117 11.8693 31.7509 12.125 32.2812C12.3902 32.8021 12.7547 33.1951 13.2188 33.4602C13.6828 33.7254 14.2367 33.858 14.8807 33.858C15.553 33.858 16.1212 33.7159 16.5852 33.4318C17.0492 33.1383 17.3996 32.7074 17.6364 32.1392C17.8826 31.571 18.0104 30.8655 18.0199 30.0227V9.90909ZM39.5504 39.4119C37.2588 39.4119 35.2891 38.9432 33.6413 38.0057C32.0031 37.0587 30.7389 35.7424 29.8487 34.0568C28.968 32.3617 28.5277 30.3968 28.5277 28.1619C28.5277 25.9176 28.968 23.9527 29.8487 22.267C30.7389 20.572 32.0031 19.2557 33.6413 18.3182C35.2891 17.3712 37.2588 16.8977 39.5504 16.8977C41.8421 16.8977 43.8071 17.3712 45.4453 18.3182C47.093 19.2557 48.3572 20.572 49.2379 22.267C50.1281 23.9527 50.5732 25.9176 50.5732 28.1619C50.5732 30.3968 50.1281 32.3617 49.2379 34.0568C48.3572 35.7424 47.093 37.0587 45.4453 38.0057C43.8071 38.9432 41.8421 39.4119 39.5504 39.4119ZM39.593 34.1705C40.4264 34.1705 41.1319 33.9148 41.7095 33.4034C42.2872 32.892 42.7275 32.1818 43.0305 31.2727C43.343 30.3636 43.4993 29.3125 43.4993 28.1193C43.4993 26.9072 43.343 25.8466 43.0305 24.9375C42.7275 24.0284 42.2872 23.3182 41.7095 22.8068C41.1319 22.2955 40.4264 22.0398 39.593 22.0398C38.7313 22.0398 38.0021 22.2955 37.4055 22.8068C36.8184 23.3182 36.3686 24.0284 36.0561 24.9375C35.7531 25.8466 35.6016 26.9072 35.6016 28.1193C35.6016 29.3125 35.7531 30.3636 36.0561 31.2727C36.3686 32.1818 36.8184 32.892 37.4055 33.4034C38.0021 33.9148 38.7313 34.1705 39.593 34.1705ZM35.5874 14.483L31.9652 14.4545C31.9652 12.5322 32.4245 11.0786 33.343 10.0938C34.2616 9.1089 35.379 8.61174 36.6953 8.60227C37.3961 8.60227 37.9927 8.71591 38.4851 8.94318C38.987 9.16098 39.4273 9.4214 39.8061 9.72443C40.1944 10.018 40.5542 10.2784 40.8857 10.5057C41.2266 10.7235 41.5864 10.8324 41.9652 10.8324C42.505 10.8229 42.9027 10.6241 43.1584 10.2358C43.4235 9.83807 43.5608 9.30303 43.5703 8.63068L47.1357 8.6733C47.1072 10.5767 46.6385 12.0303 45.7294 13.0341C44.8203 14.0284 43.7124 14.5303 42.4055 14.5398C41.6858 14.5492 41.075 14.4403 40.5732 14.2131C40.0713 13.9858 39.6357 13.7254 39.2663 13.4318C38.9065 13.1383 38.5608 12.8826 38.2294 12.6648C37.898 12.4375 37.5334 12.3239 37.1357 12.3239C36.6716 12.3239 36.2976 12.5133 36.0135 12.892C35.7294 13.2614 35.5874 13.7917 35.5874 14.483ZM61.0774 26.5568V39H54.1314V9.90909H60.8501V21.1875H61.0916C61.584 19.8428 62.389 18.7917 63.5064 18.0341C64.6333 17.2765 66.0111 16.8977 67.6399 16.8977C69.174 16.8977 70.5092 17.2386 71.6456 17.9205C72.782 18.5928 73.6626 19.5445 74.2876 20.7756C74.9221 22.0066 75.2346 23.446 75.2251 25.0938V39H68.2791V26.4574C68.2886 25.2453 67.9856 24.2983 67.37 23.6165C66.7545 22.9347 65.888 22.5938 64.7706 22.5938C64.0414 22.5938 63.3975 22.7547 62.8388 23.0767C62.2895 23.3892 61.8587 23.839 61.5462 24.4261C61.2431 25.0133 61.0869 25.7235 61.0774 26.5568ZM99.9446 17.1818L92.4588 39H84.5043L77.0327 17.1818H84.348L88.3679 32.2102H88.5952L92.6293 17.1818H99.9446ZM102.608 39V17.1818H109.554V39H102.608ZM106.088 14.6392C105.113 14.6392 104.275 14.3172 103.574 13.6733C102.873 13.0199 102.523 12.2339 102.523 11.3153C102.523 10.4062 102.873 9.62973 103.574 8.9858C104.275 8.33239 105.113 8.00568 106.088 8.00568C107.073 8.00568 107.911 8.33239 108.602 8.9858C109.303 9.62973 109.653 10.4062 109.653 11.3153C109.653 12.2339 109.303 13.0199 108.602 13.6733C107.911 14.3172 107.073 14.6392 106.088 14.6392Z")

    gJohvi.append(johviPath)

    gKoodj.append(gKood)
    gKoodj.append(gJohvi)
    svg.append(gKoodj)


    let defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")

    let filter = document.createElementNS("http://www.w3.org/2000/svg", "filter")
    filter.setAttribute("id", "filter0_d_8_125")
    filter.setAttribute("x", "0.681763")
    filter.setAttribute("y", "8.00568")
    filter.setAttribute("width", "112.972")
    filter.setAttribute("height", "39.4062")
    filter.setAttribute("filterUnits", "userSpaceOnUse")
    filter.setAttribute("color-interpolation-filters", "sRGB")

    let feFlood = document.createElementNS("http://www.w3.org/2000/svg", "feFlood")
    feFlood.setAttribute("flood-opacity", "0")
    feFlood.setAttribute("result", "BackgroundImageFix")
    filter.append(feFlood)

    let feMatrix = document.createElementNS("http://www.w3.org/2000/svg", "feColorMatrix")
    feMatrix.setAttribute("in", "SourceAlpha")
    feMatrix.setAttribute("type", "matrix")
    feMatrix.setAttribute("values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0")
    feMatrix.setAttribute("result", "hardAlpha")
    filter.append(feMatrix)
    let feOffSet = document.createElementNS("http://www.w3.org/2000/svg", "feOffset")
    feOffSet.setAttribute("dy", "4")
    filter.append(feOffSet)

    let feGauss = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur")
    feGauss.setAttribute("stdDeviation", "2")
    filter.append(feGauss)

    let feComp = document.createElementNS("http://www.w3.org/2000/svg", "feComposite")
    feComp.setAttribute("in2", "hardAlpha")
    feComp.setAttribute("operator", "out")
    filter.append(feComp)

    let feColor = document.createElementNS("http://www.w3.org/2000/svg", "feColorMatrix")
    feColor.setAttribute("type", "matrix")
    feColor.setAttribute("values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0")
    filter.append(feColor)

    let feBlend1 = document.createElementNS("http://www.w3.org/2000/svg", "feBlend")
    feBlend1.setAttribute("mode", "normal")
    feBlend1.setAttribute("in2", "BackgroundImageFix")
    feBlend1.setAttribute("result", "effect1_dropShadow_8_125")
    filter.append(feBlend1)

    let feBlend2 = document.createElementNS("http://www.w3.org/2000/svg", "feBlend")
    feBlend2.setAttribute("mode", "normal")
    feBlend2.setAttribute("in", "SourceGraphic")
    feBlend2.setAttribute("in2", "effect1_dropShadow_8_125")
    feBlend2.setAttribute("result", "shape")
    filter.append(feBlend2)
    defs.append(filter)
    svg.append(defs)

    let newDiv = createElement("div", "", ["svgImg"])
    newDiv.append(svg)
    return newDiv
}