

function renderDocument2(link, item, path) {
  if(!ACE.sidebarStyle) {
    let newStyle = readFile("library/styles/sidebar.css");
    ACE.sidebarStyle = document.createElement('STYLE')
    ACE.sidebarStyle.innerText = newStyle
    document.body.insertBefore(ACE.sidebarStyle, ACE.fileList)
  }
  /*
  for(let i = 0; i < ACE.documentation.length; i++) {
		let replacedName = ACE.documentation[i]
			.replace('.js', '.md')
			.replace(/\//g, '_')
		if(replacedName != path) {
			continue
		}
    */
}