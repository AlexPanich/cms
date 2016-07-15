tinymce.PluginManager.add('gallery', function (editor, url) {
    // Add a button that opens a window
    editor.addButton('gallery', {
        onclick: function () {
            tinymce.util.XHR.send({
                url: '/tynimce/gallery',
                success: function (data) {
                    var galleries = JSON.parse(data);

                    var values = galleries.map(function (elem) {
                        return {
                            text: elem.name,
                            value: elem.name
                        }
                    })

                    editor.windowManager.open({
                        title: 'Вставить галерею',
                        buttons: [{
                            text: 'Вставить',
                            onclick: 'submit'
                        }, {
                            text: 'Закрыть',
                            onclick: 'close'
                        }],
                        body: [
                            {
                                type: 'combobox',
                                name: 'combobox',
                                label: 'Выберите галлерею',
                                values: values
                            }
                        ],

                        onsubmit: function (e) {
                            // Insert content when the window form is submitted
                            if (e.data.combobox) {
                                editor.insertContent('[[--widget/gallery/' + e.data.combobox + '--]]');
                            }
                        }
                    });
                }
            });
        },
        text: 'Gallery',
        icon: false
    });
});

