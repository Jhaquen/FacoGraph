import Plot from "./plot.js"
    
$(()=>{
    const graphdiv = document.getElementsByClassName("graph")[0]
    const select = document.getElementById("rangeselect")
    const inputs = document.getElementsByClassName("yinput")
    const button = document.getElementById("enterbutton")
    let data = [
        {x:10,y:[20,15,10]},
        {x:100,y:[230,200,190,120]},
        {x:200,y:[300,210]},
        {x:400,y:[250,400,300,200]},
        {x:550,y:[100,243,142]},
        {x:700,y:[232,523,122]}
    ]
    let g = new Plot("800px","500px",data,"graph title")
    graphdiv.append(g.svg)
    g.startUp()
    graphdiv.addEventListener("mousemove",(event)=>{
        if (event.buttons==1) {
            g.pan(event.movementX)
        }
    })
    select.onchange = ()=> {
        g.updateRange(select.value)
        g.startUp()
    }
    button.onclick = ()=> {
        let newdata = undefined
        g.addCurve(newdata)
    }
    for (let input of inputs) {
        let index = parseInt(input.getAttribute("index"))
        input.addEventListener("keyup",event=>{
            if (event.key == "Enter" || event.keyCode == 13) {
                if (input.value.replace(/\D/g,"")!=""){
                    g.addDataPoint([900,parseInt(input.value)],index)
                }
            }
        })
    } 
})