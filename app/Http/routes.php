<?php

$routes = array_slice(scandir(__DIR__ . '/Routes'), 2);

foreach($routes as $route) {
    require_once __DIR__ . '/Routes/' . $route;
}

Route::get('/', [
    'uses' => 'FrontController@index',
    'as' => 'index'
]);

Route::auth();

Route::get('/dashboard', [
    'uses' => 'DashboardController@index',
    'as' => 'dashboard'
]);

Route::post('/search', [
    'uses' => 'FrontController@search',
    'as' => 'search'
]);

Route::any('/tynimce/gallery', [
    'uses' => 'TinyMCEController@gallery'
]);



Route::get('/{url}', [
    'uses' => 'FrontController@getByUrl',
    'as' => 'url'
])->where('url', '[A-Za-z0-9\/\-\_]+');

