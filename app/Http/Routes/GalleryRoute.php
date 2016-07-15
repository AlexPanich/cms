<?php

Route::get('/gallery', [
    'uses' => 'GalleriesController@index',
    'as' => 'gallery'
]);

Route::get('/gallery/create', [
    'uses' => 'GalleriesController@create',
    'as' => 'create_gallery'
]);

Route::post('/gallery/store', [
    'uses' => 'GalleriesController@store',
    'as' => 'add_gallery'
]);

Route::get('/gallery/edit/{gallery}', [
    'uses' => 'GalleriesController@edit',
    'as' => 'edit_gallery'
]);

Route::post('/gallery/update/{gallery}', [
    'uses' => 'GalleriesController@update',
    'as' => 'update_gallery'
]);

Route::get('/gallery/upload/{gallery}', [
    'uses' => 'GalleriesController@upload',
    'as' => 'upload_gallery'
]);

Route::post('/gallery/upload_image/{gallery}', [
    'uses' => 'GalleriesController@uploadImage',
    'as' => 'upload_image_gallery',
]);

Route::post('/gallery/edit/{gallery}/sorting', [
    'uses' => 'GalleriesController@sorting',
    'as' => 'sorting_image_gallery'
]);

Route::post('/gallery/delete_image/{image}', [
    'uses' => 'GalleriesController@deleteImage',
    'as' => 'delete_image_gallery'
]);

Route::get('/gallery/view/{gallery}', [
    'uses' => 'GalleriesController@view',
    'as' => 'view_gallery'
]);