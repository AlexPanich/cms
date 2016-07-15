<?php

Route::get('/document', [
    'uses' => 'DocumentsController@index',
    'as' => 'all_documents'
]);

Route::get('/document/create', [
    'uses' => 'DocumentsController@create',
    'as' => 'create_document'
]);

Route::post('/document/store', [
    'uses' => 'DocumentsController@store',
    'as' => 'add_document'
]);

Route::get('document/edit/{document}', [
    'uses' => 'DocumentsController@edit',
    'as' => 'edit_document'
]);

Route::post('/document/update/{document}', [
    'uses' => 'DocumentsController@update',
    'as' => 'update_document'
]);

Route::get('/document/delete/{document}', [
    'uses' => 'DocumentsController@destroy',
    'as' => 'delete_document'
]);

Route::post('document/upload', [
    'uses' => 'DocumentsController@upload',
    'as' => 'upload_document'
]);

