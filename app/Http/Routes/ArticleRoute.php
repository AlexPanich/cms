<?php
Route::get('/article', [
    'uses' => 'ArticlesController@index',
    'as' => 'all_articles'
]);

Route::get('/article/show/{article}', [
    'uses' => 'ArticlesController@show',
    'as' => 'show_article'
]);

Route::get('/article/create', [
    'uses' => 'ArticlesController@create',
    'as' => 'create_article'
]);

Route::post('/article/store', [
    'uses' => 'ArticlesController@store',
    'as' => 'add_article'
]);

Route::get('/article/edit/{article}', [
    'uses' => 'ArticlesController@edit',
    'as' => 'edit_article'
]);

Route::post('/article/update/{article}', [
    'uses' => 'ArticlesController@update',
    'as' => 'update_article'
]);

Route::post('/article/delete/{article}', [
    'uses' => 'ArticlesController@destroy',
    'as' => 'delete_article'
]);