<?php

Route::get('/pages', [
    'uses' => 'PagesController@index',
    'as' => 'all_pages'
]);

Route::get('/pages/tree', [
    'uses' => 'PagesController@tree',
    'as' => 'all_pages_tree'
]);

Route::get('/pages/create', [
    'uses' => 'PagesController@create',
    'as' => 'create_page'
]);

Route::post('/pages/store', [
    'uses' => 'PagesController@store',
    'as' => 'add_page'
]);

Route::get('/pages/edit/{page}', [
    'uses' => 'PagesController@edit',
    'as' => 'edit_page'
]);

Route::post('/pages/update/{page}', [
    'uses' => 'PagesController@update',
    'as' => 'update_page'
]);

Route::get('/pages/destroy/{page}', [
    'uses' => 'PagesController@destroy',
    'as' => 'delete_page'
]);