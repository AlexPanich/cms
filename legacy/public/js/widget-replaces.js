function getReplaceObject(elem, act){
	var type = elem.attr('replace');
	
	switch(type){
		case 'input':
			return new replaceInput(elem, act);
		case 'textarea':
			return new replaceTextarea(elem, act);
		case 'tiny':
			return new replaceTinyMCE(elem, act);
		case 'modal':
			return new replaceModal(elem, act);
		default: 
			return new replaceInput(elem, act);
	}
}

function replaceInput(elem, act){
	this.elem = elem;
	this.act = act;
	this.replace = '';
	
	this.getVal = function(){
		return this.replace.val();
	}
	
	this.setVal = function(){
		this.replace.val(this.elem.html());
	}
	
	this.object = function(){
		this.replace = $('<input type="text" style="color: #333">');
		this.setVal();
		return this.replace;
	}
	
	this.init = function(){
		// специальные действия для иниализации. В простом инпуте неактуальны

		this.replace.click(function(e){
			e.preventDefault();
			e.stopPropagation();
		});
	}
	
	this.destroy = function(){
		this.replace.remove();
	}
}

function replaceTextarea(elem, act){
	replaceInput.call(this, elem, act); // наследуемся
	
	this.getVal = function(){
		return this.replace.val().replace('\r\n', '<br>').replace('\n', '<br>');
	}
	
	this.setVal = function(){
		var html = this.elem.html();
		html = html.replace('<br>', '\n').replace('<br/>', '\n').replace('<br >', '\n').replace('<br />', '\n');
		this.replace.val(html);
	}
	
	this.object = function(){
		this.replace = $('<textarea></textarea>');
		this.setVal();
		return this.replace;
	}
}

function replaceTinyMCE(elem, act){
	replaceInput.call(this, elem, act); // наследуемся

	this.getVal = function(){
		return tinymce.editors.replace.getContent()
	}

	this.setVal = function(){
		var tM = this;

		$.ajax({
			url: '/frontedit/get' + this.act,
			type: 'POST',
			data: {id: elem.record_id, _token: token},
			dataType: 'json',
			async: false,
			success: function(data){
				if(data !== null)
					tM.replace.val(data[elem.attr('change_key')]);
				else
					tM.replace.val('Some errors on server! Do not save it!');
			},
			error: function(){
				tM.replace.val('Some errors on server! Do not save it!');
			}
		});
	}

	this.object = function(){
		this.replace = $('<textarea id="replace"></textarea>');
		this.setVal();
		return this.replace;
	}

	this.init = function(){
		var editor_config = {
			path_absolute : "/",
			selector: "textarea",
			language: "ru",
			plugins: [
				"advlist autolink lists link image charmap print preview hr anchor pagebreak",
				"searchreplace wordcount visualblocks visualchars code fullscreen",
				"insertdatetime media nonbreaking save table contextmenu directionality",
				"emoticons template paste textcolor colorpicker textpattern gallery"
			],
			toolbar: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media gallery",
			relative_urls: false,
			file_browser_callback : function(field_name, url, type, win) {
				var x = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
				var y = window.innerHeight|| document.documentElement.clientHeight|| document.getElementsByTagName('body')[0].clientHeight;

				var cmsURL = editor_config.path_absolute + 'laravel-filemanager?field_name=' + field_name;
				if (type == 'image') {
					cmsURL = cmsURL + "&type=Images";
				} else {
					cmsURL = cmsURL + "&type=Files";
				}

				tinyMCE.activeEditor.windowManager.open({
					file : cmsURL,
					title : 'Filemanager',
					width : x * 0.8,
					height : y * 0.8,
					resizable : "yes",
					close_previous : "no"
				});
			},
			content_css: ['/css/gallery.css']
		};

		tinymce.init(editor_config);
	}

	this.destroy = function(){
		this.replace.remove();
		$('#mceu_17').remove();
		location.reload();
	}
}