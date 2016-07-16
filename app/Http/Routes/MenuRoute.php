<?php

Route::get('/menu', [
    'uses' => 'MenusController@index',
    'as' => 'all_menu'
]);

Route::get('/menu/create', [
    'uses' => 'MenusController@create',
    'as' => 'create_menu'
]);

Route::post('/menu/store', [
    'uses' => 'MenusController@store',
    'as' => 'add_menu'
]);

Route::get('/menu/edit/{menu}', [
    'uses' => 'MenusController@edit',
    'as' => 'edit_menu'
]);

Route::post('/menu/update/{menu}', [
    'uses' => 'MenusController@update',
    'as' => 'update_menu'
]);

Route::get('/menu/destroy/{menu}', [
    'uses' => 'MenusController@destroy',
    'as' => 'delete_menu'
]);

Route::get('/menu/sort/{menu}', [
    'uses' => 'MenusController@sort',
    'as' => 'sort_menu'
]);

Route::post('/menu/sorting/{menu}', [
    'uses' => 'MenusController@sorting',
    'as' => 'sorting_menu'
]);
