$(document).ready(function() {
	
	var widgets = [];
	document.body.addEventListener('click', function(e) {
		if(e.target.classList.contains('circle') || e.target.classList.contains('save') ) {
			e.preventDefault();
		}
	}, true);
	
	$('*[widget-toggle]').each(function(){
		if($(this).css('position') == 'static')
			$(this).css('position', 'relative');

		var styles = {
			background: '#ff0',
			position: 'absolute',
			top: '-16px',
			left: '0px',
			cursor: 'pointer',
			display: 'none',
			'z-index': 100,
			'font-size': '14px'
		};

		var widget = getWidget(this);
		$('<div class="widget_edit">Сохранить</div>').prependTo(this).addClass('save').css(styles);
		widgets.push(widget);
	});

});
