class Dot {

    constructor(cl,x,y,radius,stroke,fill,info) {
        this.attrs = {"class":cl,"cx":x+radius/2,"cy":y+radius/2,"r":radius,"stroke":stroke,"fill":fill,"opacity":0}
        this.datapoint = document.createElementNS("http://www.w3.org/2000/svg","circle")
        this.dpBoundingBox = document.createElementNS("http://www.w3.org/2000/svg","circle")
        this.arguments = arguments
        this.info = info
        this.create()
    }

    create() {
        for (let attr in this.attrs) {
            if (attr=="stroke"|attr=="fill") {
                this.datapoint.setAttribute(attr,this.attrs[attr])
                this.dpBoundingBox.setAttribute(attr,"#00000000")
            }
            else if (attr=="r") {
                this.datapoint.setAttribute(attr,this.attrs[attr])
                this.dpBoundingBox.setAttribute(attr,2)
            } else {
                this.datapoint.setAttribute(attr,this.attrs[attr])
                this.dpBoundingBox.setAttribute(attr,this.attrs[attr])
            }
        }
        this.dpBoundingBox.addEventListener("mouseover",()=>this.popup("bounding"))
        this.dpBoundingBox.addEventListener("mouseout",()=>{ this.removePopup("bounding") })
        this.datapoint.addEventListener("mouseover",()=>this.popup("point"))
        this.datapoint.addEventListener("mouseout",()=>this.removePopup("point"))

    }

    pan(x) {
        let currentX = parseFloat(this.datapoint.getAttribute("cx"))
        this.datapoint.setAttribute("cx",`${currentX+x}`)
        this.dpBoundingBox.setAttribute("cx",`${currentX+x}`)
    }

    updateY(y) {
        this.YAnimMax = y; this.YAnimCurrentOfsset = 0;
        this.YAnimAdd = this.YAnimMax>0?1:-1
        this.updatingY = true
        window.requestAnimationFrame((t)=>{this.updateYanim(t)})
    }
    
    updateYanim(t) {
        let AnimCheck = this.YAnimMax>0?Math.floor(this.YAnimMax):Math.ceil(this.YAnimMax)
        if (this.YAnimCurrentOfsset!=AnimCheck) {
            let currentY = parseFloat(this.datapoint.getAttribute("cy"))
            this.datapoint.setAttribute("cy",`${currentY+this.YAnimAdd}`)
            this.dpBoundingBox.setAttribute("cy",`${currentY+this.YAnimAdd}`)
            this.YAnimCurrentOfsset += this.YAnimAdd
            window.requestAnimationFrame(t=>this.updateYanim(t))
        } else if (this.YAnimCurrentOfsset!=this.YAnimMax) {
            this.datapoint.setAttribute("cy",`${this.currentY+(this.YAnimMax-this.YAnimCurrentOfsset)}`)
            this.dpBoundingBox.setAttribute("cy",`${this.currentY+(this.YAnimMax-this.YAnimCurrentOfsset)}`)
            this.YAnimCurrentOfsset = this.YAnimMax
            this.updatingY = false
        } else { this.updatingY = false}
    }

    
    popup(type) {
        let pos = this.datapoint.getBoundingClientRect()
        let div = document.createElement("div")
        let divCss = `background-color:grey; top:${pos.y-10}px; left:${pos.x+10}px; position:fixed;`
        div.setAttribute("style",divCss); div.setAttribute("id",`${type}hoverdiv`); div.setAttribute("class","datapopup")
        let infotext = document.createElement("p")
        infotext.innerHTML = `x=${this.currentX} y=${this.currentY}`
        div.append(infotext)
        document.body.append(div)
    }
    
    removePopup(type) {
        document.getElementById(`${type}hoverdiv`).remove()
    }
    
    startUp() {
        window.requestAnimationFrame(()=>this.startUpAnim())
    }
    
    startUpAnim() {
        let opacity = parseFloat(this.datapoint.getAttribute("opacity"))
        console.log(opacity)
        if (opacity<1) {
            this.datapoint.setAttribute("opacity",`${opacity+0.05}`)
            window.requestAnimationFrame(()=>this.startUpAnim())
        }
    }

    get svg() {
        return [this.dpBoundingBox,this.datapoint]
    }

