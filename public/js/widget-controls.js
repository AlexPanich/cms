function getWidget(widget){
	var act = $(widget).attr('widget-toggle');
	
	switch(act){
		case 'page':
		case 'text':
			return new widget_edit(widget);
		case 'article':
			return new widget_modal(widget);
		default: 
			return new widget_edit(widget);
	}
}

function base_widget(widget)
{
	this.widget = $(widget);
	this.act = this.widget.attr('widget-toggle'); // страница, текст или статья
	this.id = this.widget.attr('id_widget_note');
	this.lets_go = true;
	var that = this;
	
	// зелёные кружки слева от полей, чтобы понимали, куда можно тыкать
	this.span = $('<span> </span>').css({
		position: 'absolute',
		padding: '5px',
		left: '-10px',
		background: '#0f0',
		'border-radius': '50%',
		cursor: 'pointer',
		index: 10000
	}).addClass('circle').click(function(e){
		e.preventDefault();
		e.stopPropagation();
		that.replace($(this).next());
	});
	
	this.widget.find('*[change_key]').before(that.span);
}

function widget_edit(widget)
{
	base_widget.call(this, widget);
	var that = this;
	
	this.replace = function(elem){
		elem.record_id = that.id;
		
		if(!that.lets_go)
			return false;
	
		that.lets_go = false;
		
		var replace = getReplaceObject(elem, that.act);
		elem.hide();
		elem.after(replace.object());
		replace.init();
		
		that.widget.find('.widget_edit').fadeIn(300).bind('click', function(e){
			e.stopPropagation();
			that.save(elem, replace);
		});
	}
	
	this.save = function(elem, replace){
		var obj = {id: that.id};
		var name = elem.attr('change_key');
		obj[name] = replace.getVal();
		obj['_token'] = token;

		$.post('frontedit/save' + that.act, obj, {}, 'json')
			.done(function(data){
				var text = data[name]
				elem.html(text).show();
				replace.destroy();
				that.widget.find('.widget_edit').fadeOut(300).unbind('click');
				that.lets_go = true;
			})
			.fail(function(data){
				var errorMessage = '';
				if(data.status == 422) {
					errorMessage += 'Ошибка валидации данных: ' + data.responseJSON.content[0];
				} else {
					errorMessage = data.error;
				}

				alert(errorMessage);

				replace.setVal();
			});

	}
}

function widget_modal(widget)
{
	base_widget.call(this, widget);
	this.window;
	this.path = '/articles/edit/' + this.id;
	var that = this;
	
	this.replace = function(elem){
		if(that.window != null)
			that.window.focus();
	
		that.window = window.open(that.path, 'new', 'width=600,height=480,resizable=yes,scrollbars=yes,status=yes');
		
		var timer = setInterval(function(){
			if(that.window.location.pathname != that.path){
				that.window.close();
				document.location.reload();
				that.window = null;
				clearInterval(timer);
			}
		}, 300);
	}
}