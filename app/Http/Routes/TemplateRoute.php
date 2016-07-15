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

Route::post('template/upgrade/{template}', [
    'uses' => 'TemplatesController@upgrade',
    'as' => 'upgrade_template'
]);

Route::post('template/delete/{template}', [
    'uses' => 'TemplatesController@delete',
    'as' => 'delete_template'
]);