    get currentX() {
        return parseFloat(this.datapoint.getAttribute("cx"))
    }

    get currentY() {
        return parseFloat(this.datapoint.getAttribute("cy"))
    }
    
    get animated() {
        if (this.updatingY==false||this.updatingY==undefined) { return false } else { return true }
    }
}

class Path {
    
    constructor(points,stroke,width,dash,fill,bezier,anim){
        this.points = points; this.fill = fill!=undefined?fill:"none"; this.bezier = bezier!=undefined?bezier:false
        this.anim = anim!=undefined?anim:false
        this.calc_d()
        this.attrs = {
            d:this.d, 
            stroke:stroke!=undefined?stroke:"none", 
            "stroke-width":width!=undefined?width:"none", 
            "stroke-dasharray":dash!=undefined?dash:"none", 
            fill:this.fill
        }
        this.path = document.createElementNS("http://www.w3.org/2000/svg","path")
        this.draw()
        if (this.anim == true) {
            this.datarange = this.points[this.points.length-1][0] - this.points[0][0]
            this.path.setAttribute("stroke-dasharray",[this.datarange*5,this.datarange*10])
            this.path.setAttribute("stroke-dashoffset",this.datarange*6)
        }
    }

    calc_d() {
        // create the d attribute (string containing all points)
        this.d = `M ${this.points[0][0]} ${this.points[0][1]} `
        if (this.bezier==true) {
            for (let point of this.points) {
                this.d += `C `
            }
        } else {
            for (let point of this.points) {
                this.d += `L ${point[0]} ${point[1]} `
            }
            if (this.fill!="none") { this.d += "Z" } 
        }
    }    

    draw() {
        // set HTML attributes
        for (let arg in this.attrs) {
            this.path.setAttribute(arg,this.attrs[arg])
        }
    }

    pan(x) {
        // update on x movement
        let newdata = []
        for (let point of this.points) {
            newdata.push([point[0]+x,point[1]])
        }
        this.points = newdata
        this.calc_d()
        this.path.setAttribute("d",this.d)
    }

    updateY(y) {
        this.YAnimMax = y
        this.YAnimCheck = []; this.currentOffset = []; this.YAnimAdd = []; this.endAnim = []
        this.YAnimMax.forEach((val)=>{ 
            if (val>0) { this.YAnimCheck.push(Math.floor(val)); this.YAnimAdd.push(1) }
            else { this.YAnimCheck.push(Math.ceil(val)); this.YAnimAdd.push(-1) }
            this.currentOffset.push(0); this.endAnim.push(false)
        })
        window.requestAnimationFrame(()=>this.updateYanim())
    }

    updateYanim() {
        for (let i=0; i<this.points.length; i++) {
            if (this.currentOffset[i]!=this.YAnimCheck[i]) {
                this.points[i][1]+=this.YAnimAdd[i]
                this.currentOffset[i]+=this.YAnimAdd[i]
            } else {
                if (!this.endAnim[i]) { this.points[i][1] += this.YAnimMax[i]-this.currentOffset[i] }
                this.endAnim[i]=true
            }
        }
        this.calc_d()
        this.path.setAttribute("d",this.d)
        if (!this.endAnim.every(el=>{ return el==true })) { window.requestAnimationFrame(()=>this.updateYanim()) }
        
    }

    startUp() {
        this.startUpT0 = undefined
        window.requestAnimationFrame((t)=>this.startUpAnim(t))
    }

    startUpAnim(timestamp) {
        if (this.startUpT0==undefined) { this.startUpT0=timestamp }
        let elapsedTime = timestamp - this.startUpT0
        let dasharray = parseFloat(this.path.getAttribute("stroke-dashoffset"))
        if (dasharray>this.datarange) {
            this.path.setAttribute("stroke-dashoffset",dasharray-Math.random()*10)
            window.requestAnimationFrame((t)=>this.startUpAnim(t))
        }
    }
    
    get svg() {
        return this.path
    }

    get lastPoint() {
        return this.points[this.points.length-1]
    }

    get isStartupAnimated() {
        return this.anim
    }
}

function setAttributes(element,attrs) {
    for (let key in attrs) {
        element.setAttribute(key,attrs[key])
    }
}

