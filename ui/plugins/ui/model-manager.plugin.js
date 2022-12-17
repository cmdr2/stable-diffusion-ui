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

(async function() {

    let tab = new sduiTab('modelmgr', "Model Manager", "fa-folder-tree")
    let token = {prefix:{},suffix:{}} 
    let modelTokensSection = document.querySelector('#model-tokens-section')
    let modelTokensContent = document.querySelector('#model-tokens-content')
    let searchResults = null
    let t = localStorage.getItem('modelToken')
    let catalogPane = null
    const sortorder = [ 'Highest Rated', 'Most Downloaded', 'Newest' ]

    if (t!=null) {
        token = JSON.parse(t)
    }

    async function updateModels() {
        let res = await fetch('/get/models')
        let models = await res.json()
        console.log(models)

        let content = `<div id="modelmgr" class="tab-content-inner">`

	// Stable Diffusion
	content += `<div id="modelmgr-sd">`

        content += '<h4><i class="fa-regular fa-folder-open icon"></i> Stable Diffusion Models</h4>'
        content += '<button id="modelmgr-sd-add" class="primaryButton">Download model</button> '
        content += '<button id="modelmgr-sd-catalog" class="primaryButton">Civitai model catalog</button>'
        models["options"]["stable-diffusion"].forEach( (m) => { 
            content += `
	       <div class="panel-box">
	         <div><i class="fa fa-file-code icon"></i> ${m}</div>
	         <div style="padding-left:2em;">
		   <label><i class="fa fa-bars-staggered"></i> Trained tokens</label><br/>
		   <textarea data-model="${m}" style="width:100%;">${token[m] || ""}</textarea>
	         </div>
	       </div>
	    `
        })

        content += `</div>`

        // TODO Other models
        content += `</div>`
	content += `<div id="modelmgr-catalog" class="popup image-editor-popup"></div>`
        tab.setContent(content)
        catalogPane = document.querySelector('#modelmgr-catalog')

        document.querySelectorAll('#modelmgr-sd textarea').forEach( element => { 
	    element.onkeyup = event => {
	        element.style.height = "1px";
	        element.style.height = (15 + element.scrollHeight) + "px";
            }
	})
	tab.onactive= function() { 
	    document.querySelectorAll('#modelmgr-sd textarea').forEach( element => { element.onkeyup() } )
	}
        document.querySelector('#modelmgr-sd-catalog').onclick = async function() {
	    catalogPane.classList.toggle('active')
	    await showCivitaiPane()
        }

        // Download via URL
        document.querySelector('#modelmgr-sd-add').onclick = async function() {
            let url = prompt('URL of the model:')
	    downloadFromURL(url)
        }
    }

    async function showCivitaiPane() {
        catalogPane.innerHTML=`
	        <div>
		    <span style="color=#C1C2C5;font-size:200%;font-weight:bold;"><a href="https://civitai.com/" target="_blank" style="text-decoration:none;color:white;">Civit<span style="color:#228be6;">ai</span></a></span>
		    <select id="modelmgr-catalog-sort" style="margin-left:2em;">
		       ${sortorder.map( (v,k) => `<option value="${k}">${v}</option>`).join('')}
		    </select>
		    <label for="modelmgr-catalog-limit">Results per page:</label> <select id="modelmgr-catalog-limit">
		       <option>20</option>
		       <option>40</option>
		       <option>100</option>
		       <option>200</option>
		    </select>
		    <label for="modelmgr-catalog-query">Search for:</label> <input id="modelmgr-catalog-query">
		    <i class="close-button fa-solid fa-xmark"></i>
		    <div id="modelmgr-results"></div>
		</div>`
        let resultsPane = document.querySelector('#modelmgr-results')

	catalogPane.querySelector('#modelmgr-catalog-sort').addEventListener('change', async function() { await updateSearch() })
	catalogPane.querySelector('#modelmgr-catalog-limit').addEventListener('change', async function() { await updateSearch() })
	catalogPane.querySelector('#modelmgr-catalog-query').addEventListener('keyup', async function(e) { if (e.key === 'Enter') { await updateSearch() }})

        if ( searchResults == null ) {
	    await updateSearch()
        } else {
	    renderCivitaiResults(searchResults)
	}
    }

    async function updateSearch() {
	let resultsPane = document.querySelector('#modelmgr-results')
	resultsPane.innerHTML = '<h1>Loading...</h1>'
        try {
	    searchResults = await searchCivitai()
	} catch (e) {
	    console.log(e)
	}
	renderCivitaiResults(searchResults)
    }
    
    async function searchCivitai() {
	let sortby = sortorder[catalogPane.querySelector('#modelmgr-catalog-sort').value]
	let limit  = catalogPane.querySelector('#modelmgr-catalog-limit').value
	let query  = catalogPane.querySelector('#modelmgr-catalog-query').value
        let url = `https://civitai.com/api/v1/models?limit=${limit}&types=Checkpoint&sort=${encodeURIComponent(sortby)}`
	if ( query != "" ) {
	    url += `&query=${encodeURIComponent(query)}`
	}
	console.log({'sortby': sortby, 'limit': limit, 'query':query, 'url':url})
        let res = await fetch(url)
        return await res.json()
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


    // Save trained tokens to localstorage upon update
    function persistTokens() {
        document.querySelectorAll('#modelmgr-sd textarea').forEach( i => {
            token[i.dataset.model] = i.value
        })
        localStorage.setItem('modelToken', JSON.stringify(token))
    }


    async function downloadFromURL(url, tokens={}) {
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
	let filename = ""
	do {
	    await asyncDelay(1333)
	    try {
	        res = await fetch('/model/download/'+downloadRequest.taskId)
	        data = await res.json()
	        console.log(data)
                progress.innerHTML = `<big>Downloaded ${ ( data.downloaded * 100 / data.total ) >>0 }%</big><br><small>${data.filename}</small>`
	    } catch (e) {
	        console.log(e)
	    }
	} while (data==null || data['state'] != 'completed')

        let modelname = filename.split('.').slice(0, -1).join('.')
        token[modelname] = tokens
	await updateModels()
        
    }


    // Show details of a modell
    function renderCivitaiModellDetails(item) {
	let resultsPane = document.querySelector('#modelmgr-results')
	let modeltokens = {}
	let content = `<hr><h2>${item.name} <span style="color:#777788;">#${item.id}</span></h2>`
	content += `<p><a href="https://civitai.com/models/${item.id}" target="_blank" class="modelmgr-modellink"><i class="fa-regular fa-file-lines"></i> Model description page on civitai.com</a></p>`
	if ( item.creator.username != 'Civitai' ) {
	    let image = ""
	    if ( item.creator.image != null ) {
	        image = `<img src="${item.creator.image}" width="24" height="24" style="border-radius:4px;"> `
            }
	    content += `<h3>${image}<i>by ${item.creator.username}</i></h3>`
	}
	item.tags.forEach( tag => {
	    content += `<span class="modelmgr-tag">${tag}</span> `
	})

	item.modelVersions.forEach( model => {
	    content += `<div class="modelmgr-version-pane"><h3>Version ${model.name}</h3>`
	    if ( model.trainedWords.length != 0 ) {
	        content += '<b>Trained Tokens:</b> '
	        model.trainedWords.forEach( word => {
	            content += `<span class="modelmgr-tag">${word}</span> `
	        })
	    }
	    model.files.forEach( file => {
	        content += `<br/><button data-url="${model.downloadUrl}" class="modelmgr-downloadmodel"><i class="fa-solid fa-download"></i> Download ${(file.sizeKB/1024/1024).toFixed(1)}GB</button> `
		modeltokens[model.downloadUrl] = model.trainedWords
	    })
	    content += `<p>`
	    model.images.forEach( imageData => {
	       let width = imageData.width * 256 / imageData.height
	       content += `<img src="${item.nsfw? 'media/images/nsfw.jpg' : imageData.url}" width="${width}" height="256" style="margin: 6px;">`
	    })
	    content += `</p></div>`

	})
	resultsPane.innerHTML = content
	document.querySelectorAll('.modelmgr-downloadmodel').forEach( b => {
	    b.addEventListener('click',  async (e) => {
	        console.log(`DOWNLOAD: URL=${b.dataset['url']}`)
		console.log(modeltokens[b.dataset['url']])
                catalogPane.classList.toggle('active')
		await downloadFromURL(b.dataset['url'], modeltokens[b.dataset['url']]);
	    })
	})
    }

    // Show an overview of search results
    function renderCivitaiResults(result) {
	let resultsPane = document.querySelector('#modelmgr-results')
	resultsPane.innerHTML=""
	result.items.forEach( item => {
	    let d = document.createElement('div')
	    d.style.display      ='inline-block'
	    d.style.width        ='256px'
	    d.style.height       ='320px'
	    d.style.margin       ='12px'
	    d.style.background   ='orange'
	    d.style.borderRadius ='8px'
	    d.style.overflow     ='hidden'
	    d.style.cursor       ='pointer'
	    d.addEventListener('click', e => { renderCivitaiModellDetails(item) })

	    let imageData = item.modelVersions[0].images[0]
	    let img = document.createElement('img')
	    let innerdiv = document.createElement('div')
	    let labeldiv = document.createElement('div')
	    
	    innerdiv.style.width        ='256px'
	    innerdiv.style.height       ='256px'
	    innerdiv.style.background   ='#eeeeee'
	    innerdiv.style.borderTopRightRadius = "8px"
	    innerdiv.style.borderTopLeftRadius  = "8px"
	    innerdiv.style.margin               = "0px"

	    labeldiv.style.width        ='256px'
	    labeldiv.style.height       ='64px'
	    labeldiv.style.background   ='#eeeeee'
	    labeldiv.style.borderBottomRightRadius = "8px"
	    labeldiv.style.borderBottomLeftRadius  = "8px"
	    labeldiv.style.margin                  = "0px"
	    labeldiv.style.color        ='black'
	    labeldiv.style.textAlign    ='left'
	    labeldiv.style.paddingLeft  ='4px'
	    labeldiv.style.paddingtop   ='6px'
	    if ( item.creator.username != 'Civitai' ) {
	        labeldiv.innerHTML = `<b>${item.name}</b><br><i>by ${item.creator.username}</i>`
	    } else {
	        labeldiv.innerHTML = `<b>${item.name}</b>`
	    }

            if ( item.nsfw ) {
	         img.src = 'media/images/nsfw.jpg'
		 imageData.width  = 512
		 imageData.height = 512
            } else {
	         img.src = imageData.url
	    }
	    let displacement = 0

	    if (imageData.width == imageData.height) {
	        img.width = 256
	        img.height = 256
		img.style.borderTopRightRadius = "8px"
		img.style.borderTopLeftRadius  = "8px"
	    } else if ( imageData.height > imageData.width ) {
	        img.height = 256
		img.width = imageData.width * 256 / imageData.height
		img.style.marginLeft = (256 - img.width) / 2 + "px"
	    } else {
	        img.width = 256
		img.height = imageData.height * 256 / imageData.width
		img.style.marginTop = (256 - img.height) / 2 + "px"
	    }
	    d.appendChild(innerdiv)
	    innerdiv.appendChild(img)
	    d.appendChild(labeldiv)
	    resultsPane.appendChild(d)
	})
    }

    
    await updateModels()
    await updateModelTokenSection()
    document.querySelector('#modelmgr-sd').addEventListener('change', persistTokens)


    stableDiffusionModelField.addEventListener('change', updateModelTokenSection)

})()


