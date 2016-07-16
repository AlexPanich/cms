<?php

Route::get('/user', [
    'uses' => 'UsersController@index',
    'as' => 'all_users'
]);

Route::get('/user/create', [
    'uses' => 'UsersController@create',
    'as' => 'create_user'
]);

Route::post('/user/store', [
    'uses' => 'UsersController@store',
    'as' => 'add_user'
]);

Route::get('/user/edit/{user}', [
    'uses' => 'UsersController@edit',
    'as' => 'edit_user'
]);

Route::post('/user/update/{user}', [
    'uses' => 'UsersController@update',
    'as' => 'update_user'
]);

Route::get('/user/destroy/{user}', [
    'uses' => 'UsersController@destroy',
    'as' => 'delete_user'
]);