class Plot{

    constructor(width,height,data,title) {
        this.width = width
        this.height = height
        this.data = data
        this.title = title
        this.plotrange = 400

        ////////////////////////////////////////
        //create svg element
        //
        this.g = document.createElementNS("http://www.w3.org/2000/svg","svg")
        this.viewBoxWidth = parseInt(this.width.replace(/\D/g,"")) / parseInt(this.height.replace(/\D/g,"")) * 100
        setAttributes(this.g,{"width":this.width,"height":this.height,"viewBox":`0 0 ${this.viewBoxWidth} 100`,"class":"g"})
        this.graph()
    }
    
    graph(){
        let overhangX = 0.05; let overhangY = 0.1; this.colors = ["#ace8bd","#acc2e8","#d190aa","#e3e6c1"]
        
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Data prep
        //
        this.graphdata = []
        let yvals = []; let yvalsPerc = []
        let xvals = []
        this.data.forEach(el=>{
            xvals.push(el.x)
            el.y.forEach(e=>{
                yvals.push(e)
            })
        })
        let datarangeY = Math.max(...yvals) - Math.min(...yvals)
        this.datarangeX = Math.max(...xvals) - Math.min(...xvals)
        let dataminX = Math.min(...xvals)
        // calc percentage
        this.data.forEach(el=>{
            let newobj = {y:[]}
            let graphElX = (el.x-dataminX) / this.datarangeX
            graphElX -= (graphElX - 0.5)*overhangX
            newobj.x = graphElX*this.viewBoxWidth
            el.y.forEach(e=>{
                let graphElY = (datarangeY - e) / datarangeY
                graphElY -= (graphElY - 0.5)*overhangY
                newobj.y.push(graphElY*100)
                yvalsPerc.push(graphElY*100)
            })
            this.graphdata.push(newobj)
        })
        // stretch plot so only plotrange (eg 10days) are visible with day 0 at 100% and day -10 at 0%
        let plotrangeprec = this.dataToPerc(this.plotrange,"x")
        let final = this.graphdata[this.graphdata.length-1].x
        this.graphdata.forEach((el,i,arr)=>{ 
            arr[i].x -= ((final-el.x)/plotrangeprec)*(final-plotrangeprec)
        })
        
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Draw graph
        //
        this.points = []; this.newPoints = []; this.onscreenPoints = []; this.lines = []; this.newLines = []
        let curvepoints = []
        let linepoints = {}
        for (let i=0; i<this.graphdata.length; i++) {
            let point = this.graphdata[i]
            let info = this.data[i]
            for (let j=0; j<point.y.length; j++) {
                this.points.push(new Dot("plotcirc",point.x,point.y[j],0.15,this.colors[j],"none",[info.x,info.y[j]]))
                if (j in linepoints) {
                    linepoints[j].push([point.x, point.y[j]])
                } else {
                    linepoints[j] = [[point.x, point.y[j]]]
                }
            }
            curvepoints.push( [point.x, point.y.reduce((a,b)=>a+b,0) / point.y.length]) // mean value
        }
        let axis = new Path([[0,99],[0.99*this.viewBoxWidth,99]],"black",0.3)
        let axisend = new Path([[0.99*this.viewBoxWidth,99.1],[0.99*this.viewBoxWidth,98.9],[0.992*this.viewBoxWidth,99]],"black",1,"none","black")
        this.curve = new Path(curvepoints,"black",0.4,"none","none",false,true)
        for (let line in linepoints) {
            this.lines.push(new Path(linepoints[line],this.colors[line],0.2,[0.3,0.3],"none",false,true))
        }
        this.g.append(axis.svg)
        this.g.append(axisend.svg)
        this.lines.forEach(el=>{ this.g.append(el.svg) })
        this.points.forEach(el=>{ el.svg.forEach(e=>this.g.append(e)) })
        this.g.append(this.curve.svg)

        //calculations for later use
        let pointYvals = []
        for (let point of this.points) {
            pointYvals.push(point.currentY)
        }
        this.Ymax = Math.max(...pointYvals); this.Ymin = Math.min(...pointYvals)
        this.calcOnscreenPoints()
        this.updateY()
    }

