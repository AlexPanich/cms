<?php

Route::get('/text', [
    'uses' => 'TextsController@index',
    'as' => 'all_texts'
]);

Route::get('/text/create', [
    'uses' => 'TextsController@create',
    'as' => 'create_text'
]);

Route::post('/text/store', [
    'uses' => 'TextsController@store',
    'as' => 'add_text'
]);

Route::get('text/edit/{text}', [
    'uses' => 'TextsController@edit',
    'as' => 'edit_text'
]);

Route::post('/text/update/{text}', [
    'uses' => 'TextsController@update',
    'as' => 'update_text'
]);

Route::get('/text/delete/{text}', [
    'uses' => 'TextsController@destroy',
    'as' => 'delete_text'
]);