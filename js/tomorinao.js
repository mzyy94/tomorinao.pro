window.addEventListener("DOMContentLoaded",function(){
	var tomorinaos = document.getElementById("tomorinaos").getElementsByTagName("a");
	Array.prototype.forEach.call(tomorinaos,function(tomorinao){
		var url=tomorinao.href;
		tomorinao.href="data:text/html;base64,"+btoa('<meta http-equiv="refresh" content="0;URL='+url+'">');
	});
});