    dataToPerc(data,axis) {
        if (axis=="x") {
            let final = this.graphdata[this.graphdata.length-1].x
            return (data/(this.datarangeX*(100-(final-this.graphdata[0].x)/100)))*(100*(final-this.graphdata[0].x))
        }
    }

    pan(xmovement) {
        this.points.forEach(point=>{
            point.pan(xmovement)
        })
        this.lines.forEach(line=>{
            line.pan(xmovement)
        })
        this.newLines.forEach(line=>{
            line.pan(xmovement)
        })
        this.curve.pan(xmovement)
        this.calcOnscreenPoints()
        this.updateY()
        
    }

    updateRange(newrange) {
        this.plotrange = newrange
        this.g.innerHTML = ""
        this.graph()
    }

    addCurve(newdata) {
        let percentage = -30
        this.start = undefined
        if (this.dataPointAdded == undefined) {
            window.requestAnimationFrame((t)=>this.addDataAnim(t))
        }
        //this.pan(percentage)
    }

    addDataPoint(point,lineindex) {
        let final = this.lines[lineindex].lastPoint
        let distance = point[0] - this.data[this.data.length-1].x
        let distancePercX = this.dataToPerc(distance,"x")
        let percY = point[1]
        console.log(percY)
        let newLineData = [
            [final[0], final[1]],
            [final[0]+distancePercX, percY]
        ]
        let newLine = new Path(newLineData,this.colors[lineindex],0.2,"none","none",false,true)
        this.g.append(newLine.svg)
        this.newLines.push(newLine)
        newLine.startUp()
        if (this.dataPointAdded == undefined) {
            this.dataPointAdded = true
            window.requestAnimationFrame((t)=>this.addDataAnim(t,distancePercX))
        }
    }

    addDataAnim(timestamp,distance) {
        if (this.start == undefined) {
            this.start = timestamp
        }
        let elapsedTime = timestamp - this.start
        if (elapsedTime<200) {
            this.pan(-3)
            window.requestAnimationFrame((t)=>this.addDataAnim(t))
        }
    }

    startUp() {
        this.startUpT0 = undefined
        for (let point of this.points) {
            point.startUp()
        }
        for (let line of this.lines) {
            if (line.isStartupAnimated == true) {
                line.startUp()
            }
        }
        this.curve.startUp()
    }

    calcOnscreenPoints() {
        this.onscreenPoints = []
        for (let point of this.points) {
            if (point.currentX>0 && point.currentX<this.viewBoxWidth) {
                this.onscreenPoints.push(point)
            }
        }
    }

    updateY() {
        let currentY = []
        let updating = []
        //checks if points are currently updating and calculates current yMin and yMax
        for (let point of this.onscreenPoints) {
            currentY.push(point.currentY)
            updating.push(point.animated)
        }

        if (updating.every(el=>{return el==false})) {
            let currentYmin = Math.min(...currentY); let currentYmax = Math.max(...currentY)
            console.log(currentYmin,currentYmax,this.Ymax)

            let newRange; let update = false; let updateFuncParam
            // the lowest point is higher than yMin -> should be updated to be at yMin
            if (currentYmax != this.Ymax) { newRange = currentYmax - currentYmin; update = true; updateFuncParam = "max" }
            else if (currentYmin != this.Ymin) {newRange = currentYmax - currentYmin; update = false; updateFuncParam = "min"}
            if (update) {
                // update points
                for (let point of this.points) {
                    let yoffset = this.updateYFunc(point.currentY,currentYmin,newRange,updateFuncParam)
                    point.updateY(yoffset)
                }
                // update lines
                for (let line of this.lines) {
                    let newLineData = []
                    for (let point of line.points) {
                        newLineData.push(this.updateYFunc(point[1],currentYmin,newRange,updateFuncParam))
                    }
                    line.updateY(newLineData)
                }
                this.calcOnscreenPoints()
                update = false
            }
             

        }
    }

    updateYFunc(yval,currentOffset,newRange,param) {
        if (param == "max") { return ((yval-currentOffset)/newRange)*(this.Ymax-currentOffset-newRange) }
        else if (param == "min") { return undefined }
    }

    get svg(){
        return this.g
    }
    
}

export { Plot as default }