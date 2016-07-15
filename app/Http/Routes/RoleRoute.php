<?php

Route::get('/role', [
    'uses' => 'RolesController@index',
    'as' => 'all_roles'
]);

Route::get('/role/create', [
    'uses' => 'RolesController@create',
    'as' => 'create_role'
]);

Route::post('/role/store', [
    'uses' => 'RolesController@store',
    'as' => 'add_role'
]);

Route::get('role/edit/{role}', [
    'uses' => 'RolesController@edit',
    'as' => 'edit_role'
]);

Route::post('/role/update/{role}', [
    'uses' => 'RolesController@update',
    'as' => 'update_role'
]);

Route::post('/role/delete/{role}', [
    'uses' => 'RolesController@destroy',
    'as' => 'delete_role'
]);