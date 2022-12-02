"use strict"


class sduiTab {
    constructor(name, label, icon) {
        this.name = name
        this.label = label
        this.icon = icon
        this.render()
	this.onactive = function() {} 
    }

    setContent(content) {
        this.content.innerHTML = content
    }

    render() {
        document.querySelector('#tab-container').insertAdjacentHTML('beforeend', `
            <span id="tab-${this.name}" class="tab">
                <span><i class="fa ${this.icon} icon"></i> ${this.label}</span>
            </span>
        `)

        document.querySelector('#tab-content-wrapper').insertAdjacentHTML('beforeend', `
            <div id="tab-content-${this.name}" class="tab-content">
            </div>
        `)
        this.content = document.querySelector(`#tab-content-${this.name}`)
        linkTabContents(document.querySelector(`#tab-${this.name}`))
	document.querySelector(`#tab-${this.name}`).addEventListener('click', e => { this.onactive() } )
    }
    
    
}

let models=null;

(async function() {

    let tab = new sduiTab('modelmgr', "Model Manager", "fa-folder-tree")
    let token = {prefix:{},suffix:{}} 
    let modelTokensSection = document.querySelector('#model-tokens-section')
    let modelTokensContent = document.querySelector('#model-tokens-content')
    let t = localStorage.getItem('modelToken')

    if (t!=null) {
        token = JSON.parse(t)
    }

    async function updateModels() {
        let res = await fetch('/get/models')
        let models = await res.json()
        console.log(models)

        let content = `<div id="modelmgr" class="tab-content-inner" style="text-align:left;">`

	// Stable Diffusion
	content += `<div id="modelmgr-sd">`

        content += '<h4><i class="fa-regular fa-folder-open icon"></i> Stable Diffusion Models</h4>'
        content += '<button id="modelmgr-sd-add" class="primaryButton">Download model</button>'
        models["options"]["stable-diffusion"].forEach( (m) => { 
            content += `
	       <div class="panel-box">
	         <div><i class="fa fa-file-code icon"></i> ${m}</div>
	         <div style="padding-left:2em;">
		   <label><i class="fa fa-bars-staggered"></i> Trained tokens</label><br/>
		   <textarea data-model="${m}" style="width:100%;">${token[m]}</textarea>
	         </div>
	       </div>
	    `
        })

        content += `</div>`

        // TODO Other models
        content += `</div>`
	content += `<div id="modelmgr-civitai" class="popup"><div>Hello</div></div>`
        tab.setContent(content)

        document.querySelectorAll('#modelmgr-sd textarea').forEach( element => { 
	    element.onkeyup = event => {
	        element.style.height = "1px";
	        element.style.height = (15 + element.scrollHeight) + "px";
            }
	})
	tab.onactive= function() { 
	    document.querySelectorAll('#modelmgr-sd textarea').forEach( element => { element.onkeyup() } )
	}
    }

    function addModelToken(prompts) { 
        let model = stableDiffusionModelField.value
	let prefix = ""
	let suffix = ""
	if (token["prefix"][model] != "") {
	    prefix = token["prefix"][model] + ", "
	}
	if (token["suffix"][model] != "") {
	    suffix = ", " + token["suffix"][model]
	}

        return prompts.map( x => prefix + x + suffix )
    }

    async function updateModelTokenSection() {
        let model = stableDiffusionModelField.value
	if (token[model] == "") {
	    modelTokensSection.style.display="none";
	} else {
	    modelTokensContent.innerHTML=token[model].split('\n').map( a => "<button>"+a+"</button> ").join('')
	    modelTokensContent.querySelectorAll('button').forEach( b => { console.log(b); b.addEventListener('click', e => { typeInTextarea(b.textContent, promptField)}) }) 
	    modelTokensSection.style.display="block";
	}
    }

    await updateModels()
    await updateModelTokenSection()

    document.querySelector('#modelmgr-sd').onchange = function() {
        document.querySelectorAll('#modelmgr-sd textarea').forEach( i => {
            token[i.dataset.model] = i.value
        })
        localStorage.setItem('modelToken', JSON.stringify(token))
    }

    document.querySelector('#modelmgr-sd-add').onclick = async function() {
        let url = prompt('URL of the model:')
        let res = await fetch('/model/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({url:url, path:'stable-diffusion'})
        })
        let downloadRequest = await res.json()
	console.log(downloadRequest)
	let button = document.querySelector('#modelmgr-sd-add')
	button.insertAdjacentHTML("afterend", `<div class="panel-box"><div><i class="fa fa-file-code icon"></i> Download</div><div id="modelmgr-download-progress"></div></div>`)
	let progress = document.querySelector('#modelmgr-download-progress')
	let i=0
	let data = null
	do {
	    await asyncDelay(1333)
	    try {
	        res = await fetch('/model/download/'+downloadRequest.taskId)
	        data = await res.json()
	        console.log(data)
                progress.innerHTML = '<big>Downloaded ' + ( ( data.downloaded * 100 / data.total ) >>0 ) + "%</big>"
	    } catch (e) {
	        console.log(e)
	    }
	} while (data==null || data['state'] != 'completed')
	await updateModels()
    }

    stableDiffusionModelField.addEventListener('change', updateModelTokenSection)

})()


