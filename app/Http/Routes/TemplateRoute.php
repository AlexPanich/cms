<?php

Route::get('template', [
    'uses' => 'TemplatesController@index',
    'as' => 'all_templates'
]);

Route::get('template/create', [
    'uses' => 'TemplatesController@create',
    'as' => 'create_template'
]);

Route::post('template/store', [
    'uses' => 'TemplatesController@store',
    'as' => 'add_template'
]);

Route::get('template/edit/{template}', [
    'uses' => 'TemplatesController@edit',
    'as' => 'edit_template'
]);

Route::post('template/update/{template}', [
    'uses' => 'TemplatesController@update',
    'as' => 'update_template'
]);

Route::get('template/destroy/{template}', [
    'uses' => 'TemplatesController@destroy',
    'as' => 'delete_template'
]);
